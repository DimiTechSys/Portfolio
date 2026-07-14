## Summary

- Migration `0051` : table `rental_attachments` + RLS (lecture/insert pharmacie, delete titulaire ou auteur).
- Upload photos locations : compression client JPEG, bucket `attachments` (`{pharmacy_id}/rentals/{rental_id}/…`).
- UI drawer location : galerie, aperçu plein écran, suppression, boutons fichier + caméra mobile.

## Test plan

- [ ] `npx supabase db push` staging
- [ ] Détail location : upload 2 photos + aperçu + suppression d’une
- [ ] Mobile : « Prendre une photo » ouvre la caméra (`capture="environment"`)
- [ ] `npm run typecheck && npm run test && npm run build`
