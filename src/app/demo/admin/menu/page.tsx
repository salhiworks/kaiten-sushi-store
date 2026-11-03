import type { Metadata } from "next";
import { DemoMenuPage } from "@/components/demo/demo-admin";

export const metadata: Metadata = { title: "Menu" };

export default function Page() {
  return <DemoMenuPage />;
}
