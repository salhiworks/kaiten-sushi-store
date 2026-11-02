import { ConveyorHero } from "@/components/home/conveyor-hero";
import { CraftSection, HowItWorks, PlateKey } from "@/components/home/sections";
import { getMenu } from "@/lib/menu/server";

export default async function HomePage() {
  const { dishes, tiers } = await getMenu();
  return (
    <>
      <ConveyorHero dishes={dishes} />
      <HowItWorks />
      <PlateKey dishes={dishes} tiers={tiers} />
      <CraftSection />
    </>
  );
}
