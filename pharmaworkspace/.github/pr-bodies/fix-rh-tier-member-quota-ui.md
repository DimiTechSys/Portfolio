## Fix — quota utilisateurs visible sur la page RH

### Demande
Indication visuelle du nombre de membres et des places restantes selon
l'abonnement, + vérification des limites par tier (TECH-12).

### Changements
- **`TeamTierUsage`** : carte permanente sur `/admin` (RH) avec
  - formule (PO / OTM / GO)
  - `X / Y utilisateurs` + barre de progression
  - places restantes
  - détail membres actifs + invitations en attente
  - alerte + bouton « Mettre à niveau » à 80 % / 100 %
- **InviteDialog** : rappel du nombre de places restantes à l'ouverture
- **Refresh quota** après révocation d'invitation ou désactivation membre
- Helpers : `getRemainingMemberSlots`, `getMemberCountBreakdown`

### Limites (inchangées, API 409)
| Tier | Max |
|------|-----|
| PO   | 3   |
| OTM  | 8   |
| GO   | ∞   |

Comptent : profils actifs + invitations pending non expirées.

### Test plan
- [ ] `/admin` titulaire PO : carte « 1 / 3 utilisateurs · 2 places restantes »
- [ ] Inviter jusqu'à la limite → bouton grisé + barre rouge + 409 API
- [ ] Révoquer invitation → quota se met à jour
- [ ] Formule GO : « illimité », pas de barre
- [ ] `npm run lint && npm run test && npm run build`
