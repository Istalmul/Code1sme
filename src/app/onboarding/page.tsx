import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/piasowo/session-data";
import { companyFromEmail } from "@/lib/piasowo/recommend";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = { title: "Set up your workspace" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.workspace) redirect("/command-center");

  return (
    <OnboardingFlow
      firstName={user.name.split(" ")[0]}
      // Guessing the company from the work email means the first screen is
      // already half-answered instead of blank.
      guess={companyFromEmail(user.email)}
    />
  );
}
