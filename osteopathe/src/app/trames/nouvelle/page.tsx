import type { Metadata } from "next";
import { NewTramePage } from "@/components/trames/new-trame-page";

export const metadata: Metadata = {
  title: "Nouvelle Trame | osteopathes.pro",
};

export default function NouvelleTrameRoute() {
  return <NewTramePage />;
}

