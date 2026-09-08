import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

/**
 * One quiet column. Nothing on this screen competes with the form: no
 * marketing panel, no testimonials, no illustration.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="px-6 pt-7 sm:px-10">
        <Link href="/" className="inline-flex rounded-md">
          <Logo />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10 sm:py-14">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>

      <footer className="px-6 pb-8 sm:px-10">
        <nav className="flex justify-center gap-6 text-[13px] text-subtle">
          <Link href="/terms" className="rounded hover:text-body">
            Terms
          </Link>
          <Link href="/privacy" className="rounded hover:text-body">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
