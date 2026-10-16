import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SetPasswordPage } from "@/_pages/auth";
import { validateInvitationAction } from "@/features/auth/actions/set-password-action";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return {
    title: t("setpassTitle"),
  };
}

interface PageProps {
  searchParams?: Promise<{ token?: string }> | { token?: string };
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const token = resolvedParams?.token || "";
  const validation = token ? await validateInvitationAction(token) : null;
  const initialInvitation = validation && validation.ok ? validation.data : null;

  return <SetPasswordPage initialInvitation={initialInvitation} />;
}
