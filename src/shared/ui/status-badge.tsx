import { useTranslations } from "next-intl";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/lib";

/**
 * Operational statuses shared by agenda slots and bookings
 * (see `STYLE_GUIDE.md` §2.3 in the backoffice designs).
 * Each one maps to a `status-<name>-{bg,fg,border}` token triplet.
 */
export const OPERATIONAL_STATUSES = [
  "available",
  "hold",
  "confirmed",
  "completed",
  "cancelled",
  "blocked",
] as const;

export type OperationalStatus = (typeof OPERATIONAL_STATUSES)[number];

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
  {
    variants: {
      status: {
        available:
          "border-status-available-border bg-status-available-bg text-status-available-fg",
        hold: "border-status-hold-border bg-status-hold-bg text-status-hold-fg",
        confirmed:
          "border-status-confirmed-border bg-status-confirmed-bg text-status-confirmed-fg",
        completed:
          "border-status-completed-border bg-status-completed-bg text-status-completed-fg",
        cancelled:
          "border-status-cancelled-border bg-status-cancelled-bg text-status-cancelled-fg",
        blocked:
          "border-status-blocked-border bg-status-blocked-bg text-status-blocked-fg",
      },
    },
  },
);

/**
 * Pill with a status dot.
 * Deliberately NOT a "use client" module: it also exports the `OPERATIONAL_STATUSES`
 * constant, which Server Components must be able to read as a real array.
 * The label comes from `status.operational.*`.
 */
export function StatusBadge({
  status,
  className,
}: {
  status: OperationalStatus;
  className?: string;
}) {
  const t = useTranslations();

  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {t(`status.operational.${status}`)}
    </span>
  );
}