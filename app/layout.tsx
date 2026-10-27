import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { fontDisplay, fontSans } from "@/_app/fonts";
import { Providers } from "@/_app/providers";
import "@/_app/styles/globals.css";
import { SITE } from "@/shared/config";
import { PwaRegister } from "@/shared/ui/pwa-register";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const defaultTitle = `${SITE.name} ${SITE.surface} | ${t("tagline")}`;
  const description = t("description");
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://admin.yoreservo.nivis.cloud";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${SITE.name} ${SITE.surface}`,
    },
    description,
    applicationName: `${SITE.name} ${SITE.surface}`,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "YR BackOffice",
    },
    icons: {
      icon: [
        { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: ["/icons/icon-192x192.png"],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    openGraph: {
      type: "website",
      locale: "es_VE",
      url: siteUrl,
      siteName: `${SITE.name} ${SITE.surface}`,
      title: defaultTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description,
    },
    // Internal operations panel: never indexed.
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // The app ships its own light and dark themes (see shared/lib/theme).
  colorScheme: "light dark",
  themeColor: "#1F290F",
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
          <Providers>
            {children}
            <PwaRegister />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}