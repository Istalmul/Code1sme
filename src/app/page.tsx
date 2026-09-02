import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await currentSession();
  if (!session) redirect("/login");
  redirect(session.onboarded ? "/command-center" : "/onboarding");
}
