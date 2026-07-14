"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

type Stat = {
  value: string;
  unit: string;
  label: string;
};

const STATS: Stat[] = [
  { value: "90", unit: "%", label: "des pharmaciens interrogés disent manquer d’informations transmises" },
  { value: "4", unit: "/10", label: "pharmaciens ne peuvent pas citer les 3 tâches en cours de l’équipe" },
  { value: "100", unit: "%", label: "des données clients sont hébergées en France (conformité RGPD)" },
  { value: "30", unit: "j", label: "d’essai gratuit pour chaque officine, sans engagement" },
];

export function ProductShowcase() {
  const statsRef = useRef<HTMLDivElement>(null);
  // Révélation pilotée par le scroll : les chiffres sont glissés sous le bas
  // du mockup et descendent / apparaissent en entrant dans le viewport.
  const { scrollYProgress } = useScroll({
    target: statsRef,
    offset: ["start end", "end center"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-160, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [0, 1]);

  return (
    <div className="relative bg-white">
      <ContainerScroll
        titleComponent={
          <>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Aperçu produit</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-balance text-slate-900 sm:text-5xl">
              Votre matinée d’officine, en un coup d’œil.
            </h2>
          </>
        }
      >
        <div className="relative h-full w-full overflow-hidden rounded-xl bg-white">
          {/* Mobile : capture portrait */}
          <Image
            src="/mockup-mobile.png"
            alt="Tableau de bord PharmaWorkspace sur mobile"
            fill
            sizes="100vw"
            className="object-cover object-top md:hidden"
            draggable={false}
          />
          {/* Desktop : capture large */}
          <Image
            src="/mockup.png"
            alt="Tableau de bord PharmaWorkspace : tâches du jour, ruptures, sessions de l’équipe et widget de démarrage rapide"
            fill
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="hidden object-cover object-left-top md:block"
            draggable={false}
          />
        </div>
      </ContainerScroll>

      <motion.div
        ref={statsRef}
        style={{ y, opacity }}
        className="relative z-0 mx-auto -mt-16 max-w-7xl px-4 py-16 sm:-mt-24 sm:px-6 sm:py-20 lg:px-8"
      >
        <p className="text-center text-sm font-medium uppercase tracking-wider text-slate-500">
          Co-construit à partir des besoins de plus de 110 pharmaciens
        </p>
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                {stat.value}
                <span className="text-3xl text-slate-400">{stat.unit}</span>
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
