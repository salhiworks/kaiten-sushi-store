import type { Metadata } from "next";
import { DemoNewDishPage } from "@/components/demo/demo-admin";

export const metadata: Metadata = { title: "Add dish" };

export default function Page() {
  return <DemoNewDishPage />;
}
