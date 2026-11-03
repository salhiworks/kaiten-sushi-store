import type { Metadata } from "next";
import { DemoOrdersPage } from "@/components/demo/demo-admin";

export const metadata: Metadata = { title: "Orders" };

export default function Page() {
  return <DemoOrdersPage />;
}
