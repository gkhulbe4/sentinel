export const LANDING_SECTIONS = {
  features: "#features",
  live: "#live",
  how: "#how",
  useCases: "#use-cases",
  faq: "#faq",
  cta: "#cta",
} as const;

export const LANDING_ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  ...LANDING_SECTIONS,
} as const;

export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Features", href: LANDING_SECTIONS.features },
  { label: "How it works", href: LANDING_SECTIONS.how },
  { label: "Use cases", href: LANDING_SECTIONS.useCases },
  { label: "FAQ", href: LANDING_SECTIONS.faq },
];

export const FOOTER_LINKS: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: "Features", href: LANDING_SECTIONS.features },
    { label: "Live feed", href: LANDING_SECTIONS.live },
    { label: "How it works", href: LANDING_SECTIONS.how },
    { label: "FAQ", href: LANDING_SECTIONS.faq },
  ],
  "Use cases": [
    { label: "Traders", href: LANDING_SECTIONS.useCases },
    { label: "Protocol teams", href: LANDING_SECTIONS.useCases },
    { label: "Security & monitoring", href: LANDING_SECTIONS.useCases },
    { label: "Funds & desks", href: LANDING_SECTIONS.useCases },
  ],
  Account: [
    { label: "Sign in", href: LANDING_ROUTES.login },
    { label: "Create account", href: LANDING_ROUTES.signup },
    { label: "Dashboard", href: "/dashboard" },
  ],
};

export const LEGAL_LINKS = [
  { label: "Privacy", href: LANDING_ROUTES.home },
  { label: "Terms", href: LANDING_ROUTES.home },
] as const;
