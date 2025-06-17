import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

export default function TensionChart({ events = [], news = [] }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchTension = async () => {
      try {
        const res = await axios.get('/api/ai/tension');
        const history = res.data.history || Array.from({length: 24}, () => 0);
        
        // Map 24 integers to hourly timestamps ending NOW
        const now = Date.now();
        const data = history.map((tensionVal, i) => {
          // i=23 is current hour, i=0 is 23 hours ago
          const hourStart = now - ((23 - i) * 3600000);
          const label = new Date(hourStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return { time: label, tension: tensionVal };
        });
        
        setChartData(data);
      } catch (err) {
        console.error('Failed to load AI tension data', err);
        // Fallback to flatline if backend fails
        const now = Date.now();
        setChartData(Array.from({length: 24}, (_, i) => ({
          time: new Date(now - ((23 - i) * 3600000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tension: 0
        })));
      }
    };

    fetchTension();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchTension, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const currentTension = chartData[chartData.length - 1]?.tension || 0;
  const tensionColor = currentTension > 60 ? '#EF4444' : currentTension > 35 ? '#F59E0B' : '#10B981';

  return (
    <div className="absolute bottom-20 left-4 right-4 z-50 pointer-events-none">
      <div 
        className="backdrop-blur-md border border-white/10 rounded-lg overflow-hidden bg-gradient-to-t from-[#060B14]/90 to-[#0A0F1E]/60 shadow-2xl"
        style={{ height: 90 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: tensionColor }}></span>
            <span className="text-white/40 text-[8px] font-bold uppercase tracking-[0.2em]">Global Tension Index</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold" style={{ color: tensionColor }}>{Math.round(currentTension)}</span>
            <span className="text-white/20 text-[8px] font-mono">/100</span>
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: 55, marginTop: -4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="tensionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tensionColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={tensionColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="tension" 
                stroke={tensionColor} 
                strokeWidth={1.5}
                fill="url(#tensionGrad)" 
                dot={false}
              />
              <Tooltip
                contentStyle={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 10 }}
                labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}
                itemStyle={{ color: tensionColor }}
                formatter={(val) => [`${Math.round(val)}`, 'Tension']}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}