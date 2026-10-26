import { asset } from "@/lib/media";

/**
 * SVG filters behind the Liquid Glass look (a web approximation of Apple's Liquid Glass,
 * which Apple only ships for its own platforms).
 *
 * The displacement map bends the backdrop near an element's edges, like the thick rim of a
 * lens. Units are objectBoundingBox, so the bend scales with each element's size.
 * Only Chromium supports SVG filters in backdrop-filter; others get the non-refracting look.
 */
export function LiquidFilters() {
  const map = asset("/liquid/displacement.png");
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="pointer-events-none absolute size-0 overflow-hidden">
      <defs>
        {[
          { id: "lg-refract-sm", scale: 0.08 }, // pills, chips, buttons
          { id: "lg-refract-lg", scale: 0.045 }, // large panels
        ].map((f) => (
          <filter key={f.id} id={f.id} x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" primitiveUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
            <feImage href={map} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={f.scale} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
