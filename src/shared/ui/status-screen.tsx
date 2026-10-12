import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface StatusScreenProps {
  icon: LucideIcon;
  /** Short label above the title, e.g. "Error 404". */
  eyebrow?: string;
  title: string;
  description: string;
  /** Action buttons / links. */
  children?: ReactNode;
}

/** Full-screen message used by 404 and error boundaries. */
export function StatusScreen({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: StatusScreenProps) {
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-12">
      <div className="mx-auto flex w-full max-w-md animate-fade-up flex-col items-center text-center">
        <span className="mb-6 grid size-20 place-items-center rounded-3xl border border-border bg-surface text-link shadow-card">
          <Icon aria-hidden="true" className="size-9" />
        </span>
        {eyebrow ? (
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-link">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-pretty text-muted-foreground">{description}</p>
        {children ? (
          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            {children}
          </div>
        ) : null}
      </div>
    </main>
  );
}
