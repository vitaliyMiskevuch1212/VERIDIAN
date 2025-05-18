/**
 * FlagIcon.jsx  (v2)
 *
 * An enhanced country flag component that builds on the original single-image
 * implementation with three additional capabilities:
 *
 *  1. **Hover glow** — the flag scales up and gains a coloured box-shadow on
 *     mouse-enter, driven by the optional `glowColor` prop.
 *  2. **Inline label** — when `showLabel` is true the ISO-resolved country name
 *     is rendered alongside the flag in a monospaced uppercase style.
 *  3. **Hover tooltip** — when `showLabel` is false and the user hovers, a
 *     floating tooltip with a CSS arrow appears above the flag.
 *
 * Fallback behaviour is identical to v1: a globe icon renders when `iso2` is
 * absent, equals 'un', or the CDN image fails to load.
 *
 * @component
 * @param {Object}  props
 * @param {string}  [props.iso2]            - ISO 3166-1 alpha-2 code (case-insensitive).
 *                                            Omit or pass undefined/'un' for the fallback globe.
 * @param {number}  [props.size=20]         - Rendered width in pixels; height is derived at 4:3.
 * @param {boolean} [props.showLabel=false] - Render the country name as an inline text label.
 *                                            When true the hover tooltip is suppressed.
 * @param {string}  [props.glowColor]       - CSS colour string for the hover glow shadow.
 *                                            Defaults to a translucent green.
 *
 * @example
 * // Flag only with default glow
 * <FlagIcon iso2="jp" size={32} />
 *
 * @example
 * // Flag + inline country name label
 * <FlagIcon iso2="de" size={24} showLabel />
 *
 * @example
 * // Custom glow tint matched to a risk level or team colour
 * <FlagIcon iso2="ua" size={28} glowColor="rgba(0,150,255,0.5)" />
 */
 
import React, { useState } from 'react';
 
// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------
 
/**
 * ISO 3166-1 alpha-2 → human-readable country name.
 *
 * Used in two places:
 *  - The `title` attribute on the wrapper (native browser tooltip as a11y baseline)
 *  - The rendered inline label / custom hover tooltip text
 *
 * When a code is absent from this map the component falls back to the
 * uppercased raw code (e.g. "XK" for Kosovo).
 *
 * Maintenance: add entries here whenever new countries are introduced to the
 * globe dataset. The key must be lowercase to match the normalised `code` value.
 */
const COUNTRY_NAMES = {
  af: 'Afghanistan', al: 'Albania', dz: 'Algeria', ao: 'Angola', ar: 'Argentina',
  am: 'Armenia', au: 'Australia', at: 'Austria', az: 'Azerbaijan', bh: 'Bahrain',
  bd: 'Bangladesh', by: 'Belarus', be: 'Belgium', bj: 'Benin', bt: 'Bhutan',
  bo: 'Bolivia', ba: 'Bosnia', bw: 'Botswana', br: 'Brazil', bn: 'Brunei',
  bg: 'Bulgaria', bf: 'Burkina Faso', bi: 'Burundi', kh: 'Cambodia', cm: 'Cameroon',
  ca: 'Canada', cf: 'Central African Rep.', td: 'Chad', cl: 'Chile', cn: 'China',
  co: 'Colombia', cd: 'DR Congo', cg: 'Congo', cr: 'Costa Rica', ci: "Côte d'Ivoire",
  hr: 'Croatia', cu: 'Cuba', cy: 'Cyprus', cz: 'Czechia', dk: 'Denmark',
  dj: 'Djibouti', do: 'Dominican Rep.', ec: 'Ecuador', eg: 'Egypt', sv: 'El Salvador',
  gq: 'Equatorial Guinea', er: 'Eritrea', ee: 'Estonia', et: 'Ethiopia',
  fi: 'Finland', fr: 'France', ga: 'Gabon', gm: 'Gambia', ge: 'Georgia',
  de: 'Germany', gh: 'Ghana', gr: 'Greece', gt: 'Guatemala', gn: 'Guinea',
  gw: 'Guinea-Bissau', gy: 'Guyana', ht: 'Haiti', hn: 'Honduras', hu: 'Hungary',
  is: 'Iceland', in: 'India', id: 'Indonesia', ir: 'Iran', iq: 'Iraq',
  ie: 'Ireland', il: 'Israel', it: 'Italy', jm: 'Jamaica', jp: 'Japan',
  jo: 'Jordan', kz: 'Kazakhstan', ke: 'Kenya', kp: 'North Korea', kr: 'South Korea',
  kw: 'Kuwait', kg: 'Kyrgyzstan', la: 'Laos', lv: 'Latvia', lb: 'Lebanon',
  ls: 'Lesotho', lr: 'Liberia', ly: 'Libya', lt: 'Lithuania', lu: 'Luxembourg',
  mg: 'Madagascar', mw: 'Malawi', my: 'Malaysia', ml: 'Mali', mt: 'Malta',
  mr: 'Mauritania', mu: 'Mauritius', mx: 'Mexico', md: 'Moldova', mn: 'Mongolia',
  me: 'Montenegro', ma: 'Morocco', mz: 'Mozambique', mm: 'Myanmar', na: 'Namibia',
  np: 'Nepal', nl: 'Netherlands', nz: 'New Zealand', ni: 'Nicaragua', ne: 'Niger',
  ng: 'Nigeria', no: 'Norway', om: 'Oman', pk: 'Pakistan', ps: 'Palestine',
  pa: 'Panama', pg: 'Papua New Guinea', py: 'Paraguay', pe: 'Peru', ph: 'Philippines',
  pl: 'Poland', pt: 'Portugal', qa: 'Qatar', ro: 'Romania', ru: 'Russia',
  rw: 'Rwanda', sa: 'Saudi Arabia', sn: 'Senegal', rs: 'Serbia', sl: 'Sierra Leone',
  sg: 'Singapore', sk: 'Slovakia', si: 'Slovenia', so: 'Somalia', za: 'South Africa',
  ss: 'South Sudan', es: 'Spain', lk: 'Sri Lanka', sd: 'Sudan', se: 'Sweden',
  ch: 'Switzerland', sy: 'Syria', tw: 'Taiwan', tj: 'Tajikistan', tz: 'Tanzania',
  th: 'Thailand', tg: 'Togo', tn: 'Tunisia', tr: 'Turkey', tm: 'Turkmenistan',
  ug: 'Uganda', ua: 'Ukraine', ae: 'UAE', gb: 'United Kingdom', us: 'United States',
  uy: 'Uruguay', uz: 'Uzbekistan', ve: 'Venezuela', vn: 'Vietnam', ye: 'Yemen',
  zm: 'Zambia', zw: 'Zimbabwe',
};
 
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
 
export default function FlagIcon({ iso2, size = 20, showLabel = false, glowColor }) {
  /**
   * Becomes true when the <img> fires onError (CDN 404, network failure, etc.).
   * Once true this instance permanently renders the globe fallback, preventing
   * a browser retry loop on every re-render.
   */
  const [error, setError] = useState(false);
 
  /**
   * Tracks whether the cursor is currently over the component wrapper.
   * Drives two effects simultaneously:
   *  - The glow box-shadow + scale transform on the flag image
   *  - The visibility of the custom tooltip (when showLabel is false)
   */
  const [hovered, setHovered] = useState(false);
 
  // Normalise to lowercase; guard against a null/undefined iso2 prop
  const code = iso2 ? iso2.toLowerCase() : '';
 
  // Resolve the display name; fall back to the uppercased code for unknown entries
  const countryName = COUNTRY_NAMES[code] || code.toUpperCase();
 
  // ---------------------------------------------------------------------------
  // Fallback: globe icon
  // Rendered when iso2 is absent, is 'un' (no CDN entry for UN), or the image
  // failed to load. The 4:3 dimensions keep it dimensionally consistent with a
  // real flag so surrounding layouts don't shift.
  // ---------------------------------------------------------------------------
  if (!iso2 || iso2 === 'un' || error) {
    return (
      <div
        className="flag-icon-fallback"
        style={{
          width: size,
          height: Math.round(size * 0.75), // 4:3 flag aspect ratio
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.4,
          flexShrink: 0,
          position: 'relative',
        }}
        title="Unknown Region"
      >
        <i className="fa-solid fa-earth-americas" style={{ fontSize: size - 4 }} />
      </div>
    );
  }
 
  // Pre-compute once; used for both the wrapper span and the <img> element
  const flagHeight = Math.round(size * 0.75);
 
  /**
   * Glow colour for the hover box-shadow.
   * Callers can pass a colour that matches risk level, team identity, etc.
   * The default translucent green is consistent with the dashboard's status palette.
   */
  const glow = glowColor || 'rgba(0, 255, 136, 0.35)';
 
  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <span
      className="flag-icon-wrapper"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',     // establishes stacking context for absolute tooltip
        display: 'inline-flex',
        alignItems: 'center',
        gap: showLabel ? 6 : 0,  // only add spacing between flag and text when label is visible
        flexShrink: 0,
        cursor: 'default',
      }}
      title={countryName}         // native browser tooltip — a11y baseline regardless of custom tooltip
    >
      {/* ------------------------------------------------------------------ */}
      {/* Flag image wrapper                                                  */}
      {/* A <span> wraps the <img> to apply overflow:hidden + borderRadius   */}
      {/* without affecting the outer positioning context needed by the       */}
      {/* absolute-positioned tooltip.                                        */}
      {/* ------------------------------------------------------------------ */}
      <span
        style={{
          position: 'relative',
          display: 'inline-block',
          width: size,
          height: flagHeight,
          borderRadius: 3,
          overflow: 'hidden',     // clips the image to the rounded corners
          boxShadow: hovered
            ? `0 0 8px ${glow}, 0 0 2px rgba(255,255,255,0.15)` // coloured glow on hover
            : '0 1px 3px rgba(0,0,0,0.4)',                       // subtle lift at rest
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          transform: hovered ? 'scale(1.15)' : 'scale(1)',        // gentle zoom on hover
          border: '1px solid rgba(255,255,255,0.1)',               // faint edge for contrast on dark bg
        }}
      >
        <img
          /**
           * Enforce a minimum 40 px request width even when `size` is smaller.
           * flagcdn returns noticeably blurry images below ~40 px; requesting a
           * larger source and letting CSS downscale it yields sharper results.
           */
          src={`https://flagcdn.com/w${Math.max(size, 40)}/${code}.png`}
          srcSet={`https://flagcdn.com/w${Math.max(size * 2, 80)}/${code}.png 2x`}
          width={size}
          height={flagHeight}
          alt={countryName}       // descriptive alt text for screen readers
          style={{
            imageRendering: 'crisp-edges', // prevents blurry browser upscaling at small sizes
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',   // fills the wrapper box without distorting flag proportions
          }}
          loading="lazy"          // defer network request until flag scrolls into the viewport
          onError={() => setError(true)} // flip error state → re-render as globe fallback
        />
      </span>
 
      {/* ------------------------------------------------------------------ */}
      {/* Inline country label (opt-in via showLabel prop)                   */}
      {/* Lives outside the image wrapper so it isn't clipped by             */}
      {/* overflow:hidden. Font scales with `size` but never below 9 px for  */}
      {/* legibility.                                                         */}
      {/* ------------------------------------------------------------------ */}
      {showLabel && (
        <span
          style={{
            fontSize: Math.max(size * 0.55, 9),
            fontWeight: 700,
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono, monospace)',
            whiteSpace: 'nowrap', // prevents long country names from wrapping mid-word
          }}
        >
          {countryName}
        </span>
      )}
 
      {/* ------------------------------------------------------------------ */}
      {/* Hover tooltip (only when showLabel is false — they are mutually     */}
      {/* exclusive to avoid redundant duplication of the country name).      */}
      {/*                                                                     */}
      {/* Positioned via bottom:100% so it floats above the flag.            */}
      {/* pointerEvents:none is critical — without it, the tooltip itself     */}
      {/* can steal the mouseover event, causing the hovered state to flicker */}
      {/* as the tooltip appears then disappears in a rapid loop.             */}
      {/* The `flagTooltipIn` animation must be defined in global CSS.        */}
      {/* ------------------------------------------------------------------ */}
      {hovered && !showLabel && (
        <span
          style={{
            position: 'absolute',
            bottom: '100%',             // float above the flag wrapper
            left: '50%',
            transform: 'translateX(-50%)', // horizontally centre over the flag
            marginBottom: 6,            // gap between tooltip bottom and flag top
            padding: '3px 8px',
            background: 'rgba(6, 11, 20, 0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 4,
            fontSize: 9,
            fontWeight: 700,
            fontFamily: 'var(--font-mono, monospace)',
            color: 'rgba(255,255,255,0.8)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',      // must not intercept mouse events — prevents flicker loop
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            animation: 'flagTooltipIn 0.15s ease-out',
          }}
        >
          {countryName}
 
          {/* CSS triangle arrow — zero-size box with directional border trick */}
          {/* Creates a downward-pointing arrow connecting the tooltip to the flag */}
          <span
            style={{
              position: 'absolute',
              top: '100%',              // attach to the bottom edge of the tooltip
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid rgba(6, 11, 20, 0.95)', // same colour as tooltip bg
            }}
          />
        </span>
      )}
    </span>
  );
}