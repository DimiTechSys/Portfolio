// Crée (ou rend public) le bucket "products" sur Supabase Storage via l'API REST.
// Nécessite SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans l'environnement.
import "dotenv/config";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants.");
  }
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };

  const listRes = await fetch(`${url}/storage/v1/bucket`, { headers });
  if (!listRes.ok) throw new Error(`Liste des buckets: ${listRes.status} ${await listRes.text()}`);
  const buckets = (await listRes.json()) as Array<{ name: string; id: string }>;
  const exists = buckets.some((b) => b.name === "products" || b.id === "products");

  if (!exists) {
    const res = await fetch(`${url}/storage/v1/bucket`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: "products",
        name: "products",
        public: true,
        file_size_limit: 6291456,
        allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      }),
    });
    if (!res.ok) throw new Error(`Création bucket: ${res.status} ${await res.text()}`);
    console.log("Bucket 'products' créé (public).");
  } else {
    await fetch(`${url}/storage/v1/bucket/products`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ id: "products", public: true }),
    });
    console.log("Bucket 'products' déjà présent — rendu public.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
