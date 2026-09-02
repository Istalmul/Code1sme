import type { Metadata } from "next";
import { googleConfigured } from "@/lib/auth/google";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create your Piasowo account",
  description: "Start with three fields. Everything else comes later, in context.",
};

export default function SignupPage() {
  return <SignupForm googleReady={googleConfigured()} />;
}
