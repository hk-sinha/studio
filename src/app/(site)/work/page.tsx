import { Suspense } from "react";
import type { Metadata } from "next";
import { WorkBrowser } from "@/components/work/WorkBrowser";
import { WorkHeader } from "@/components/work/WorkHeader";

export const metadata: Metadata = {
  title: "Work",
  description: "AI ads, motion ads, AI cinema, showreels, UGC and edits by Himanshu Kumar Sinha.",
};

export default function WorkPage() {
  return (
    <>
      <WorkHeader />
      <Suspense fallback={null}>
        <WorkBrowser />
      </Suspense>
    </>
  );
}
