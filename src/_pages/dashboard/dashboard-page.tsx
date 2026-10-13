import Link from "next/link";
import {
  Calendar,
  CreditCard,
  Layers,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Building,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/shared/auth/index.server";
import { ROUTES } from "@/shared/config";

export async function DashboardPage() {
  const t = await getTranslations("shell");
  const session = await getSession();
  const user = session?.user;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-card">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent-foreground border border-accent/30 mb-2">
              <ShieldCheck className="size-3.5" />
              <span>{user?.role} • Consola Operativa</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
              ¡Bienvenido, {user?.name} {user?.lastName}!
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Panel de control y operaciones de YoReservo Backoffice Pro.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.agenda}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs sm:text-sm font-bold text-accent-foreground shadow-xs hover:brightness-105 transition-all"
            >
              <Calendar className="size-4" />
              <span>Ver Agenda Multi-Cancha</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Highlights Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Ocupación Hoy</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-foreground">84.2%</div>
          <div className="mt-1 text-xs text-status-available-fg font-medium">↑ +12% vs. semana anterior</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Reservas Activas</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600">
              <Layers className="size-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-foreground">24</div>
          <div className="mt-1 text-xs text-muted-foreground">4 pendientes por check-in</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Pago Móvil por Conciliar</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
              <CreditCard className="size-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-foreground">3</div>
          <div className="mt-1 text-xs text-amber-600 font-medium">Bandeja de verificación</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Tasa BCV Oficial</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-foreground">36.52 Bs/$</div>
          <div className="mt-1 text-xs text-status-available-fg font-medium">Sincronizado hoy 09:00 AM</div>
        </div>
      </div>
    </div>
  );
}
