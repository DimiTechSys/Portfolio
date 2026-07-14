import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { applyInvitationToProfile } from "@/lib/invite/apply-invitation-to-profile";
import { safeNext } from "@/lib/auth/safe-next";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // M2 : `next` validé (chemin interne uniquement) pour éviter l'open redirect.
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // H4 : on ne dérive plus pharmacy_id/role de user_metadata. L'invitation
      // est revalidée en base et l'écriture passe par le client service.
      const invitationToken = user?.user_metadata?.invitation_token as
        | string
        | undefined;

      if (user?.email && invitationToken) {
        const admin = createServiceClient();
        if (admin) {
          const firstName = user.user_metadata?.first_name as string | undefined;
          const lastName = user.user_metadata?.last_name as string | undefined;
          const result = await applyInvitationToProfile({
            admin,
            user: { id: user.id, email: user.email },
            token: invitationToken,
            names: { first_name: firstName, last_name: lastName },
          });

          if (result.ok && !("skipped" in result)) {
            const fn = typeof firstName === "string" ? firstName.trim() : "";
            const ln = typeof lastName === "string" ? lastName.trim() : "";
            if (fn && ln) {
              await supabase.auth.updateUser({
                data: { profile_complete: true },
              });
            }
          }
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
