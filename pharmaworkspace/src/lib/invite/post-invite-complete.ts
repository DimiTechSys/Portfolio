"use client";

import { createClient } from "@/lib/supabase/client";

/** Finalise l’invitation : envoie toujours le Bearer pour que la route lise la session. */
export async function postInviteComplete(body: { token?: string }) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return fetch("/api/invite/complete", {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ token: body.token ?? "" }),
  });
}
