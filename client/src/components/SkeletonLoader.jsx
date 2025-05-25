import React from 'react';

export default function SkeletonLoader({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="shimmer rounded"
          style={{
            height: i === 0 ? 20 : 14,
            width: i === lines - 1 ? '60%' : '100%',
            borderRadius: 6
          }}
        />
      ))}
    </div>
  );
}
