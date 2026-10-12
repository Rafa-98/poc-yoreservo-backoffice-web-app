import { Inter, Outfit } from "next/font/google";

/** Body / UI font. */
export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Display font used for headings (`font-display`). */
export const fontDisplay = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});