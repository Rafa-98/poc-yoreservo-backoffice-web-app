import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AgendaPage } from "@/_pages/agenda/agenda-page";
import {
  getAgendaAction,
  getVenuesListAction,
} from "@/features/agenda/actions/agenda-actions";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("agenda");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function Page() {
  await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.agenda]);

  const [agendaRes, venuesRes] = await Promise.all([
    getAgendaAction(),
    getVenuesListAction(),
  ]);

  const initialAgenda = agendaRes.ok ? agendaRes.data : null;
  const initialVenues = venuesRes.ok ? venuesRes.data : [];

  return (
    <AgendaPage
      initialAgenda={initialAgenda}
      initialVenues={initialVenues}
    />
  );
}
