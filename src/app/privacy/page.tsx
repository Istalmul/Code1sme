import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export const metadata = { title: "Privacy" };

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <Link href="/" className="inline-flex rounded-md">
        <Logo />
      </Link>
      <h1 className="mt-10 text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        Placeholder page. Replace with Piasowo&apos;s privacy copy before launch.
      </p>
    </div>
  );
}
