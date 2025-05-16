import React, { useState } from 'react';

export default function FlagIcon({ iso2, size = 20 }) {
  const [error, setError] = useState(false);

  if (!iso2 || iso2 === 'un' || error) {
    return (
      <div className="flex items-center justify-center opacity-40 shrink-0" style={{ width: size, height: Math.round(size * 0.75) }}>
        <i className="fa-solid fa-earth-americas" style={{ fontSize: size - 4 }}></i>
      </div>
    );
  }

  const code = iso2.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/w${size}/${code}.png`}
      srcSet={`https://flagcdn.com/w${size * 2}/${code}.png 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt={code.toUpperCase()}
      className="shrink-0"
      style={{ imageRendering: 'crisp-edges', borderRadius: 2, display: 'inline-block', verticalAlign: 'middle' }}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}