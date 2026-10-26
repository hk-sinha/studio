import { SiteDataProvider } from "@/components/providers/SiteDataProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { UIProvider } from "@/components/providers/UIProvider";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { LiquidFilters } from "@/components/ui/LiquidFilters";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteDataProvider>
      <SmoothScroll>
        <UIProvider>
          <a href="#main" className="fixed left-4 top-[-60px] z-[100] rounded-btn bg-fg px-4 py-2.5 text-ink-950 focus:top-4">
            Skip to content
          </a>
          <LiquidFilters />
          <div className="ambient" aria-hidden="true"><span /><span /><span /></div>
          <Nav />
          <main id="main">{children}</main>
          <Footer />
        </UIProvider>
      </SmoothScroll>
    </SiteDataProvider>
  );
}
