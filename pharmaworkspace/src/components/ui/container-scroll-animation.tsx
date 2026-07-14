"use client";
import React from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  // Animation pilotée par le scroll de la page depuis le tout début (haut de
  // la landing), et non par l'entrée de la section dans le viewport.
  const { scrollY } = useScroll();
  const [isMobile, setIsMobile] = React.useState(false);
  const [endRange, setEndRange] = React.useState(800);

  React.useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setEndRange(window.innerHeight);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.9, 0.7] : [1, 1.05];
  };

  const rotate = useTransform(scrollY, [0, endRange], [0, 20]);
  const scale = useTransform(scrollY, [0, endRange], scaleDimensions());
  const translate = useTransform(scrollY, [0, endRange], [-100, 0]);

  return (
    <div className="h-[48rem] md:h-[60rem] flex items-center justify-center relative px-4 py-2 md:p-20">
      <div
        className="py-10 md:py-40 w-full relative"
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: string | React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="div max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        // Promotion sur une couche GPU dédiée : l'ombre (coûteuse à peindre)
        // n'est rastérisée qu'une fois, le scroll ne déclenche que de la
        // composition → plus de saccades.
        willChange: "transform",
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        boxShadow:
          "0 12px 32px -12px rgba(0,0,0,0.35), 0 28px 64px -24px rgba(0,0,0,0.22)",
      }}
      className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px] shadow-2xl"
    >
      <div className=" h-full w-full  overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl md:p-4 ">
        {children}
      </div>
    </motion.div>
  );
};
