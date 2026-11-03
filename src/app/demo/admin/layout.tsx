import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoAdminApi, DemoAdminShell } from "@/components/demo/demo-admin";
import { isLive } from "@/lib/config";

export const metadata: Metadata = {
  title: { default: "Demo admin", template: "%s · Demo admin" },
  robots: { index: false, follow: false },
};

/** The demo admin exists only in demo builds. A live store's admin is /admin, behind sign-in. */
export default function DemoAdminLayout({ children }: LayoutProps<"/demo/admin">) {
  if (isLive) notFound();
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <DemoAdminApi>
        <DemoAdminShell>{children}</DemoAdminShell>
      </DemoAdminApi>
    </div>
  );
}
