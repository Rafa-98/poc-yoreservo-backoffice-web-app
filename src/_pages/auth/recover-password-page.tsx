import { Suspense } from "react";
import { AuthShellLayout } from "@/features/auth/ui/auth-shell-layout";
import { RecoverPasswordForm } from "@/features/auth/ui/recover-password-form";

export function RecoverPasswordPage() {
  return (
    <AuthShellLayout
      bgImageSrc="/padel-court.jpg"
      badgeText="Seguridad & Acceso"
      subtitle="Recuperación Segura"
      heading="Protección de credenciales y auditoría de accesos"
      description="Restablece tu acceso administrativo mediante un enlace criptográfico temporal enviado a tu correo institucional."
      bannerCard={
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="mb-1 text-sm font-semibold text-white">
            Nota de Seguridad:
          </div>
          <p className="text-xs leading-relaxed text-[#A2ADA0]">
            Los enlaces de recuperación tienen una validez estricta de 30 minutos y expiran inmediatamente tras el primer uso.
          </p>
        </div>
      }
    >
      <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-2xl bg-surface" />}>
        <RecoverPasswordForm />
      </Suspense>
    </AuthShellLayout>
  );
}
