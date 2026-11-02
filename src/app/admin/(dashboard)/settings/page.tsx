import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { getAdminSession, getSettingsForAdmin } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Restaurant" };

export default function SettingsPage() {
  return (
    <>
      <AdminPageHeader title="Restaurant" description="Your name, pickup details and opening hours. Guests can only place orders while you are open and taking orders." />
      <Suspense fallback={<div aria-busy="true" className="h-96" />}>
        <Settings />
      </Suspense>
    </>
  );
}

async function Settings() {
  const session = await getAdminSession();
  if (session.status !== "admin") return null;
  return <SettingsForm settings={await getSettingsForAdmin(session.db)} />;
}
