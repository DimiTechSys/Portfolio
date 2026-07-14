'use client';

import Hero from "@/components/sections/Hero";
import TrustBar from "@/components/sections/TrustBar";
import ServiceTypes from "@/components/sections/ServiceTypes";
import HowItWorks from "@/components/sections/HowItWorks";
import WhatIsIncluded from "@/components/sections/WhatIsIncluded";
import Fleet from "@/components/sections/Fleet";
import SocialProof from "@/components/sections/SocialProof";
import FAQ from "@/components/sections/FAQ";
import FinalCTA from "@/components/sections/FinalCTA";

export default function ChauffeurPage() {
  return (
    <main>
      <Hero />
      <TrustBar />
      <ServiceTypes />
      <HowItWorks />
      <WhatIsIncluded />
      <Fleet />
      <SocialProof />
      <FAQ />
      <FinalCTA />
    </main>
  );
}
