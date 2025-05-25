import React, { useMemo } from 'react';

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
  'from','as','is','was','are','were','been','be','have','has','had','do',
  'does','did','will','would','could','should','may','might','can','shall',
  'that','this','these','those','it','its','he','she','they','them','their',
  'his','her','we','our','you','your','i','my','me','us','not','no','so',
  'up','out','if','about','into','over','after','new','says','said','also',
  'more','than','most','just','now','how','all','each','every','both',
  'few','many','some','any','other','between','through','during','before',
  'amid','what','who','which','where','when','why','one','two','three',
]);

export default function TopKeywords({ news = [] }) {
  const keywords = useMemo(() => {
    const freq = {};
    news.forEach(item => {
      const words = (item.title || '').toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));
      
      words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    });

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }, [news]);

  const maxCount = keywords[0]?.count || 1;

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <i className="fa-solid fa-hashtag text-[var(--color-cyan)] text-[10px]"></i>
        <span className="text-white/60 text-[9px] font-bold uppercase tracking-[0.2em]">Top Keywords</span>
        <span className="text-white/20 text-[8px] font-mono ml-auto">24H</span>
      </div>
      <div className="space-y-1.5">
        {keywords.map((kw, i) => (
          <div key={kw.word} className="flex items-center gap-3 group">
            <span className="text-white/20 font-mono text-[9px] w-4 text-right">{i + 1}</span>
            <div className="flex-1 relative">
              <div 
                className="absolute inset-y-0 left-0 rounded-r-sm transition-all duration-500 group-hover:brightness-125"
                style={{ 
                  width: `${(kw.count / maxCount) * 100}%`,
                  background: `linear-gradient(90deg, rgba(0, 212, 255, 0.4), rgba(0, 212, 255, 0.05))`
                }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-[var(--color-cyan)] shadow-[0_0_5px_var(--color-cyan)]"></div>
              </div>
              <span className="relative text-white/80 text-[10.5px] font-medium capitalize pl-2.5 leading-6 tracking-wide drop-shadow-md">{kw.word}</span>
            </div>
            <span className="text-[var(--color-cyan)] font-mono text-[9px] font-bold">{kw.count}</span>
          </div>
        ))}
        {keywords.length === 0 && (
          <p className="text-white/20 text-[10px] text-center py-4">Analyzing intelligence feed...</p>
        )}
      </div>
    </div>
  );
}
