
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Topology, TopologyLink, TopologyLayer } from '../types';

// 链接类型选项
const LINK_TYPES = [
  { value: 'call', label: 'API Call', color: '#0891b2', description: '服务间 API 调用' },
  { value: 'dependency', label: 'Dependency', color: '#64748b', description: '依赖关系' },
  { value: 'deployment', label: 'Deployment', color: '#334155', description: '部署关系' },
];

// Layer configuration for 5-layer visualization
const LAYER_CONFIG: Record<TopologyLayer, { index: number; label: string; color: string; borderColor: string }> = {
  scenario: {
    index: 0,
    label: 'Business Scenario',
    color: 'rgba(236, 72, 153, 0.08)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  flow: {
    index: 1,
    label: 'Business Flow',
    color: 'rgba(168, 85, 247, 0.08)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  application: {
    index: 2,
    label: 'Business Application',
    color: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  middleware: {
    index: 3,
    label: 'Middleware',
    color: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  infrastructure: {
    index: 4,
    label: 'Infrastructure',
    color: 'rgba(148, 163, 184, 0.08)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
};

const LAYER_ORDER: TopologyLayer[] = ['scenario', 'flow', 'application', 'middleware', 'infrastructure'];

interface LinkingState {
  sourceNodeId: string;
  sourcePort: 'top' | 'bottom';
}

interface TopologyGraphProps {
  data: Topology;
  activeNodeIds: Set<string>;
  onNodeClick: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onCreateLink?: (link: { source: string; target: string; type: string }) => void;
  showLegend?: boolean;
}

const TopologyGraph: React.FC<TopologyGraphProps> = ({ data, activeNodeIds, onNodeClick, onNodeDoubleClick, onCreateLink, showLegend = true }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeSelectionRef = useRef<d3.Selection<SVGGElement, any, any, any> | null>(null);

  // 链接状态管理
  const [linkingState, setLinkingState] = useState<LinkingState | null>(null);
  const [pendingLink, setPendingLink] = useState<{ source: string; target: string } | null>(null);
  const [showLinkTypeModal, setShowLinkTypeModal] = useState(false);
  const [linkCreatedMessage, setLinkCreatedMessage] = useState<string | null>(null);

  const onNodeClickRef = useRef(onNodeClick);
  const onNodeDoubleClickRef = useRef(onNodeDoubleClick);
  const onCreateLinkRef = useRef(onCreateLink);

  // 处理连接点点击
  const handlePortClick = useCallback((nodeId: string, port: 'top' | 'bottom', event: Event) => {
    event.stopPropagation();

    if (!linkingState) {
      // 开始链接
      setLinkingState({ sourceNodeId: nodeId, sourcePort: port });
    } else {
      // 完成链接
      if (linkingState.sourceNodeId !== nodeId) {
        // 根据端口决定 source 和 target
        const source = linkingState.sourcePort === 'bottom' ? linkingState.sourceNodeId : nodeId;
        const target = linkingState.sourcePort === 'bottom' ? nodeId : linkingState.sourceNodeId;
        setPendingLink({ source, target });
        setShowLinkTypeModal(true);
      }
      setLinkingState(null);
    }
  }, [linkingState]);

  // 取消链接
  const cancelLinking = useCallback(() => {
    setLinkingState(null);
    setPendingLink(null);
    setShowLinkTypeModal(false);
  }, []);

  // 确认创建链接
  const confirmCreateLink = useCallback((linkType: string) => {
    if (pendingLink && onCreateLinkRef.current) {
      onCreateLinkRef.current({
        source: pendingLink.source,
        target: pendingLink.target,
        type: linkType
      });
      // 显示成功消息
      const sourceName = data.nodes.find(n => n.id === pendingLink.source)?.label || pendingLink.source;
      const targetName = data.nodes.find(n => n.id === pendingLink.target)?.label || pendingLink.target;
      const linkLabel = LINK_TYPES.find(l => l.value === linkType)?.label || linkType;
      setLinkCreatedMessage(`已创建 ${linkLabel} 链接: ${sourceName} → ${targetName}`);
      setTimeout(() => setLinkCreatedMessage(null), 3000);
    }
    setPendingLink(null);
    setShowLinkTypeModal(false);
  }, [pendingLink, data.nodes]);

  const handlePortClickRef = useRef(handlePortClick);
  // 同步更新 ref，确保点击时能获取最新的 handler
  handlePortClickRef.current = handlePortClick;

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
    onNodeDoubleClickRef.current = onNodeDoubleClick;
    onCreateLinkRef.current = onCreateLink;
  }, [onNodeClick, onNodeDoubleClick, onCreateLink]);

  // 高亮活跃节点
  useEffect(() => {
    if (!nodeSelectionRef.current) return;

    nodeSelectionRef.current.select("rect.node-rect")
      .attr("stroke-width", (d: any) => activeNodeIds.has(d.data?.id || d.id) ? 3.5 : (d.data?.isShadow || d.isShadow ? 1.5 : 2))
      .attr("filter", (d: any) => {
        const nodeData = d.data || d;
        if (activeNodeIds.has(nodeData.id)) {
          const color = getTypeColor(nodeData.type, nodeData.isShadow);
          return `drop-shadow(0 0 12px ${hexToRgba(color, 0.8)})`;
        }
        return "none";
      })
      .attr("stroke", (d: any) => {
        const nodeData = d.data || d;
        // 活跃节点也使用自身颜色，只是更亮/更醒目
        return getTypeColor(nodeData.type, nodeData.isShadow);
      });

    // 添加/移除脉冲动画类
    nodeSelectionRef.current.classed("node-active", (d: any) => activeNodeIds.has(d.data?.id || d.id));
  }, [activeNodeIds]);

  // 高亮链接模式中的源端口
  useEffect(() => {
    if (!nodeSelectionRef.current) return;

    // 重置所有端口样式
    nodeSelectionRef.current.selectAll("circle.port")
      .attr("fill", "#334155")
      .attr("stroke", "#64748b")
      .attr("r", 8)
      .attr("filter", "none");

    // 高亮源节点的端口
    if (linkingState) {
      nodeSelectionRef.current.filter((d: any) => d.data.id === linkingState.sourceNodeId)
        .select(`circle.port-${linkingState.sourcePort}`)
        .attr("fill", "#22d3ee")
        .attr("stroke", "#06b6d4")
        .attr("r", 10)
        .attr("filter", "drop-shadow(0 0 8px rgba(34, 211, 238, 0.8))");
    }
  }, [linkingState]);

  const getTypeColor = (type: string, isShadow?: boolean) => {
    if (isShadow) return '#a855f7'; // Purple for discovery
    if (type === 'Database') return '#a855f7';
    if (type === 'Gateway') return '#ec4899';
    if (type === 'Cache') return '#f59e0b';
    if (type === 'Infrastructure') return '#94a3b8';
    return '#3b82f6';
  };

  // 将 hex 颜色转换为 rgba 用于 drop-shadow
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // 构建树形层级结构
    // 1. 只处理 call 类型的链接来构建流量树
    const callLinks = data.links.filter(l => l.type === 'call' || !l.type);

    // 2. 找出入度为0的节点作为根节点候选
    const nodeMap = new Map(data.nodes.map(n => [n.id, { ...n }]));
    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();
    const childrenMap = new Map<string, string[]>();

    data.nodes.forEach(n => {
      inDegree.set(n.id, 0);
      outDegree.set(n.id, 0);
      childrenMap.set(n.id, []);
    });

    callLinks.forEach(l => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
      outDegree.set(sourceId, (outDegree.get(sourceId) || 0) + 1);
      childrenMap.get(sourceId)?.push(targetId);
    });

    // 3. 找出参与流量的节点（有call类型入度或出度的节点）
    const nodesInCallFlow = new Set<string>();
    callLinks.forEach(l => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      nodesInCallFlow.add(sourceId);
      nodesInCallFlow.add(targetId);
    });

    // 3.1 找出有任何链接的节点（包括所有类型的链接）
    const nodesWithAnyLink = new Set<string>();
    data.links.forEach(l => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      nodesWithAnyLink.add(sourceId);
      nodesWithAnyLink.add(targetId);
    });

    // 4. 找出所有根节点（入度为0且参与流量的节点）
    const rootNodes = data.nodes.filter(n =>
      (inDegree.get(n.id) || 0) === 0 && nodesInCallFlow.has(n.id)
    );

    // 4.1 找出孤立节点（没有任何链接的节点）
    const orphanNodes = data.nodes.filter(n => !nodesWithAnyLink.has(n.id));

    // 5. 构建层级数据结构（使用BFS避免循环）
    const visited = new Set<string>();
    const buildHierarchy = (nodeId: string): any => {
      if (visited.has(nodeId)) return null;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (!node) return null;

      const children = (childrenMap.get(nodeId) || [])
        .map(childId => buildHierarchy(childId))
        .filter(Boolean);

      return {
        ...node,
        children: children.length > 0 ? children : undefined
      };
    };

    // 构建树形结构的子节点
    const treeChildren = rootNodes.map(n => {
      visited.clear();
      return buildHierarchy(n.id);
    }).filter(Boolean);

    // 找出有非call链接但没有call链接的节点（独立但非孤立）
    const standaloneNodes = data.nodes.filter(n =>
      !nodesInCallFlow.has(n.id) && nodesWithAnyLink.has(n.id)
    );
    const standaloneChildren = standaloneNodes.map(n => ({
      ...n,
      isStandalone: true, // 有链接但不在call流中
      children: undefined
    }));

    // 将真正孤立的节点（没有任何链接）也加入
    const orphanChildren = orphanNodes.map(n => ({
      ...n,
      isOrphan: true, // 标记为孤立节点（无任何链接）
      children: undefined
    }));

    const hierarchyData = {
      id: '__virtual_root__',
      label: 'Root',
      type: 'virtual',
      children: [...treeChildren, ...standaloneChildren, ...orphanChildren]
    };

    // 6. 使用 d3.hierarchy 和 d3.tree 创建布局
    const root = d3.hierarchy(hierarchyData);

    // 使用 nodeSize 确保节点不重叠
    const treeLayout = d3.tree<any>()
      .nodeSize([180, 100]) // [水平间距, 垂直间距]
      .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.5));

    treeLayout(root);

    // 7. 过滤掉虚拟根节点，获取实际节点
    const treeNodes = root.descendants().filter(d => d.data.id !== '__virtual_root__');
    const treeLinks = root.links().filter(d => d.source.data.id !== '__virtual_root__');

    // 8. Layer-based positioning
    const layerHeight = 120; // Height of each layer band
    const layerPadding = 60; // Padding at top

    // Group nodes by layer
    const layerNodeMap = new Map<TopologyLayer, any[]>();
    LAYER_ORDER.forEach(layer => layerNodeMap.set(layer, []));

    treeNodes.forEach((d: any) => {
      const layer = (d.data.layer || 'application') as TopologyLayer;
      layerNodeMap.get(layer)?.push(d);
    });

    // Determine which layers have nodes
    const activeLayers = LAYER_ORDER.filter(l => (layerNodeMap.get(l)?.length || 0) > 0);

    // Calculate layer Y positions
    const layerYPositions = new Map<TopologyLayer, { top: number; center: number; bottom: number }>();
    let currentY = layerPadding;
    activeLayers.forEach((layer) => {
      layerYPositions.set(layer, {
        top: currentY,
        center: currentY + layerHeight / 2,
        bottom: currentY + layerHeight,
      });
      currentY += layerHeight;
    });

    // Position nodes within their layer bands
    activeLayers.forEach(layer => {
      const nodesInLayer = layerNodeMap.get(layer) || [];
      const layerPos = layerYPositions.get(layer);
      if (!layerPos || nodesInLayer.length === 0) return;

      // Sort nodes by their original x position to maintain relative order
      nodesInLayer.sort((a: any, b: any) => a.x - b.x);

      const nodeSpacing = 180;
      const totalWidth = (nodesInLayer.length - 1) * nodeSpacing;
      const startX = -totalWidth / 2;

      nodesInLayer.forEach((node: any, idx: number) => {
        node.x = startX + idx * nodeSpacing;
        node.y = layerPos.center;
      });
    });

    // 计算实际边界
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    treeNodes.forEach((d: any) => {
      minX = Math.min(minX, d.x);
      maxX = Math.max(maxX, d.x);
      minY = Math.min(minY, d.y);
      maxY = Math.max(maxY, d.y);
    });

    const nodeRectWidth = 140;
    const nodeRectHeight = 50;
    const rectWidth = 140;
    const rectHeight = 50;
    const contentWidth = maxX - minX + nodeRectWidth;
    const contentHeight = maxY - minY + nodeRectHeight;

    // 计算缩放以适应视口（留出边距）
    const margin = 40;
    const scaleX = (width - margin * 2) / contentWidth;
    const scaleY = (height - margin * 2) / contentHeight;
    const initialScale = Math.min(scaleX, scaleY, 1);

    // 计算内容的中心点
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // 居中偏移：使内容中心与画布中心对齐
    const offsetX = width / 2 - centerX * initialScale;
    const offsetY = height / 2 - centerY * initialScale;

    // 创建主容器
    const g = svg.append("g");

    // 添加缩放和平移支持
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 2.5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // 设置初始变换 - 居中显示
    svg.call(zoom.transform, d3.zoomIdentity.translate(offsetX, offsetY).scale(initialScale));

    // 定义 defs
    const defs = svg.append("defs");

    // 流量粒子箭头
    defs.append("marker")
      .attr("id", "flow-arrow")
      .attr("viewBox", "0 -3 6 6")
      .attr("refX", 3)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-3L6,0L0,3")
      .attr("fill", "#22d3ee");

    // Draw layer backgrounds
    const layerGroup = g.append("g").attr("class", "layer-backgrounds");

    // Calculate layer background width - at least 60% of viewport width
    const layerContentWidth = maxX - minX + 400;
    const minLayerWidth = (width / initialScale) * 0.6; // 60% of viewport
    const layerWidth = Math.max(layerContentWidth, minLayerWidth);
    const layerCenterX = (minX + maxX) / 2;
    const layerStartX = layerCenterX - layerWidth / 2;
    const labelOffset = layerStartX - 20; // Position labels to the left of layer background

    activeLayers.forEach(layer => {
      const config = LAYER_CONFIG[layer];
      const yPos = layerYPositions.get(layer);
      if (!yPos) return;

      // Background rectangle spanning at least 60% of viewport width
      layerGroup.append("rect")
        .attr("x", layerStartX)
        .attr("y", yPos.top)
        .attr("width", layerWidth)
        .attr("height", layerHeight)
        .attr("fill", config.color)
        .attr("stroke", config.borderColor)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,2")
        .attr("rx", 4);

      // Layer label on the left
      layerGroup.append("text")
        .attr("x", labelOffset)
        .attr("y", yPos.center)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("fill", config.borderColor.replace('0.3', '0.95'))
        .attr("font-size", "12px")
        .attr("font-weight", "700")
        .attr("letter-spacing", "0.5px")
        .text(config.label);
    });

    // 绘制连接线
    const linkGroup = g.append("g")
      .selectAll("g")
      .data(treeLinks)
      .join("g");

    // 使用曲线路径 - 从底部端口到顶部端口
    const linkPath = linkGroup.append("path")
      .attr("id", (d, i) => `link-${i}`)
      .attr("fill", "none")
      .attr("class", "base-link")
      .attr("stroke-width", 2)
      .attr("stroke", "#0891b2")
      .attr("opacity", 0.7)
      .attr("d", (d: any) => {
        // 从源节点底部端口到目标节点顶部端口
        const sx = d.source.x;
        const sy = d.source.y + rectHeight / 2; // 底部端口
        const tx = d.target.x;
        const ty = d.target.y - rectHeight / 2; // 顶部端口
        const my = (sy + ty) / 2;
        return `M${sx},${sy} C${sx},${my} ${tx},${my} ${tx},${ty}`;
      });

    // 添加多个流动粒子
    [0, 0.33, 0.66].forEach((offset, i) => {
      linkGroup.append("circle")
        .attr("r", 3)
        .attr("fill", "#22d3ee")
        .attr("opacity", 0.8)
        .append("animateMotion")
        .attr("dur", "2s")
        .attr("repeatCount", "indefinite")
        .attr("begin", `${offset * 2}s`)
        .append("mpath")
        .attr("href", (d: any, j: number) => `#link-${j}`);
    });

    // 添加箭头指示器（沿路径移动）
    linkGroup.append("polygon")
      .attr("points", "-4,-3 4,0 -4,3")
      .attr("fill", "#22d3ee")
      .attr("opacity", 0.9)
      .append("animateMotion")
      .attr("dur", "2s")
      .attr("repeatCount", "indefinite")
      .attr("rotate", "auto")
      .append("mpath")
      .attr("href", (d: any, i: number) => `#link-${i}`);

    // 收集树中已渲染的 call 链接
    const renderedCallLinks = new Set<string>();
    treeLinks.forEach((d: any) => {
      const sourceId = d.source.data.id;
      const targetId = d.target.data.id;
      renderedCallLinks.add(`${sourceId}->${targetId}`);
    });

    // 处理额外链接：非 call 类型 + 不在树中的 call 类型
    const extraLinks = data.links
      .map(l => ({
        source: typeof l.source === 'object' ? (l.source as any).id : l.source,
        target: typeof l.target === 'object' ? (l.target as any).id : l.target,
        type: l.type || 'call',
        confidence: l.confidence
      }))
      .filter(l => {
        // 非 call 类型总是显示
        if (l.type !== 'call') return true;
        // call 类型：只有不在树中的才额外显示
        return !renderedCallLinks.has(`${l.source}->${l.target}`);
      });

    // 创建节点位置映射
    const nodePositions = new Map<string, { x: number, y: number }>();
    treeNodes.forEach((d: any) => {
      nodePositions.set(d.data.id, { x: d.x, y: d.y });
    });

    // 绘制额外链接（非树形 call 链接 + dependency/deployment/inferred）
    const extraLinkGroup = g.append("g")
      .selectAll("path")
      .data(extraLinks.filter(l => nodePositions.has(l.source) && nodePositions.has(l.target)))
      .join("path")
      .attr("fill", "none")
      .attr("stroke-width", d => d.type === 'call' ? 2 : 1.5)
      .attr("stroke", d => {
        if (d.type === 'call') return '#0891b2'; // cyan for call links
        if (d.type === 'inferred') return '#c084fc';
        if (d.type === 'deployment') return '#334155';
        return '#64748b'; // dependency
      })
      .attr("stroke-dasharray", d => (d.type === 'dependency' || d.type === 'inferred') ? "6,4" : "none")
      .attr("opacity", d => {
        if (d.type === 'call') return 0.7;
        if (d.type === 'deployment') return 0.3;
        return 0.5;
      })
      .attr("d", d => {
        const source = nodePositions.get(d.source)!;
        const target = nodePositions.get(d.target)!;
        // 根据相对位置决定从哪个端口连接
        const sourceIsAbove = source.y < target.y;
        const sx = source.x;
        const sy = sourceIsAbove ? source.y + rectHeight / 2 : source.y - rectHeight / 2;
        const tx = target.x;
        const ty = sourceIsAbove ? target.y - rectHeight / 2 : target.y + rectHeight / 2;
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;
        // 使用弧线区分额外链接
        const dx = tx - sx;
        const dy = ty - sy;
        const dr = Math.sqrt(dx * dx + dy * dy) * 0.3;
        return `M${sx},${sy} Q${mx + dr * 0.3},${my} ${tx},${ty}`;
      });

    // 用于更新连接线的函数
    const updateLinks = () => {
      // 更新树形连接线 - 从底部端口到顶部端口
      linkGroup.select("path.base-link")
        .attr("d", (d: any) => {
          const sx = d.source.x;
          const sy = d.source.y + rectHeight / 2; // 底部端口
          const tx = d.target.x;
          const ty = d.target.y - rectHeight / 2; // 顶部端口
          const my = (sy + ty) / 2;
          return `M${sx},${sy} C${sx},${my} ${tx},${my} ${tx},${ty}`;
        });

      // 更新节点位置映射
      treeNodes.forEach((d: any) => {
        nodePositions.set(d.data.id, { x: d.x, y: d.y });
      });

      // 更新非树形连接线 - 从端口到端口
      extraLinkGroup
        .attr("d", (d: any) => {
          const source = nodePositions.get(d.source);
          const target = nodePositions.get(d.target);
          if (!source || !target) return "";
          // 根据相对位置决定从哪个端口连接
          const sourceIsAbove = source.y < target.y;
          const sx = source.x;
          const sy = sourceIsAbove ? source.y + rectHeight / 2 : source.y - rectHeight / 2;
          const tx = target.x;
          const ty = sourceIsAbove ? target.y - rectHeight / 2 : target.y + rectHeight / 2;
          const mx = (sx + tx) / 2;
          const my = (sy + ty) / 2;
          const dx = tx - sx;
          const dy = ty - sy;
          const dr = Math.sqrt(dx * dx + dy * dy) * 0.3;
          return `M${sx},${sy} Q${mx + dr * 0.3},${my} ${tx},${ty}`;
        });
    };

    // 拖拽行为
    const drag = d3.drag<SVGGElement, any>()
      .filter(event => {
        // 排除端口点击，避免拖拽干扰链接操作
        return !event.target.classList.contains('port');
      })
      .on("start", function(event, d) {
        d3.select(this).raise().classed("dragging", true);
      })
      .on("drag", function(event, d) {
        d.x = event.x;
        d.y = event.y;
        d3.select(this).attr("transform", `translate(${d.x},${d.y})`);
        updateLinks();
      })
      .on("end", function(event, d) {
        d3.select(this).classed("dragging", false);
      });

    // 绘制节点
    const nodeGroup = g.append("g")
      .selectAll("g")
      .data(treeNodes)
      .join("g")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
      .attr("cursor", "grab")
      .call(drag)
      .on("click", (e, d: any) => {
        // 排除端口点击
        if (!e.defaultPrevented && !e.target.classList.contains('port')) {
          onNodeClickRef.current(d.data.id);
        }
      })
      .on("dblclick", (e, d: any) => onNodeDoubleClickRef.current?.(d.data.id));

    nodeSelectionRef.current = nodeGroup as any;

    nodeGroup.append("rect")
      .attr("width", rectWidth)
      .attr("height", rectHeight)
      .attr("x", -rectWidth / 2)
      .attr("y", -rectHeight / 2)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("fill", (d: any) => {
        if (d.data.isShadow) return "rgba(88, 28, 135, 0.2)";
        if (d.data.isOrphan) return "rgba(30, 41, 59, 0.8)"; // 真正孤立节点（无任何链接）背景
        return "#0f172a";
      })
      .attr("stroke", (d: any) => {
        if (d.data.isOrphan) return "#64748b"; // 真正孤立节点边框色
        return getTypeColor(d.data.type, d.data.isShadow);
      })
      .attr("stroke-width", (d: any) => d.data.isShadow ? 1.5 : 2)
      .attr("stroke-dasharray", (d: any) => {
        if (d.data.isShadow) return "5,5";
        if (d.data.isOrphan) return "4,2"; // 真正孤立节点虚线边框
        return "none";
      })
      .attr("class", "node-rect transition-all duration-300");

    nodeGroup.append("text")
      .text((d: any) => d.data.label)
      .attr("x", 0)
      .attr("y", -6)
      .attr("text-anchor", "middle")
      .attr("fill", (d: any) => {
        if (d.data.isShadow) return "#a78bfa";
        if (d.data.isOrphan) return "#94a3b8";
        return "#e2e8f0";
      })
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .style("pointer-events", "none");

    nodeGroup.append("text")
      .text((d: any) => {
        if (d.data.isShadow) return "INFERRED";
        if (d.data.isOrphan) return "ISOLATED"; // 真正孤立（无任何链接）
        return "ONLINE";
      })
      .attr("x", 0)
      .attr("y", 13)
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("font-family", "monospace")
      .attr("fill", (d: any) => {
        if (d.data.isShadow) return "#c084fc";
        if (d.data.isOrphan) return "#64748b";
        return "#4ade80";
      })
      .style("pointer-events", "none");

    // 添加连接点（上边中点和下边中点）
    const portRadius = 8;

    // 上边连接点
    nodeGroup.append("circle")
      .attr("class", "port port-top")
      .attr("cx", 0)
      .attr("cy", -rectHeight / 2)
      .attr("r", portRadius)
      .attr("fill", "#334155")
      .attr("stroke", "#64748b")
      .attr("stroke-width", 2)
      .attr("cursor", "crosshair")
      .style("transition", "all 0.15s ease-out")
      .on("mouseenter", function() {
        d3.select(this)
          .attr("fill", "#22d3ee")
          .attr("stroke", "#22d3ee")
          .attr("r", portRadius + 3)
          .attr("filter", "drop-shadow(0 0 4px rgba(34, 211, 238, 0.6))");
      })
      .on("mouseleave", function() {
        d3.select(this)
          .attr("fill", "#334155")
          .attr("stroke", "#64748b")
          .attr("r", portRadius)
          .attr("filter", "none");
      })
      .on("click", (e: any, d: any) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('Top port clicked:', d.data.id);
        handlePortClickRef.current(d.data.id, 'top', e);
      });

    // 下边连接点
    nodeGroup.append("circle")
      .attr("class", "port port-bottom")
      .attr("cx", 0)
      .attr("cy", rectHeight / 2)
      .attr("r", portRadius)
      .attr("fill", "#334155")
      .attr("stroke", "#64748b")
      .attr("stroke-width", 2)
      .attr("cursor", "crosshair")
      .style("transition", "all 0.15s ease-out")
      .on("mouseenter", function() {
        d3.select(this)
          .attr("fill", "#22d3ee")
          .attr("stroke", "#22d3ee")
          .attr("r", portRadius + 3)
          .attr("filter", "drop-shadow(0 0 4px rgba(34, 211, 238, 0.6))");
      })
      .on("mouseleave", function() {
        d3.select(this)
          .attr("fill", "#334155")
          .attr("stroke", "#64748b")
          .attr("r", portRadius)
          .attr("filter", "none");
      })
      .on("click", (e: any, d: any) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('Bottom port clicked:', d.data.id);
        handlePortClickRef.current(d.data.id, 'bottom', e);
      });

  }, [data]);

  // 获取节点名称
  const getNodeName = (nodeId: string) => {
    const node = data.nodes.find(n => n.id === nodeId);
    return node?.label || nodeId;
  };

  // 处理背景点击（取消链接模式）
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // 只有点击 SVG 背景时才取消链接
    if (linkingState && (e.target as HTMLElement).tagName === 'svg') {
      cancelLinking();
    }
  }, [linkingState, cancelLinking]);

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-900 overflow-hidden relative" onClick={handleBackgroundClick}>
      {/* 图例 */}
      {showLegend && (
        <div className="absolute top-2 left-2 z-10 pointer-events-none p-3 bg-slate-950/40 backdrop-blur rounded-lg border border-slate-800">
          <div className="flex flex-col gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-blue-500"></div> System Node</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded border border-purple-500 border-dashed"></div> Ghost Node (AI Discovered)</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded border border-slate-500" style={{borderStyle: 'dashed'}}></div> Isolated Node (No Links)</div>
            <div className="mt-2 pt-2 border-t border-slate-800">
               <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-cyan-600"></div> Static Link</div>
               <div className="flex items-center gap-2"><div className="w-3 h-0.5 border-t border-dashed border-purple-400"></div> Inferred Traffic</div>
            </div>
          </div>
        </div>
      )}

      {/* 链接模式指示器 */}
      {linkingState && (
        <div className="absolute top-2 right-2 z-20 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg backdrop-blur">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span>链接模式: 从 "{getNodeName(linkingState.sourceNodeId)}" 开始</span>
            <button
              onClick={(e) => { e.stopPropagation(); cancelLinking(); }}
              className="ml-2 text-cyan-300 hover:text-white"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 链接创建成功提示 */}
      {linkCreatedMessage && (
        <div className="absolute top-2 right-2 z-20 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg backdrop-blur animate-pulse">
          <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{linkCreatedMessage}</span>
          </div>
        </div>
      )}

      <svg ref={svgRef} className="w-full h-full" />

      {/* 链接类型选择弹窗 */}
      {showLinkTypeModal && pendingLink && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={cancelLinking}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-2">选择链接类型</h3>
            <p className="text-slate-400 text-sm mb-4">
              从 <span className="text-cyan-400">{getNodeName(pendingLink.source)}</span> 到 <span className="text-cyan-400">{getNodeName(pendingLink.target)}</span>
            </p>
            <div className="space-y-2">
              {LINK_TYPES.map(linkType => (
                <button
                  key={linkType.value}
                  onClick={() => confirmCreateLink(linkType.value)}
                  className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-slate-600 transition-all text-left"
                >
                  <div className="w-8 h-1 rounded" style={{ backgroundColor: linkType.color }}></div>
                  <div>
                    <div className="text-white font-medium text-sm">{linkType.label}</div>
                    <div className="text-slate-500 text-xs">{linkType.description}</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={cancelLinking}
              className="w-full mt-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopologyGraph;
