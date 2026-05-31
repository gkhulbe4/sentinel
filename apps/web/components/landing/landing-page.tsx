import { CtaSection } from "./cta-section";
import { FaqSection } from "./faq-section";
import { FeaturePillars } from "./feature-pillars";
import { Footer } from "./footer";
import { Hero } from "./hero";
import { HowItWorksSection } from "./how-it-works-section";
import { LiveFeedSection } from "./live-feed-section";
import { NavBar } from "./nav-bar";
import { PageRails, SectionWrap } from "./page-shell";
import { UseCasesSection } from "./use-cases-section";

export function LandingPage() {
  return (
    <div className="relative flex w-full flex-1 flex-col overflow-x-clip bg-background">
      <NavBar floatOnScroll />
      <main className="relative flex w-full flex-1 flex-col pt-14">
        <PageRails />
        <SectionWrap first>
          <Hero />
        </SectionWrap>
        <SectionWrap id="features">
          <FeaturePillars />
        </SectionWrap>
        <SectionWrap id="live">
          <LiveFeedSection />
        </SectionWrap>
        <SectionWrap id="how">
          <HowItWorksSection />
        </SectionWrap>
        <SectionWrap id="use-cases">
          <UseCasesSection />
        </SectionWrap>
        <SectionWrap id="faq">
          <FaqSection />
        </SectionWrap>
        <SectionWrap id="cta">
          <CtaSection />
        </SectionWrap>
      </main>
      <Footer />
    </div>
  );
}
