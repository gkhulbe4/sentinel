import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RuleForm } from "@/features/watchlist/rule-form";
import { RuleList } from "@/features/watchlist/rule-list";

export default function WatchlistPage() {
  return (
    <div>
      <PageHeader title="Watchlist" description="Rules that trigger your live alerts." />
      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Add a rule</CardTitle>
          </CardHeader>
          <CardContent>
            <RuleForm />
          </CardContent>
        </Card>
        <RuleList />
      </div>
    </div>
  );
}
