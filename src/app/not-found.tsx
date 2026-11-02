import Link from "next/link";
import { Seal } from "@/components/site/brand-mark";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
      <Seal className="size-10" />
      <h1 className="mt-8 text-4xl tracking-tight">This plate has left the belt.</h1>
      <p className="mt-4 text-muted-foreground">The page you were looking for doesn&apos;t exist.</p>
      <Link href="/" className={buttonVariants({ size: "lg", className: "mt-10" })}>Back to the belt</Link>
    </div>
  );
}
