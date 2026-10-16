import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { fontDisplay, fontSans } from "@/_app/fonts";
import { Providers } from "@/_app/providers";
import "@/_app/styles/globals.css";
import { SITE } from "@/shared/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");

  return {
    title: {
      default: `${SITE.name} ${SITE.surface} | ${t("tagline")}`,
      template: `%s | ${SITE.name} ${SITE.surface}`,
    },
    description: t("description"),
    applicationName: `${SITE.name} ${SITE.surface}`,
    // Internal operations panel: never indexed.
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The app ships its own light and dark themes (see shared/lib/theme).
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8faf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b100b" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${fontSans.variable} ${fontDisplay.variable}`}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}