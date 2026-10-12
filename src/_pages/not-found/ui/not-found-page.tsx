import { SearchX } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/shared/config";
import { buttonVariants, StatusScreen } from "@/shared/ui";

export async function NotFoundPage() {
  const t = await getTranslations();

  return (
    <StatusScreen
      icon={SearchX}
      eyebrow={t("status.notFound.eyebrow")}
      title={t("status.notFound.title")}
      description={t("status.notFound.description")}
    >
      <Link href={ROUTES.root} className={buttonVariants({ size: "lg" })}>
        {t("common.actions.goHome")}
      </Link>
    </StatusScreen>
  );
}