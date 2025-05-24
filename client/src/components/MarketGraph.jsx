import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';

// Seeded random number generator for consistent mock data per ticker
const sfc32 = (a, b, c, d) => {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
    let t = (a + b) | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    d = d + 1 | 0;
    t = t + d | 0;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

function generateCandlestickData(ticker, stabilityScore) {
  // Use ticker characters to seed random generator so chart is identical on re-renders
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) seed += ticker.charCodeAt(i);
  
  // Need a stateful random function
  let a = 0x9E3779B9, b = 0x243F6A88, c = 0xB7E15162, d = seed;
  const rand = sfc32(a, b, c, d);

  // If stability is low (< 55), asset goes up due to conflict (defense, oil, gold)
  const isUpwardTrend = stabilityScore < 55;
  
  let currentPrice = 50 + (rand() * 150);
  const points = [];
  
  // Generate 30 days of data ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const volatility = currentPrice * 0.03; 
    const trend = isUpwardTrend ? (rand() * 0.02) : -(rand() * 0.02);
    
    let open = currentPrice;
    let close = open + (open * trend) + ((rand() - 0.5) * volatility);
    let high = Math.max(open, close) + (rand() * volatility * 0.5);
    let low = Math.min(open, close) - (rand() * volatility * 0.5);
    
    points.push({
      x: date.getTime(),
      y: [
        parseFloat(open.toFixed(2)),
        parseFloat(high.toFixed(2)),
        parseFloat(low.toFixed(2)),
        parseFloat(close.toFixed(2))
      ]
    });
    
    currentPrice = close;
  }

  return points;
}

export default function MarketGraph({ stock, stabilityScore }) {
  const chartData = useMemo(() => {
    return [{
      name: stock?.ticker || 'ASSET',
      data: generateCandlestickData(stock?.ticker || 'UNKNOWN', stabilityScore || 50)
    }];
  }, [stock?.ticker, stabilityScore]);

  if (!stock) return null;

  const currentPrice = chartData[0].data[chartData[0].data.length - 1].y[3];
  const previousPrice = chartData[0].data[chartData[0].data.length - 2].y[3];
  const priceChange = currentPrice - previousPrice;
  const percentChange = (priceChange / previousPrice) * 100;
  const isPositive = priceChange >= 0;

  const options = {
    chart: {
      type: 'candlestick',
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: true }
    },
    theme: { mode: 'dark' },
    plotOptions: {
      candlestick: {
        colors: {
          upward: 'var(--color-green)',
          downward: 'var(--color-red)'
        },
        wick: { useFillColor: true }
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: { colors: 'var(--color-text-muted)', fontFamily: 'JetBrains Mono', fontSize: '10px' },
        datetimeFormatter: { month: "MMM 'yy", day: 'dd MMM' }
      },
      axisBorder: { color: 'var(--color-border)' },
      axisTicks: { show: false },
      tooltip: { enabled: false }
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: {
        style: { colors: 'var(--color-text-muted)', fontFamily: 'JetBrains Mono', fontSize: '10px' },
        formatter: (val) => val.toFixed(2)
      }
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.05)',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    tooltip: {
      theme: 'dark',
      style: { fontSize: '12px', fontFamily: 'JetBrains Mono' },
      x: { format: 'dd MMM yyyy' }
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Chart Header Info */}
      <div className="flex justify-between items-end mb-4 px-2">
        <div>
          <h3 className="text-xl font-bold font-mono-num tracking-wide" style={{ color: 'var(--color-text-primary)' }}>
            {stock.ticker}
          </h3>
          <span className="text-xs text-muted font-medium">{stock.name}</span>
        </div>
        <div className="text-right">
          <div className="text-xl font-mono-num font-bold flex items-center gap-2">
            ${currentPrice.toFixed(2)}
            <div className={`text-xs font-mono-num ${isPositive ? 'text-green' : 'text-red'} flex items-center justify-end gap-1`}>
              <i className={`fa-solid ${isPositive ? 'fa-caret-up' : 'fa-caret-down'}`}></i>
              {Math.abs(percentChange).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
      
      {/* ApexChart Component */}
      <div className="flex-1 w-full relative" style={{ marginLeft: '-15px', height: '350px' }}>
         <div className="absolute inset-0">
           <Chart options={options} series={chartData} type="candlestick" height="100%" width="100%" />
         </div>
      </div>

      {/* AI Reasoning Footer */}
      <div className="mt-4 p-3 rounded-lg border border-border" style={{ background: 'var(--color-surface)', borderLeft: `3px solid ${isPositive ? 'var(--color-green)' : 'var(--color-red)'}` }}>
         <div className="text-xs text-muted uppercase tracking-wider mb-1 flex items-center gap-2">
            <i className="fa-solid fa-microchip"></i> AI Market Context
         </div>
         <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
           {stock.reasoning}
         </p>
      </div>
    </div>
  );
}
