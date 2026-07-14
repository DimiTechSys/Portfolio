-- 0048_pharmacies_realtime.sql
-- Ajoute `public.pharmacies` à la publication Realtime Supabase pour permettre
-- aux clients de souscrire aux UPDATE de cette table via WebSocket.
--
-- Use case : page /onboarding/waiting (invités attendant l'activation de
-- l'abonnement par le titulaire). Sans Realtime, on polle Supabase toutes les
-- 5s par client → coût + latence. Avec Realtime, une seule connexion WS par
-- invité, push instantané à la transition subscription_status → 'trialing'.
--
-- Impact RLS : Realtime respecte les RLS policies du schema. Les invités
-- peuvent lire leur propre pharma (policy pharmacy_id = get_pharmacy_id())
-- donc ils recevront les push pour leur pharma uniquement.
--
-- Idempotent : `ALTER PUBLICATION ... ADD TABLE` raise si la table est déjà
-- dans la publication. On wrappe dans un DO bloc défensif qui check d'abord.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'pharmacies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pharmacies;
  END IF;
END $$;
