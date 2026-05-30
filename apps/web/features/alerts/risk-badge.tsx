import type { RiskFlag } from "@sentinel/shared";
import { Badge, type BadgeProps } from "@/components/ui/badge";

type Variant = NonNullable<BadgeProps["variant"]>;

const MAP: Record<RiskFlag, { variant: Variant; label: string }> = {
  none: { variant: "green", label: "No risk" },
  low: { variant: "blue", label: "Low risk" },
  medium: { variant: "amber", label: "Medium risk" },
  high: { variant: "red", label: "High risk" },
};

export function RiskBadge({ flag }: { flag: RiskFlag | null }) {
  if (!flag) {
    return (
      <Badge variant="neutral" title="Awaiting AI enrichment">
        analyzing…
      </Badge>
    );
  }
  const { variant, label } = MAP[flag];
  return <Badge variant={variant}>{label}</Badge>;
}
