import type { Metadata } from "next";
import { googleConfigured } from "@/lib/auth/google";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in to Piasowo",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  return <LoginForm googleReady={googleConfigured()} oauthError={error} nextPath={next} />;
}
