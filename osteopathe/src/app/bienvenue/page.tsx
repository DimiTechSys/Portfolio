import type { Metadata } from "next";
import { WelcomeOnboarding } from "@/components/auth/welcome-onboarding";

export const metadata: Metadata = {
  title: "Bienvenue | osteopathes.pro",
};

export default function BienvenuePage() {
  return <WelcomeOnboarding />;
}
