import { LoaderCircle } from "lucide-react";
import { cn } from "@/shared/lib";

export function Spinner({ className }: { className?: string }) {
  return (
    <LoaderCircle
      aria-hidden="true"
      className={cn("size-5 animate-spin", className)}
    />
  );
}
