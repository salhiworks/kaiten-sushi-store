import type { Metadata } from "next";
import { DemoSettingsPage } from "@/components/demo/demo-admin";

export const metadata: Metadata = { title: "Restaurant" };

export default function Page() {
  return <DemoSettingsPage />;
}
