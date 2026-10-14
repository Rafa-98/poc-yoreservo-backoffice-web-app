import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import { ProfilePage } from "@/_pages/profile/profile-page";
import { getProfileAction } from "@/features/profile/actions/profile-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profile");
  return {
    title: `${t("title")} | YoReservo Backoffice`,
    description: t("subtitle"),
  };
}

export default async function Page() {
  await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.profile]);
  const initialData = await getProfileAction();

  return <ProfilePage initialData={initialData} />;
}
