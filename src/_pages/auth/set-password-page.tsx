import { Suspense } from "react";
import { AuthShellLayout } from "@/features/auth/ui/auth-shell-layout";
import { SetPasswordForm } from "@/features/auth/ui/set-password-form";
import { ShieldAlert } from "lucide-react";

export function SetPasswordPage() {
  return (
    <AuthShellLayout
      bgImageSrc="/san-agustin-del-paraiso.jpg"
      badgeText="Invitación de Staff"
      subtitle="Bienvenido al Equipo"
      heading="Activa tu cuenta y define tu contraseña segura"
      description="Has sido invitado a formar parte del equipo de gestión deportiva en YoReservo. Configura tus credenciales para comenzar."
      bannerCard={
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-accent/20 text-accent">
              <ShieldAlert className="size-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                Acceso Asignado: Recepcionista / Validador
              </div>
              <div className="text-xs font-medium text-accent">
                Recinto: Club San Agustín
              </div>
            </div>
          </div>
        </div>
      }
    >
      <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-2xl bg-surface" />}>
        <SetPasswordForm />
      </Suspense>
    </AuthShellLayout>
  );
}
