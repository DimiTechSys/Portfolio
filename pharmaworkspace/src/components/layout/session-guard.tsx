"use client";

import { APP_NAME } from "@/config/constants";

export interface SessionGuardProps {
  firstName: string;
  onStartSession: () => void;
  onConsultation: () => void;
}

export function SessionGuard({
  firstName,
  onStartSession,
  onConsultation,
}: SessionGuardProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6 text-center">
        {/* Branding */}
        <div className="mb-10">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
            {APP_NAME}
          </span>
        </div>

        {/* Greeting */}
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Bonjour {firstName}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Démarrez une session pour accéder à votre espace de travail.
        </p>

        {/* CTA */}
        <button
          onClick={onStartSession}
          className="mt-8 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        >
          Démarrer ma session
        </button>

        {/* Consultation link */}
        <button
          onClick={onConsultation}
          className="mt-4 inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-600"
        >
          Mode consultation
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}


// ============================================================================
// FILE: src/components/layout/header.tsx
// ============================================================================
