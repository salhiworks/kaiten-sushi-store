import { Seal } from "@/components/site/brand-mark";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/admin/actions";

export function NoAccess({ email }: { email: string }) {
  return (
    <div data-no-access className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-24 text-center">
      <Seal className="size-10" />
      <h1 className="text-3xl tracking-tight">No admin access</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {email ? `${email} is signed in` : "You are signed in"}, but this account can&apos;t manage the restaurant. Ask the owner to add you as an admin.
      </p>
      <form action={signOut}>
        <Button type="submit" size="lg" variant="outline" className="bg-card">Sign out</Button>
      </form>
    </div>
  );
}
