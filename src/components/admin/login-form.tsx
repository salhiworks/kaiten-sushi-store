"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/admin/actions";

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "/admin";
  const [state, action, pending] = React.useActionState(signIn, undefined);
  return (
    <form action={action} className="mt-10 space-y-5">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required className="h-11 bg-card px-3.5 text-base" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-11 bg-card px-3.5 text-base" />
      </div>
      {state?.error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 aria-hidden="true" className="animate-spin" />}
        Sign in
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">Accounts are created by the restaurant owner. Forgot your password? Ask them to reset it.</p>
    </form>
  );
}
