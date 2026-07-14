import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Créer un compte | osteopathes.pro",
};

export default function InscriptionPage() {
  return <SignupForm />;
}
