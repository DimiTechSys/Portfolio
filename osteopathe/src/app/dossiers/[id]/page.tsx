import type { Metadata } from "next";
import { PatientDossierPage } from "@/components/dossiers/patient-dossier-page";

export const metadata: Metadata = {
  title: "Dossier patient | osteopathes.pro",
};

export default function PatientDossierRoute() {
  return <PatientDossierPage />;
}

