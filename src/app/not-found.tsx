import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="px-6 pt-7 sm:px-10">
        <Link href="/" className="inline-flex rounded-md">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="max-w-md text-center">
          <p className="text-[13px] font-medium uppercase tracking-wider text-subtle">404</p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-tight">
            We couldn&apos;t find that page
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            The link may be out of date, or the item may have been dismissed from a mission.
          </p>
          <ButtonLink href="/command-center" variant="primary" size="lg" className="mt-6">
            Back to Command Center
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
