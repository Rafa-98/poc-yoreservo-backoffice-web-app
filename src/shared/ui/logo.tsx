import { cn } from "@/shared/lib";

export const LOGO_SRC = "/logos/yoreservo-logo-transparent.png";

/**
 * YoReservo wordmark.
 *
 * Rendered as a CSS mask over a text-contrast token (`bg-foreground`) so a
 * single transparent asset works in light AND dark mode and can be recolored
 * with any utility (e.g. `bg-sidebar-foreground-active` on the sidebar).
 *
 * Source: derived from public/logos/yoreservo-logo.png (original left untouched).
 */
export function Logo({ className }: { className?: string }) {
  const mask = `url(${LOGO_SRC})`;

  return (
    <span
      role="img"
      aria-label="YoReservo"
      className={cn("block aspect-[1230/154] w-44 bg-foreground", className)}
      style={{
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
