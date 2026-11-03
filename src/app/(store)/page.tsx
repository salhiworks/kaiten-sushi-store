import { ConveyorHero } from "@/components/home/conveyor-hero";
import { PlateKey } from "@/components/home/plate-key";
import { CraftSection, HowItWorks } from "@/components/home/sections";

export default function HomePage() {
  return (
    <>
      <ConveyorHero />
      <HowItWorks />
      <PlateKey />
      <CraftSection />
    </>
  );
}
