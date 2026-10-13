import type { ReactNode } from "react";
import { requireSession } from "@/shared/auth/index.server";
import { AuthenticatedLayout } from "@/_app/layouts";

export default async function BackofficeRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();

  return (
    <AuthenticatedLayout user={session.user}>
      {children}
    </AuthenticatedLayout>
  );
}
