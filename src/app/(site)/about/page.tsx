import type { Metadata } from "next";
import { AboutContent } from "@/components/about/AboutContent";

export const metadata: Metadata = {
  title: "About",
  description: "Himanshu Kumar Sinha, AI video director and motion designer.",
};

export default function AboutPage() {
  return <AboutContent />;
}
