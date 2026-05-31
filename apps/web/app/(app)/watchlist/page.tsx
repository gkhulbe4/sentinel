import { Check, Minus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RuleForm } from "@/features/watchlist/rule-form";
import { RuleList } from "@/features/watchlist/rule-list";

const REALTIME = [
  "Live activity on any wallet you add to a rule",
  "SOL transfers, with a live USD value",
  "Token swaps & new-token mints involving a watched wallet",
  "Sub-second alerts streamed over WebSocket",
];

const MOCKED = [
  "Market-wide activity (any swap/transfer across all of Solana)",
  "Every new token launch, chain-wide",
  "Large-trade / whale scanning without a target wallet",
  "These need the paid Yellowstone gRPC firehose",
];

export default function WatchlistPage() {
  return (
    <div>
      <PageHeader title="Watchlist" description="Rules that trigger your live alerts." />
      <div className="grid gap-6 md:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Add a rule</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add a <span className="font-medium text-foreground">wallet address</span> to watch its
              live on-chain activity. Leave it empty for sample data.
            </p>
          </CardHeader>
          <CardContent>
            <RuleForm />
          </CardContent>
        </Card>
        <RuleList />
      </div>

      {/* What's live vs sampled */}
      <Card className="mt-8">
        <CardContent className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="size-2 rounded-full bg-emerald-500" />
              Real-time on the free tier
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {REALTIME.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="size-2 rounded-full bg-amber-500" />
              Sample data (mocked for now)
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {MOCKED.map((item) => (
                <li key={item} className="flex gap-2">
                  <Minus className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
