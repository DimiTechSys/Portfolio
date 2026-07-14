-- CHAT-01 — Salon textuel équipe (canal Général par officine)

CREATE TABLE IF NOT EXISTS public.chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pharmacy_id, slug)
);

CREATE INDEX IF NOT EXISTS chat_channels_pharmacy_idx ON public.chat_channels(pharmacy_id);

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_channels_select ON public.chat_channels;
CREATE POLICY chat_channels_select ON public.chat_channels FOR SELECT
  TO authenticated
  USING (pharmacy_id = (SELECT public.get_pharmacy_id()));

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_channel_created_idx
  ON public.chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_pharmacy_created_idx
  ON public.chat_messages(pharmacy_id, created_at DESC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_messages_select ON public.chat_messages;
CREATE POLICY chat_messages_select ON public.chat_messages FOR SELECT
  TO authenticated
  USING (pharmacy_id = (SELECT public.get_pharmacy_id()));

DROP POLICY IF EXISTS chat_messages_insert ON public.chat_messages;
CREATE POLICY chat_messages_insert ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND author_id = auth.uid()
  );

-- Auteur : édition/suppression soft ; titulaire : modération (soft delete).
DROP POLICY IF EXISTS chat_messages_update ON public.chat_messages;
CREATE POLICY chat_messages_update ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND (
      (author_id = auth.uid() AND deleted_at IS NULL)
      OR (auth.jwt() ->> 'role' = 'titulaire')
    )
  );

CREATE TABLE IF NOT EXISTS public.chat_read_states (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, channel_id)
);

ALTER TABLE public.chat_read_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_read_states_select ON public.chat_read_states;
CREATE POLICY chat_read_states_select ON public.chat_read_states FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS chat_read_states_mutate ON public.chat_read_states;
CREATE POLICY chat_read_states_mutate ON public.chat_read_states FOR ALL
  TO authenticated
  USING (user_id = auth.uid() AND pharmacy_id = (SELECT public.get_pharmacy_id()))
  WITH CHECK (user_id = auth.uid() AND pharmacy_id = (SELECT public.get_pharmacy_id()));

CREATE OR REPLACE FUNCTION public.create_default_chat_channel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.chat_channels (pharmacy_id, slug, name, is_default)
  VALUES (NEW.id, 'general', 'Général', true)
  ON CONFLICT (pharmacy_id, slug) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pharmacies_create_default_channel ON public.pharmacies;
CREATE TRIGGER pharmacies_create_default_channel
  AFTER INSERT ON public.pharmacies
  FOR EACH ROW EXECUTE FUNCTION public.create_default_chat_channel();

INSERT INTO public.chat_channels (pharmacy_id, slug, name, is_default)
SELECT id, 'general', 'Général', true FROM public.pharmacies
ON CONFLICT (pharmacy_id, slug) DO NOTHING;

-- Realtime : push INSERT sur chat_messages (critère <3s entre sessions).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;
