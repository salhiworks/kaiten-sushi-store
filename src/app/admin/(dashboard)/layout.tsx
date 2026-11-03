import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminShell, AdminShellFallback } from "@/components/admin/admin-shell";
import { LiveAdminApi } from "@/components/admin/live-admin-api";
import { NoAccess } from "@/components/admin/no-access";
import { signOut } from "@/lib/admin/actions";
import { getAdminSession, getSettingsForAdmin } from "@/lib/admin/data";
import { isLive } from "@/lib/config";

export default function DashboardLayout({ children }: LayoutProps<"/admin">) {
  // The public demo has no admin at all.
  if (!isLive) notFound();
  return (
    <Suspense fallback={<AdminShellFallback />}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

/** Every dashboard page renders only for signed-in admins. */
async function Gate({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (session.status !== "admin") return <NoAccess email={session.email} />;
  const settings = await getSettingsForAdmin(session.db);
  return (
    <LiveAdminApi>
      <AdminShell restaurantName={settings.name} acceptingOrders={settings.acceptingOrders} email={session.email} signOut={signOut}>
        {children}
      </AdminShell>
    </LiveAdminApi>
  );
}
