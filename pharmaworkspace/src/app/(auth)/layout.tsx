import type { ReactNode } from "react";

// Après le déplacement de /login et /verify dans (marketing), il ne reste que
// /auth/callback (page spinner intermédiaire) dans ce route group. Layout
// simplifié : centré, sans split-screen branding.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
