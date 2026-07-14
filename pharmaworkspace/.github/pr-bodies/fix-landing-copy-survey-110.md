## Copy landing — enquête 110+ pharmaciens

### Contexte
La prod affichait encore « Conçu avec 92 pharmaciens en exercice ». L’enquête terrain
dépasse maintenant 110 répondants — on aligne le copy sans afficher l’ancien effectif.

### Changements
- **Home** (`product-showcase`) : bandeau stats → « Co-construit à partir des besoins de plus de 110 pharmaciens »
- **Meta SEO** (`page.tsx`) : description mise à jour
- **`/tarifs`** : « 90 pharmaciens » → « 110 pharmaciens »
- **Footer** : `/demo` → lien hotline externe ; suppression `/changelog` (page inexistante, 404)
- **Ruptures** : retrait du doublon témoignage Sophie B. (conservé dans la section dédiée)

### Test plan
- [ ] `/` : bandeau sous le mockup affiche le nouveau texte (pas de « 92 »)
- [ ] `/tarifs` : « plus de 110 pharmaciens »
- [ ] Footer : « Réserver une démo » ouvre hotline.baseflow.fr
- [ ] Un seul témoignage Sophie B. sur la home
- [ ] `npm run lint && npm run build`
