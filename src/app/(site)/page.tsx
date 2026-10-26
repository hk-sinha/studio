import { Hero } from "@/components/home/Hero";
import { FeaturedRows } from "@/components/home/FeaturedRows";
import { Clients } from "@/components/home/Clients";
import { Director } from "@/components/home/Director";
import { Services } from "@/components/home/Services";
import { UgcRow } from "@/components/home/UgcRow";
import { Process } from "@/components/home/Process";
import { Proof } from "@/components/home/Proof";
import { FinalCta } from "@/components/home/FinalCta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedRows />
      <Clients />
      <Director />
      <Services />
      <UgcRow />
      <Process />
      <Proof />
      <FinalCta />
    </>
  );
}
