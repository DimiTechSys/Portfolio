// Formatage des montants en dinars algériens (DA).
export function formatDA(amount: number): string {
  const n = Math.round(amount || 0);
  // Séparateur de milliers fin (espace insécable) pour un rendu soigné.
  return `${n.toLocaleString("fr-DZ").replace(/ /g, " ")} DA`;
}

// Marge en pourcentage à partir d'un prix de vente et d'un coût.
export function marginPct(priceDA: number, costDA: number): number {
  if (!priceDA) return 0;
  return Math.round(((priceDA - costDA) / priceDA) * 100);
}
