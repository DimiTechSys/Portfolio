import type { Metadata } from "next";
import { TramesPage } from "@/components/trames/trames-page";

export const metadata: Metadata = {
  title: "Trames | osteopathes.pro",
};

export default function TramesRoute() {
  return <TramesPage />;
}

