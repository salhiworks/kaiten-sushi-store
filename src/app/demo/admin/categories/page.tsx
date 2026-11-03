import type { Metadata } from "next";
import { DemoCategoriesPage } from "@/components/demo/demo-admin";

export const metadata: Metadata = { title: "Categories" };

export default function Page() {
  return <DemoCategoriesPage />;
}
