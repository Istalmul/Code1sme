import type { Metadata } from "next";
import { ForgotPasswordFlow } from "@/components/auth/ForgotPasswordFlow";

export const metadata: Metadata = { title: "Reset your Piasowo password" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordFlow />;
}
