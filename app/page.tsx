import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HomePage } from "@/_pages/home";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.titles");
  return { title: t("home") };
}

// Temporary foundation screen: replaced by the redirect to /login or /dashboard (Auth module).
export default HomePage;