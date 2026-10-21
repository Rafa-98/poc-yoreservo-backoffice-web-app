import { Spinner } from "@/shared/ui/spinner";

export default function BackofficeLoading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
      <Spinner className="size-6 text-accent" />
      <p className="text-xs font-semibold tracking-wide uppercase animate-pulse">
        Cargando...
      </p>
    </div>
  );
}
