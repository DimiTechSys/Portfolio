import { ReactNode } from "react";

type SectionProps = {
  className?: string;
  children: ReactNode;
};

export function Section({ className = "", children }: SectionProps) {
  return (
    <section className={`fr-section ${className}`.trim()}>
      <div className="fr-container">{children}</div>
    </section>
  );
}
