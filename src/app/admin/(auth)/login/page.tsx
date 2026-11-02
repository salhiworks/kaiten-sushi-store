import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { Seal } from "@/components/site/brand-mark";
import { isLive } from "@/lib/config";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  if (!isLive) notFound();
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Seal className="size-10" />
        <h1 className="mt-8 text-3xl tracking-tight">Restaurant admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to manage the menu and incoming orders.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
