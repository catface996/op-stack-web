
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Topology } from '../types';

interface TopologyGraphProps {
  data: Topology;
  activeNodeIds: Set<string>; // Nodes currently involved in a task
  onNodeClick: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
}

const TopologyGraph: React.FC<TopologyGraphProps> = ({ data, activeNodeIds, onNodeClick, onNodeDoubleClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Keep refs to simulation and selection to update them without full re-render
  const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);
  const nodeSelectionRef = useRef<d3.Selection<SVGGElement, any, any, any> | null>(null);
  const linkSelectionRef = useRef<d3.Selection<SVGGElement, any, any, any> | null>(null);
  
  // Use a ref for the click handlers to avoid re-running the effect when the function reference changes
  const onNodeClickRef = useRef(onNodeClick);
  const onNodeDoubleClickRef = useRef(onNodeDoubleClick);

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
    onNodeDoubleClickRef.current = onNodeDoubleClick;
  }, [onNodeClick, onNodeDoubleClick]);

  // Helper for colors
  const getTypeColor = (type: string) => {
    if (type === 'Database') return '#a855f7'; // Purple
    if (type === 'Gateway') return '#ec4899'; // Pink
    if (type === 'Cache') return '#f59e0b'; // Amber
    if (type === 'Infrastructure') return '#94a3b8'; // Slate
    return '#3b82f6'; // Blue
  };

  // 1. Initialization Effect - Runs only when topology data structure changes
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous only on data change

    // --- Graph Logic ---
    
    // Calculate Levels (BFS)
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    data.nodes.forEach(n => {
      adj.set(n.id, []);
      inDegree.set(n.id, 0);
    });

    const safeLinks = data.links.map(l => ({
        source: typeof l.source === 'object' ? (l.source as any).id : l.source,
        target: typeof l.target === 'object' ? (l.target as any).id : l.target,
        type: l.type || 'call',
        id: `link-${typeof l.source === 'object' ? (l.source as any).id : l.source}-${typeof l.target === 'object' ? (l.target as any).id : l.target}`
    }));

    safeLinks.forEach(l => {
      adj.get(l.source)?.push(l.target);
      inDegree.set(l.target, (inDegree.get(l.target) || 0) + 1);
    });

    const levels = new Map<string, number>();
    const queue: { id: string, lvl: number }[] = [];

    data.nodes.forEach(n => {
      if ((inDegree.get(n.id) || 0) === 0) {
        queue.push({ id: n.id, lvl: 0 });
        levels.set(n.id, 0);
      }
    });

    while (queue.length > 0) {
      const { id, lvl } = queue.shift()!;
      const neighbors = adj.get(id) || [];
      neighbors.forEach(targetId => {
        if (!levels.has(targetId)) {
          levels.set(targetId, lvl + 1);
          queue.push({ id: targetId, lvl: lvl + 1 });
        }
      });
    }

    data.nodes.forEach(n => {
      if (!levels.has(n.id)) levels.set(n.id, 0);
    });

    let maxLevel = 0;
    levels.forEach(l => { if (l > maxLevel) maxLevel = l; });

    // D3 Data
    // We preserve existing x/y/fx/fy if available in data to stop resets
    const nodes = data.nodes.map(n => ({ 
        ...n, 
        level: levels.get(n.id) || 0,
        fx: n.x, 
        fy: n.y
    })) as (d3.SimulationNodeDatum & { id: string, type: string, label: string, level: number, properties?: Record<string, string> })[];
    
    const links = safeLinks.map(l => ({ ...l }));

    // Store tree geometry for resize calculations
    const levelHeight = 120; 
    const treeHeight = maxLevel * levelHeight;
    (svgRef.current as any).__treeHeight = treeHeight; 

    // Simulation Setup
    const topMargin = Math.max(60, (height - treeHeight) / 2);

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150)) 
      .force("charge", d3.forceManyBody().strength(-1000)) 
      .force("collide", d3.forceCollide().radius(100)) 
      .force("y", d3.forceY((d: any) => topMargin + (d.level * levelHeight)).strength(1.5)) 
      .force("x", d3.forceX(width / 2).strength(0.2));

    simulationRef.current = simulation;

    // Drawing
    const defs = svg.append("defs");
    
    // Link Group
    const linkGroup = svg.append("g")
      .selectAll("g")
      .data(links)
      .join("g");

    // Base Link Path
    linkGroup.append("path")
      .attr("id", d => d.id) 
      .attr("fill", "none")
      .attr("class", "base-link")
      .attr("stroke-width", 2)
      .attr("stroke", d => {
          if (d.type === 'deployment') return '#334155'; // Darker Slate (Solid)
          if (d.type === 'dependency') return '#475569'; // Slate (Dashed)
          return '#0891b2'; // Cyan-600 (Visible base for Call)
      })
      .attr("stroke-dasharray", d => d.type === 'dependency' ? "6,4" : "none");

    // Traffic Flow Animation (Multiple Moving Arrows for 'call' type)
    linkGroup.filter(d => d.type === 'call')
      .each(function(d) {
        const group = d3.select(this);
        
        // Add multiple moving arrow particles for traffic density
        const particleCount = 3;
        const duration = 2; // seconds
        
        for (let i = 0; i < particleCount; i++) {
           const arrow = group.append("path")
            .attr("d", "M-3,-3 L3,0 L-3,3 Z") // Simple arrowhead shape
            .attr("fill", "#22d3ee") // Cyan-400
            .attr("class", "traffic-arrow");

            // Animate motion along the path
            arrow.append("animateMotion")
            .attr("dur", `${duration}s`)
            .attr("repeatCount", "indefinite")
            .attr("rotate", "auto")
            .attr("begin", `${i * (duration / particleCount)}s`) // Staggered start
            .append("mpath")
            .attr("href", `#${d.id}`); // Link to the specific path ID
        }
      });

    linkSelectionRef.current = linkGroup as unknown as d3.Selection<SVGGElement, any, any, any>;

    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      )
      .on("click", (event, d) => onNodeClickRef.current(d.id))
      .on("dblclick", (event, d) => {
          if (onNodeDoubleClickRef.current) {
              onNodeDoubleClickRef.current(d.id);
          }
      });
    
    nodeSelectionRef.current = nodeGroup as unknown as d3.Selection<SVGGElement, any, any, any>;

    // --- Node Visuals (Rounded Rectangles) ---
    const rectWidth = 140;
    const rectHeight = 50;

    // Background Rect
    nodeGroup.append("rect")
      .attr("width", rectWidth)
      .attr("height", rectHeight)
      .attr("x", -rectWidth / 2)
      .attr("y", -rectHeight / 2)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("fill", d => d.type === 'Infrastructure' ? 'rgba(15, 23, 42, 0.4)' : "#0f172a") // Slate-950, transparent for infra
      .attr("stroke", d => getTypeColor(d.type))
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", d => d.type === 'Infrastructure' ? "4,3" : "none") // Dashed for infra
      .attr("class", "node-rect transition-all duration-300 shadow-sm");

    // Node Label (Top half)
    nodeGroup.append("text")
      .text(d => d.label)
      .attr("x", 0)
      .attr("y", -6)
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .style("pointer-events", "none")
      .style("text-shadow", "0px 1px 2px rgba(0,0,0,0.8)");

    // Status Indicator Group - Only for active components
    const statusGroup = nodeGroup.filter(d => d.type !== 'Infrastructure');

    statusGroup.append("circle")
      .attr("r", 2.5)
      .attr("cx", (d: any) => {
          // If has replicas, balance on left (-42). If not, center it (-22).
          const hasReplicas = d.type === 'Service' && !!d.properties?.replicas;
          return hasReplicas ? -42 : -22; 
      })
      .attr("cy", 13)
      .attr("fill", "#4ade80")
      .attr("class", "animate-pulse"); // Add pulse

    statusGroup.append("text")
      .text("Online")
      .attr("x", (d: any) => {
          const hasReplicas = d.type === 'Service' && !!d.properties?.replicas;
          return hasReplicas ? -36 : -16;
      })
      .attr("y", 16)
      .attr("text-anchor", "start")
      .attr("font-size", "9px")
      .attr("font-family", "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace")
      .attr("fill", "#94a3b8")
      .style("pointer-events", "none");

    // Replica Count Indicator (Right Side) - Only for Services with replica property
    const replicaGroup = nodeGroup.filter(d => d.type === 'Service' && !!d.properties?.replicas);
    
    // Pill Background
    replicaGroup.append("rect")
        .attr("x", 12)
        .attr("y", 6)
        .attr("width", 46)
        .attr("height", 14)
        .attr("rx", 4)
        .attr("fill", "rgba(30, 41, 59, 0.5)") // Slate-800/50
        .attr("stroke", "#3b82f6") // Blue-500
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.4);

    // Text
    replicaGroup.append("text")
        .text((d: any) => `${d.properties.replicas} pods`)
        .attr("x", 35) // Center of rect (12 + 23)
        .attr("y", 16)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("font-weight", "600")
        .attr("fill", "#60a5fa") // Blue-400
        .style("pointer-events", "none");
    
    // Label for Infrastructure (Simple Type)
    nodeGroup.filter(d => d.type === 'Infrastructure')
      .append("text")
      .text("INFRASTRUCTURE")
      .attr("x", 0)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("fill", "#64748b")
      .attr("letter-spacing", "1px")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      // Calculate straight paths
      linkGroup.select("path.base-link")
        .attr("d", (d: any) => {
            // Straight Line Logic for all links
            return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
        });

      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      // FIX POSITION ON RELEASE
      d.fx = d.x;
      d.fy = d.y;
    }

    return () => {
        simulation.stop();
    };
  }, [data]); // Only run when topology data changes

  // 2. Visual Update Effect - Runs when active status changes (lightweight)
  useEffect(() => {
      if (!nodeSelectionRef.current) return;
      
      const getTypeColor = (type: string) => {
        if (type === 'Database') return '#a855f7';
        if (type === 'Gateway') return '#ec4899';
        if (type === 'Cache') return '#f59e0b';
        if (type === 'Infrastructure') return '#94a3b8';
        return '#3b82f6';
      };

      nodeSelectionRef.current.select("rect.node-rect")
        .attr("stroke", (d: any) => activeNodeIds.has(d.id) ? "#22d3ee" : getTypeColor(d.type))
        .attr("stroke-width", (d: any) => activeNodeIds.has(d.id) ? 3 : 2)
        .attr("fill", (d: any) => {
             if (activeNodeIds.has(d.id)) return "#164e63";
             if (d.type === 'Infrastructure') return 'rgba(15, 23, 42, 0.4)';
             return "#0f172a";
        })
        .attr("class", (d: any) => activeNodeIds.has(d.id) ? "node-rect shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-300" : "node-rect transition-all duration-300");
  }, [activeNodeIds]);

  // 3. Resize Effect - Update simulation forces without destroying DOM
  useEffect(() => {
      if (!containerRef.current || !simulationRef.current || !svgRef.current) return;

      const resizeObserver = new ResizeObserver(entries => {
          for (const entry of entries) {
              const { width, height } = entry.contentRect;
              
              const simulation = simulationRef.current;
              if (!simulation) return;

              // Recalculate forces based on new dimensions
              const treeHeight = (svgRef.current as any).__treeHeight || 400;
              const levelHeight = 120;
              const topMargin = Math.max(60, (height - treeHeight) / 2);

              simulation.force("x", d3.forceX(width / 2).strength(0.2));
              simulation.force("y", d3.forceY((d: any) => topMargin + (d.level * levelHeight)).strength(1.5));
              
              // Gently reheat the simulation to drift to new center
              simulation.alpha(0.3).restart();
          }
      });

      resizeObserver.observe(containerRef.current);

      return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-900 overflow-hidden relative">
       <div className="absolute top-2 left-2 z-10 pointer-events-none">
        <div className="flex flex-col gap-1 text-[9px] text-slate-400 opacity-70">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Service</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> DB</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500"></span> Gateway</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-slate-500 border-dashed"></span> Infra</span>
          <div className="mt-2 pt-2 border-t border-slate-700">
             <span className="flex items-center gap-1 mb-0.5"><span className="w-3 h-0.5 bg-cyan-600"></span> Call Flow</span>
             <span className="flex items-center gap-1 mb-0.5"><span className="w-3 h-0.5 bg-slate-500"></span> Deployment</span>
             <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-slate-500"></span> Dependency</span>
          </div>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default TopologyGraph;
