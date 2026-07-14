import type { Metadata } from "next";
import { NewDossierPage } from "@/components/dossiers/new-dossier-page";

export const metadata: Metadata = {
  title: "Nouveau patient | osteopathes.pro",
};

export default function NouveauDossierRoute() {
  return <NewDossierPage />;
}
