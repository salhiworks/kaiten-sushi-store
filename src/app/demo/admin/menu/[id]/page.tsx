import type { Metadata } from "next";
import { DemoEditDishPage } from "@/components/demo/demo-admin";

export const metadata: Metadata = { title: "Edit dish" };

export default function Page() {
  return <DemoEditDishPage />;
}
