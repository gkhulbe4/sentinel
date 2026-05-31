import { ArrowLeftRight, Coins, Send, Wallet, type LucideIcon } from "lucide-react";
import type { EventType } from "@sentinel/shared";

/** Icon per on-chain event type — shared by the alert cards and details dialog. */
export const EVENT_ICON: Record<EventType, LucideIcon> = {
  TOKEN_SWAP: ArrowLeftRight,
  SOL_TRANSFER: Send,
  NEW_TOKEN: Coins,
  WALLET_ACTIVITY: Wallet,
};
