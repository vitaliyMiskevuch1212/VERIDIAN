import React from 'react';
import TerminalLoader from './TerminalLoader';
import { exportSitrep, copyToClipboard, downloadReport } from '../utils/exportReport';
import ExportButton from './ExportButton';

const THREAT_COLORS = {
  LOW: { bg: 'rgba(0, 255, 136, 0.08)', border: 'rgba(0, 255, 136, 0.3)', text: 'var(--color-green)' },
  GUARDED: { bg: 'rgba(0, 212, 255, 0.08)', border: 'rgba(0, 212, 255, 0.3)', text: 'var(--color-cyan)' },
  ELEVATED: { bg: 'rgba(234, 179, 8, 0.08)', border: 'rgba(234, 179, 8, 0.3)', text: 'var(--color-yellow)' },
  HIGH: { bg: 'rgba(249, 115, 22, 0.08)', border: 'rgba(249, 115, 22, 0.3)', text: 'var(--color-orange)' },
  SEVERE: { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.3)', text: 'var(--color-red)' },
};

const SEVERITY_DOT = {
  CRITICAL: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]',
  HIGH: 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-emerald-500',
};

export default function SitrepPanel({ data, loading }) {
  if (loading || !data) {
    return (
      <div className="flex flex-col h-full bg-[#0A0F1E] flex-1">
        <TerminalLoader context="GENERATING GLOBAL SECURITY REPORT (SITREP)" />
      </div>
    );
  }

  const threatStyle = THREAT_COLORS[data.globalThreatLevel] || THREAT_COLORS.ELEVATED;

  return (
    <div className="flex flex-col h-full bg-[#0A0F1E]" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-shield-halved text-[var(--color-red)] text-sm"></i>
          <h2 className="text-white font-heading uppercase tracking-[0.3em] text-[11px]">SITREP</h2>
          <i className="fa-solid fa-satellite text-white/40 text-[10px] ml-1"></i>
        </div>
        <ExportButton
          label="Export"
          onCopy={() => copyToClipboard(exportSitrep(data))}
          onDownload={() => downloadReport(exportSitrep(data), `veridian-sitrep-${Date.now()}.txt`)}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Global Threat Level */}
        <div className="mx-3 mt-3 mb-4 p-4 rounded-sm border" style={{ background: threatStyle.bg, borderColor: threatStyle.border }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/40">Global Threat Level</span>
            <span className="text-[8px] font-mono text-white/30">{data.analyzedAt ? new Date(data.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: threatStyle.text }}></span>
            <span className="text-xl font-heading font-black tracking-[0.15em]" style={{ color: threatStyle.text }}>{data.globalThreatLevel}</span>
          </div>
          {data.dataSnapshot && (
            <div className="flex items-center gap-3 mt-3 text-[8px] font-mono text-white/30">
              <span>{data.dataSnapshot.criticalEvents} CRIT</span>
              <span>•</span>
              <span>{data.dataSnapshot.totalEvents} EVENTS</span>
              <span>•</span>
              <span>{data.dataSnapshot.militaryFlights} FLIGHTS</span>
              <span>•</span>
              <span>{data.dataSnapshot.cyberThreats} CYBER</span>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="px-4 mb-4">
          <div className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <i className="fa-solid fa-file-lines text-[8px]"></i> Situation Assessment
          </div>
          {data.summary?.split('\n').filter(Boolean).map((para, i) => (
            <p key={i} className="text-white/60 text-[11px] leading-relaxed mb-3">{para}</p>
          ))}
        </div>

        {/* Top Threats */}
        {data.topThreats?.length > 0 && (
          <div className="px-4 mb-4">
            <div className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-[var(--color-red)] text-[8px]"></i> Top Threats
            </div>
            <div className="space-y-2">
              {data.topThreats.map((threat, i) => (
                <div key={i} className="bg-[#0D1520] border border-white/5 rounded-sm p-3" style={{ borderLeft: `3px solid ${threat.severity === 'CRITICAL' ? 'var(--color-red)' : 'var(--color-orange)'}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[threat.severity] || SEVERITY_DOT.HIGH}`}></span>
                    <span className="text-white font-bold text-[10px]">{threat.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[8px] font-mono text-white/30 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-sm">{threat.region}</span>
                    <span className="text-[8px] font-bold" style={{ color: threat.severity === 'CRITICAL' ? 'var(--color-red)' : 'var(--color-orange)' }}>{threat.severity}</span>
                  </div>
                  <p className="text-white/50 text-[10px] leading-relaxed">{threat.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Escalation Watch */}
        {data.escalationWatch?.length > 0 && (
          <div className="px-4 mb-4">
            <div className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <i className="fa-solid fa-arrow-trend-up text-[var(--color-orange)] text-[8px]"></i> Escalation Watch (24-48h)
            </div>
            <div className="space-y-2">
              {data.escalationWatch.map((item, i) => {
                if (typeof item === 'string') {
                  return (
                    <div key={i} className="flex items-start gap-2 text-[10px] text-white/50">
                      <i className="fa-solid fa-bolt text-[var(--color-yellow)] mt-0.5" style={{ fontSize: 8 }}></i>
                      <span>{item}</span>
                    </div>
                  );
                }
                return (
                  <div key={i} className="flex flex-col bg-[#0D1520] border border-white/5 rounded-sm p-3 gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-bolt text-[var(--color-red)]" style={{ fontSize: 10 }}></i>
                        <span className="text-white font-bold text-[10px] leading-tight">{item.threat}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${item.probability > 70 ? 'bg-[var(--color-red)]/10 text-[var(--color-red)] border border-[var(--color-red)]/30' : 'bg-[var(--color-orange)]/10 text-[var(--color-orange)] border border-[var(--color-orange)]/30'}`}>
                        {item.probability}%
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[9px] mt-1">
                      <span className="text-white/40 uppercase tracking-widest bg-white/5 px-1 py-0.5 border border-white/10 rounded-sm">
                        {item.timeframe}
                      </span>
                      <span className="text-white/50 border-l border-white/10 pl-2">
                        <strong className="text-white/30 uppercase tracking-widest">Trigger:</strong> {item.trigger}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Market Implications */}
        {data.marketImplications && (
          <div className="px-4 mb-4">
            <div className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <i className="fa-solid fa-chart-line text-[var(--color-cyan)] text-[8px]"></i> Market Implications
            </div>
            {data.marketImplications.split('\n').filter(Boolean).map((para, i) => (
              <p key={i} className="text-white/50 text-[10px] leading-relaxed mb-2">{para}</p>
            ))}
          </div>
        )}

        {/* Emerging Patterns */}
        {data.emergingPatterns?.length > 0 && (
          <div className="px-4 mb-4">
            <div className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <i className="fa-solid fa-diagram-project text-[var(--color-purple)] text-[8px]"></i> Emerging Patterns
            </div>
            <div className="space-y-1.5">
              {data.emergingPatterns.map((pattern, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px] text-white/50">
                  <i className="fa-solid fa-link text-[var(--color-purple)] mt-0.5" style={{ fontSize: 7 }}></i>
                  <span>{pattern}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations?.length > 0 && (
          <div className="px-4 mb-4">
            <div className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <i className="fa-solid fa-bullseye text-[var(--color-green)] text-[8px]"></i> Actionable Recommendations
            </div>
            <div className="space-y-1.5">
              {data.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px] bg-[#00FF8808] border border-[#00FF8815] rounded-sm px-3 py-2">
                  <span className="text-[var(--color-green)] font-bold text-[9px] mt-0.5">{i + 1}.</span>
                  <span className="text-white/60">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto p-4 opacity-10 text-center pointer-events-none">
          <i className="fa-solid fa-shield-halved text-4xl"></i>
        </div>
      </div>
    </div>
  );
}