import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib";

const alertVariants = cva(
  "flex items-start gap-3 rounded-2xl border p-3.5 text-sm leading-snug text-foreground",
  {
    variants: {
      variant: {
        error: "border-destructive/30 bg-destructive-subtle",
        success: "border-success/30 bg-success-subtle",
        info: "border-border bg-muted",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

const ICONS = {
  error: { Icon: CircleAlert, className: "text-destructive" },
  success: { Icon: CircleCheck, className: "text-success" },
  info: { Icon: Info, className: "text-link" },
} as const;

interface AlertProps extends VariantProps<typeof alertVariants> {
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Inline feedback banner. Errors use role="alert" (assertive), the rest role="status". */
export function Alert({ variant = "info", title, children, className }: AlertProps) {
  const resolved = variant ?? "info";
  const { Icon, className: iconClassName } = ICONS[resolved];

  return (
    <div
      role={resolved === "error" ? "alert" : "status"}
      className={cn(
        alertVariants({ variant }),
        resolved === "error" && "animate-shake",
        className,
      )}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", iconClassName)} />
      <div className="min-w-0 space-y-0.5">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
