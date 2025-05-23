import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export default function NetworkGraph({ events }) {
  const fgRef = useRef();

  // Create graph data dynamically from events
  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];

    // Root Node
    nodes.push({
      id: 'root',
      name: 'VERIDIAN NEXUS',
      group: 'root',
      val: 25,
      color: 'var(--color-cyan)',
    });

    const countries = new Set();
    
    // Limit to latest 50 events to avoid lag
    const activeEvents = [...(events || [])]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50);

    activeEvents.forEach(evt => {
      // Add country node if new
      if (evt.country && !countries.has(evt.country)) {
        countries.add(evt.country);
        nodes.push({
          id: `country-${evt.country}`,
          name: evt.country,
          group: 'country',
          val: 12,
          color: 'var(--color-text-secondary)',
        });
        links.push({
          source: 'root',
          target: `country-${evt.country}`,
          color: 'rgba(0,212,255,0.2)',
          dash: [2, 4]
        });
      }

      // Add event node
      nodes.push({
        id: evt.id,
        name: evt.title,
        group: 'event',
        severity: evt.severity,
        val: evt.severity === 'CRITICAL' ? 8 : evt.severity === 'HIGH' ? 6 : 4,
        color: evt.severity === 'CRITICAL' ? 'var(--color-red)' :
               evt.severity === 'HIGH' ? 'var(--color-orange)' :
               evt.severity === 'MEDIUM' ? 'var(--color-yellow)' : 'var(--color-green)'
      });

      // Link event to country
      if (evt.country) {
        links.push({
          source: `country-${evt.country}`,
          target: evt.id,
          color: evt.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)',
        });
      } else {
        links.push({
          source: 'root',
          target: evt.id,
          color: 'rgba(255, 255, 255, 0.1)',
        });
      }
    });

    return { nodes, links };
  }, [events]);

  // Initial auto-zoom
  useEffect(() => {
    setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.zoomToFit(800, 50);
      }
    }, 500);
  }, [graphData]);

  // Handle zooming when clicking a node
  const handleNodeClick = useCallback((node) => {
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(4, 1000);
    }
  }, []);

  return (
    <div className="w-full h-full relative" style={{ background: '#060B14' }}>
      {/* Decorative HUD overlay */}
      <div className="absolute top-4 left-4 z-10 text-[10px] uppercase font-mono tracking-[0.2em] text-white/40 pointer-events-none">
        <i className="fa-solid fa-network-wired text-[var(--color-cyan)] mr-2 text-sm"></i>
        <span>NEXUS VISUALIZATION MODE</span>
        <div className="mt-1 flex items-center gap-2 text-[8px] text-white/20">
           <span>NODES: {graphData.nodes.length}</span> / 
           <span>LINKS: {graphData.links.length}</span>
        </div>
      </div>

      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="name"
        nodeColor="color"
        nodeRelSize={4}
        linkColor="color"
        linkWidth={1}
        linkDirectionalParticles={d => (d.color && d.color.includes('239') ? 2 : 0)}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.01}
        backgroundColor="#060B14"
        onNodeClick={handleNodeClick}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = node.group === 'root' ? 14/globalScale : 10/globalScale;
          
          // Draw Circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color;
          ctx.fill();

          // Pulse if critical event or root
          if (node.group === 'root' || node.severity === 'CRITICAL') {
             ctx.beginPath();
             ctx.arc(node.x, node.y, node.val + 2, 0, 2 * Math.PI, false);
             ctx.lineWidth = 1;
             ctx.strokeStyle = node.color;
             ctx.globalAlpha = 0.4;
             ctx.stroke();
             ctx.globalAlpha = 1.0;
          }

          // Draw Text
          const textY = node.y + node.val + (4 / globalScale);
          ctx.font = `${fontSize}px Inter`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = node.group === 'root' ? '#fff' : 'rgba(255, 255, 255, 0.6)';
          
          // Only show labels when zoomed in, or if it's root/country
          if (globalScale > 1.2 || node.group === 'root' || node.group === 'country') {
            ctx.fillText(label, node.x, textY);
          }
        }}
      />
    </div>
  );
}