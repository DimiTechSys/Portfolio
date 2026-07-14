import type { Metadata } from "next";
import { FrHomePage } from "@/components/sections/fr-home";

export const metadata: Metadata = {
  title: "osteopathes.pro | Logiciel osteo",
  description:
    "Vos dossiers patients sans effort grace a notre systeme de prise de notes intelligent.",
};

export default function FrPage() {
  return <FrHomePage />;
}
