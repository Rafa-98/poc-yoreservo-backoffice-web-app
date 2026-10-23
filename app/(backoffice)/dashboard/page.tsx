import { redirect } from "next/navigation";
import { requireSession } from "@/shared/auth/index.server";
import { getDefaultRouteForRole } from "@/shared/config";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await requireSession();
  redirect(getDefaultRouteForRole(session.user.role));
}
