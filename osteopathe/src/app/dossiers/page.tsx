import type { Metadata } from "next";
import { DossiersListPage } from "@/components/dossiers/dossiers-list-page";

export const metadata: Metadata = {
  title: "Dossiers | osteopathes.pro",
};

export default function DossiersRoute() {
  return <DossiersListPage />;
}

