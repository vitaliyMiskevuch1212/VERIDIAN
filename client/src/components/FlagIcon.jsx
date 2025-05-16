/**
 * FlagIcon.jsx
 *
 * Renders a country flag image sourced from flagcdn.com using an ISO 3166-1
 * alpha-2 country code. Falls back to a generic globe icon when:
 *  - No code is provided
 *  - The code is 'un' (United Nations / unrecognised territory)
 *  - The remote image fails to load (broken URL, unsupported code, network error)
 *
 * Images are served at 1× and 2× resolutions via `srcSet` for crisp rendering
 * on high-DPI displays. Loading is deferred (`loading="lazy"`) to avoid
 * blocking the initial paint when many flags are rendered simultaneously.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.iso2]       - ISO 3166-1 alpha-2 country code (e.g. "us", "GB", "fr").
 *                                      Case-insensitive — normalised to lowercase internally.
 *                                      Pass undefined/null or "un" to render the fallback globe.
 * @param {number} [props.size=20]    - Target width in pixels. Height is derived automatically
 *                                      at a 4:3 aspect ratio (standard flag proportions).
 *
 * @example
 * // Renders the US flag at 40 px wide
 * <FlagIcon iso2="us" size={40} />
 *
 * @example
 * // No code supplied → globe fallback
 * <FlagIcon size={24} />
 */

import React, { useState } from 'react';

export default function FlagIcon({ iso2, size = 20 }) {
  /**
   * Tracks whether the <img> element fired an `onError` event.
   * Once true, the component permanently renders the fallback for this
   * iso2/size combination — preventing an infinite retry loop.
   */
  const [error, setError] = useState(false);

  // ---------------------------------------------------------------------------
  // Fallback: globe icon
  // Shown when no valid code is available or the remote image could not load.
  // ---------------------------------------------------------------------------
  if (!iso2 || iso2 === 'un' || error) {
    return (
      <div
        className="flex items-center justify-center opacity-40 shrink-0"
        style={{
          width: size,
          height: Math.round(size * 0.75), // maintain 4:3 aspect ratio
        }}
      >
        {/* Font Awesome globe used as a neutral placeholder */}
        <i className="fa-solid fa-earth-americas" style={{ fontSize: size - 4 }}></i>
      </div>
    );
  }

  // Normalise to lowercase so callers can pass "US", "Us", or "us" interchangeably
  const code = iso2.toLowerCase();

  // ---------------------------------------------------------------------------
  // Flag image
  // ---------------------------------------------------------------------------
  return (
    <img
      /**
       * 1× source — flagcdn serves PNGs at discrete widths (e.g. w20, w40, w80).
       * The `size` prop is used directly as the width step.
       */
      src={`https://flagcdn.com/w${size}/${code}.png`}

      /**
       * 2× source for retina / high-DPI screens.
       * Doubles the pixel density while keeping the rendered size unchanged.
       */
      srcSet={`https://flagcdn.com/w${size * 2}/${code}.png 2x`}

      width={size}
      height={Math.round(size * 0.75)} // 4:3 flag aspect ratio

      // Accessible label: uppercase ISO code (e.g. "US", "FR")
      alt={code.toUpperCase()}

      // Prevents the image from shrinking inside flex containers
      className="shrink-0"

      style={{
        imageRendering: 'crisp-edges', // prevents blurry upscaling on small sizes
        borderRadius: 2,               // subtle rounding to match UI card aesthetic
        display: 'inline-block',
        verticalAlign: 'middle',       // aligns with adjacent text / icons
      }}

      /**
       * Defer loading until the image enters the viewport.
       * Important when the globe renders many country nodes simultaneously.
       */
      loading="lazy"

      /**
       * If the CDN returns a 404 (unknown code) or the request fails,
       * flip `error` to true so the globe fallback renders instead.
       * Using a state setter here ensures React re-renders cleanly.
       */
      onError={() => setError(true)}
    />
  );
}