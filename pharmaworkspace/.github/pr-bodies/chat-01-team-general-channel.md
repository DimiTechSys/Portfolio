## CHAT-01 — Salon textuel équipe (canal Général)

Ajoute un chat d'équipe intégré pour remplacer les échanges WhatsApp : un canal
« Général » par officine, messages en temps réel via Supabase Realtime, badge
unread dans la sidebar.

### Décisions produit (PROD-CHAT-01)
- 1 canal « Général » auto-créé par officine (MVP)
- Texte seul, pas de pièces jointes
- Édition auteur ≤ 15 min, soft delete, modération titulaire
- Pas d'email — badge in-app uniquement

### Contenu
- **Migration `0054_chat_channels_messages.sql`** : `chat_channels`,
  `chat_messages`, `chat_read_states`, trigger + backfill, publication Realtime
- **`/chat`** : fenêtre de messages, composer (Ctrl+Entrée), bulles own/other
- **Realtime** : `use-realtime-chat` (INSERT/UPDATE) + UI optimiste à l'envoi
- **Unread** : `use-chat-unread` + badge rouge sidebar, reset au focus `/chat`
- **Modération** : édition/suppression auteur, soft delete titulaire + audit log
- **PostHog** : `chat_message_sent`, `chat_window_opened`,
  `chat_first_message_in_pharmacy`
- **Nav** : item « Chat » dans le groupe Général

### Vérifications
- `npm run lint` ✅ (warning préexistant annuaire uniquement)
- `npm run test` ✅ (63 tests, dont 2 nouveaux utils chat)
- `npm run build` ✅
- `supabase db push` ✅ (0054 appliquée sur staging)

### Test plan
- [ ] 2 sessions même officine : message A visible chez B en < 3s
- [ ] Badge unread sidebar hors `/chat`, remis à zéro à l'ouverture
- [ ] Édition message < 15 min, refus après délai
- [ ] Suppression soft → « Message supprimé »
- [ ] Titulaire supprime un message d'un autre membre → audit log
- [ ] Pas d'email envoyé à la réception d'un message

### Notes coordination
- Migration `0054` claimée dans `COORDINATION.md` §S5 (DIM).
