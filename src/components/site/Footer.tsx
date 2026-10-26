"use client";
import Link from "next/link";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { Brand } from "@/components/site/Brand";
import { btn } from "@/components/ui/button";
import { ArrowUp, ArrowUpRight, BehanceLogo, DownloadSimple, GithubLogo, InstagramLogo, LinkedinLogo } from "@/components/ui/icons";
import { SOCIALS } from "@/lib/config";
import { decodeEntities, whatsappLink } from "@/lib/media";
import { useScrollApi } from "@/components/providers/SmoothScroll";

export function Footer() {
  const { profile } = useSiteData();
  const { scrollTo } = useScrollApi();
  const year = new Date().getFullYear();
  const socials = [
    { href: SOCIALS.instagram, label: "Instagram", Icon: InstagramLogo },
    { href: SOCIALS.linkedin, label: "LinkedIn", Icon: LinkedinLogo },
    { href: SOCIALS.behance, label: "Behance", Icon: BehanceLogo },
    { href: SOCIALS.github, label: "GitHub", Icon: GithubLogo },
  ];

  return (
    <footer className="border-t border-line pt-[72px]">
      <div className="wrap grid grid-cols-2 gap-12 md:grid-cols-[2fr_1.4fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Link href="/"><Brand /></Link>
          <p className="mb-6 mt-4 text-[15px] text-muted">AI Video Director &amp;<br />Motion Designer</p>
          <a href={profile.resumeLink} target="_blank" rel="noopener" className={btn("ghost", "sm")}>
            <DownloadSimple weight="light" size={18} /> Download CV
          </a>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <h3 className="mb-4 text-[13px] font-medium">Contact</h3>
          <ul className="flex flex-col gap-2.5 text-sm text-muted">
            <li><a className="break-all transition-colors hover:text-fg" href={`mailto:${profile.email}`}>{profile.email}</a></li>
            <li><a className="transition-colors hover:text-fg" href={`tel:${profile.phone.replace(/[^\d+]/g, "")}`}>{profile.phone}</a></li>
            <li><a className="inline-flex items-center gap-1.5 transition-colors hover:text-fg" href={whatsappLink(profile.phone)} target="_blank" rel="noopener">WhatsApp <ArrowUpRight weight="light" size={14} /></a></li>
            {profile.address && (
              <li>
                {profile.locationLink ? (
                  <a className="transition-colors hover:text-fg" href={profile.locationLink} target="_blank" rel="noopener">{profile.address}</a>
                ) : profile.address}
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-[13px] font-medium">Pages</h3>
          <ul className="flex flex-col gap-2.5 text-sm text-muted">
            <li><Link className="transition-colors hover:text-fg" href="/work/">Work</Link></li>
            <li><Link className="transition-colors hover:text-fg" href="/#services">Services</Link></li>
            <li><Link className="transition-colors hover:text-fg" href="/about/">About</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-[13px] font-medium">Elsewhere</h3>
          <ul className="flex flex-wrap gap-2">
            {socials.map(({ href, label, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener" aria-label={label} className="grid size-10 place-items-center rounded-full border border-line-strong transition-colors hover:border-fg">
                  <Icon weight="light" size={19} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="wrap mt-[72px] flex flex-wrap items-center justify-between gap-4 border-t border-line pb-8 pt-6 text-[13px] text-muted">
        <span>{profile.copyright ? decodeEntities(profile.copyright) : `© ${year} Himanshu Kumar Sinha`}</span>
        <button onClick={() => scrollTo(0)} className="inline-flex items-center gap-1.5 transition-colors hover:text-fg">
          Back to top <ArrowUp weight="light" size={14} />
        </button>
      </div>
    </footer>
  );
}
