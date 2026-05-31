import { Aleo, Host_Grotesk } from "next/font/google";

/** Display fonts for landing headlines — Aleo (serif, thin) + Host Grotesk
 *  (sans, light), alternated per line for the brand's editorial headline look. */
export const aleo = Aleo({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export const hostGrotesk = Host_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});
