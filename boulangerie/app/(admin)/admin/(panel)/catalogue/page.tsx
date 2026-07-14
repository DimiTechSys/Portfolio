import { prisma } from "@/lib/prisma";
import CatalogueManager from "./CatalogueManager";

export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return <CatalogueManager products={products} />;
}
