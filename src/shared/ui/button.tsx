import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib";
import { Spinner } from "./spinner";

/**
 * Exported so that `<Link>` (Server Components) can look like a button:
 *   <Link href="/login" className={buttonVariants({ variant: "primary" })}>
 */
export const buttonVariants = cva(
  [
    "relative inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap",
    "rounded-xl font-semibold transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
  ],
  {
    variants: {
      variant: {
        /** Main call to action (lime). Exactly ONE per view. */
        primary:
          "bg-accent text-accent-foreground shadow-cta hover:-translate-y-px hover:shadow-cta-hover hover:brightness-105",
        /** Secondary action with a visible border. */
        secondary:
          "border border-border-medium bg-surface text-foreground hover:border-border-strong hover:bg-muted",
        /** Dark forest action for dense/administrative surfaces. */
        dark: "border border-transparent bg-primary text-primary-foreground hover:bg-primary-hover dark:border-border-medium",
        /** Destructive action (cancel booking, deactivate user...). */
        destructive:
          "border border-status-cancelled-border bg-destructive-subtle text-destructive hover:brightness-95",
        /** Low emphasis action. */
        ghost: "text-foreground hover:bg-muted",
        /** Inline text link styled as a button element. */
        link: "h-auto rounded-md px-0 text-link underline-offset-4 hover:text-link-hover hover:underline",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-12 px-6 text-base",
        lg: "h-14 px-8 text-base",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** Shows a spinner, sets `aria-busy` and blocks clicks. */
  isLoading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  fullWidth,
  isLoading = false,
  disabled,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <Spinner /> : null}
      {children}
    </button>
  );
}
