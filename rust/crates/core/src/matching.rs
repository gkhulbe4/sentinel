//! The pure rule-matching core. Deliberately allocation-free and side-effect
//! free so it is trivially testable and fast on the hot path.

use crate::types::{OnChainEvent, WatchRule};

/// Returns `true` if `event` satisfies `rule`.
///
/// A rule matches when, conjunctively:
/// - the rule is active,
/// - the event type equals the rule's type,
/// - if the rule pins a wallet, the event's `wallet` or `counterparty` equals it,
/// - if the rule sets a USD threshold, the event's `usd_value` is `>=` it.
pub fn match_rule(event: &OnChainEvent, rule: &WatchRule) -> bool {
    if !rule.is_active {
        return false;
    }
    if event.event_type != rule.event_type {
        return false;
    }
    if let Some(addr) = rule.wallet_addr.as_deref() {
        let hit = event.wallet == addr || event.counterparty.as_deref() == Some(addr);
        if !hit {
            return false;
        }
    }
    if let Some(min) = rule.min_usd {
        match event.usd_value {
            Some(v) if v >= min => {}
            _ => return false,
        }
    }
    true
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::EventType;
    use serde_json::json;

    fn event(event_type: EventType) -> OnChainEvent {
        OnChainEvent {
            signature: "sig".into(),
            slot: 1,
            event_type,
            wallet: "WALLET_A".into(),
            counterparty: Some("WALLET_B".into()),
            amount_sol: Some(10.0),
            usd_value: Some(1500.0),
            token_mint: None,
            raw: json!({}),
        }
    }

    fn rule(event_type: EventType) -> WatchRule {
        WatchRule {
            id: "r1".into(),
            user_id: "u1".into(),
            event_type,
            wallet_addr: None,
            min_usd: None,
            is_active: true,
        }
    }

    #[test]
    fn matches_when_type_equals_and_no_filters() {
        assert!(match_rule(&event(EventType::SolTransfer), &rule(EventType::SolTransfer)));
    }

    #[test]
    fn rejects_when_event_type_differs() {
        assert!(!match_rule(&event(EventType::SolTransfer), &rule(EventType::TokenSwap)));
    }

    #[test]
    fn rejects_inactive_rule() {
        let mut r = rule(EventType::SolTransfer);
        r.is_active = false;
        assert!(!match_rule(&event(EventType::SolTransfer), &r));
    }

    #[test]
    fn sol_transfer_over_threshold_matches_and_under_does_not() {
        let mut r = rule(EventType::SolTransfer);
        r.min_usd = Some(1000.0);
        assert!(match_rule(&event(EventType::SolTransfer), &r)); // 1500 >= 1000

        r.min_usd = Some(2000.0);
        assert!(!match_rule(&event(EventType::SolTransfer), &r)); // 1500 < 2000
    }

    #[test]
    fn token_swap_threshold_requires_usd_value_present() {
        let mut e = event(EventType::TokenSwap);
        e.usd_value = None;
        let mut r = rule(EventType::TokenSwap);
        r.min_usd = Some(1.0);
        assert!(!match_rule(&e, &r));
    }

    #[test]
    fn new_token_matches_on_type_alone() {
        assert!(match_rule(&event(EventType::NewToken), &rule(EventType::NewToken)));
    }

    #[test]
    fn wallet_rule_matches_primary_wallet() {
        let mut r = rule(EventType::WalletActivity);
        r.wallet_addr = Some("WALLET_A".into());
        assert!(match_rule(&event(EventType::WalletActivity), &r));
    }

    #[test]
    fn wallet_rule_matches_counterparty() {
        let mut r = rule(EventType::WalletActivity);
        r.wallet_addr = Some("WALLET_B".into());
        assert!(match_rule(&event(EventType::WalletActivity), &r));
    }

    #[test]
    fn wallet_rule_rejects_unrelated_wallet() {
        let mut r = rule(EventType::WalletActivity);
        r.wallet_addr = Some("WALLET_Z".into());
        assert!(!match_rule(&event(EventType::WalletActivity), &r));
    }

    #[test]
    fn combined_wallet_and_threshold() {
        let mut r = rule(EventType::TokenSwap);
        r.wallet_addr = Some("WALLET_A".into());
        r.min_usd = Some(1000.0);
        assert!(match_rule(&event(EventType::TokenSwap), &r));

        r.min_usd = Some(5000.0);
        assert!(!match_rule(&event(EventType::TokenSwap), &r));
    }
}
