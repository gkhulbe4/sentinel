import type { ReactNode } from "react";
import { SectionFrame } from "@/components/landing/section-frame";
import { SectionHeader } from "@/components/landing/section-header";

type SectionCTA = { label: string; href?: string; icon?: ReactNode };

export function SectionShell({
  title,
  subtitle,
  cta,
  children,
}: {
  title: ReactNode;
  subtitle: string;
  cta?: SectionCTA;
  children: ReactNode;
}) {
  return (
    <section>
      <SectionFrame className="px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <SectionHeader title={title} description={subtitle} cta={cta} />
        {children}
      </SectionFrame>
    </section>
  );
}
