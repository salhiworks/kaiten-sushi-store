import type { Metadata } from "next";
import { DemoPlatesPage } from "@/components/demo/demo-admin";

export const metadata: Metadata = { title: "Plates & prices" };

export default function Page() {
  return <DemoPlatesPage />;
}
