import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginPage } from "@/_pages/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return {
    title: t("loginTitle"),
  };
}

export default function Page() {
  return <LoginPage />;
}
