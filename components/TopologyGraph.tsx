
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Topology, TopologyLink, TopologyLayer } from '../types';
import { useTopology } from '../services/hooks/useTopology';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

// Link type options
const LINK_TYPES = [
  { value: 'call', label: 'API Call', color: '#0891b2', description: 'Service-to-service API calls' },
  { value: 'dependency', label: 'Dependency', color: '#64748b', description: 'Dependency relationship' },
  { value: 'deployment', label: 'Deployment', color: '#334155', description: 'Deployment relationship' },
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

/** Link data for editing */
interface EditableLinkData {
  source: string;
  target: string;
  type: string;
  relationshipId?: number;
}

interface TopologyGraphProps {
  /** Static data - used when resourceId is not provided */
  data?: Topology;
  /** Resource ID for API-based data fetching */
  resourceId?: number;
  activeNodeIds?: Set<string>;
  onNodeClick?: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onCreateLink?: (link: { source: string; target: string; type: string }) => void;
  /** Callback when updating a link type */
  onUpdateLink?: (link: { source: string; target: string; oldType: string; newType: string; relationshipId?: number }) => void;
  /** Callback when deleting a link */
  onDeleteLink?: (link: { source: string; target: string; type: string; relationshipId?: number }) => void;
  showLegend?: boolean;
  /** Callback when navigating to a subgraph */
  onNavigateToSubgraph?: (subgraphId: number) => void;
}

// Layout cache interface
interface LayoutCache {
  nodePositions: Record<string, { x: number; y: number }>;
  layerHeights: Record<string, number>;
  timestamp: number;
}

// Generate cache key based on topology node IDs
const getLayoutCacheKey = (nodes: { id: string }[]) => {
  const sortedIds = nodes.map(n => n.id).sort().join(',');
  return `topology-layout-${btoa(sortedIds).slice(0, 32)}`;
};

// Save layout to localStorage
const saveLayoutCache = (cacheKey: string, nodePositions: Map<string, { x: number; y: number }>, layerHeights: Map<string, number>) => {
  try {
    const cache: LayoutCache = {
      nodePositions: Object.fromEntries(nodePositions),
      layerHeights: Object.fromEntries(layerHeights),
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save layout cache:', e);
  }
};

// Load layout from localStorage
const loadLayoutCache = (cacheKey: string): LayoutCache | null => {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const cache = JSON.parse(cached) as LayoutCache;
      // Cache expires after 7 days
      if (Date.now() - cache.timestamp < 7 * 24 * 60 * 60 * 1000) {
        return cache;
      }
    }
  } catch (e) {
    console.warn('Failed to load layout cache:', e);
  }
  return null;
};

const TopologyGraph: React.FC<TopologyGraphProps> = ({
  data: staticData,
  resourceId,
  activeNodeIds = new Set(),
  onNodeClick = () => {},
  onNodeDoubleClick,
  onCreateLink,
  onUpdateLink,
  onDeleteLink,
  showLegend = true,
  onNavigateToSubgraph,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeSelectionRef = useRef<d3.Selection<SVGGElement, any, any, any> | null>(null);

  // Cache key for current topology
  const layoutCacheKey = useRef<string>('');

  // 链接状态管理 - ALL hooks must come before any early returns
  const [linkingState, setLinkingState] = useState<LinkingState | null>(null);
  const [pendingLink, setPendingLink] = useState<{ source: string; target: string } | null>(null);
  const [showLinkTypeModal, setShowLinkTypeModal] = useState(false);
  const [linkCreatedMessage, setLinkCreatedMessage] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Link edit modal state
  const [selectedLink, setSelectedLink] = useState<EditableLinkData | null>(null);
  const [showLinkEditModal, setShowLinkEditModal] = useState(false);

  const onNodeClickRef = useRef(onNodeClick);
  const onNodeDoubleClickRef = useRef(onNodeDoubleClick);
  const onCreateLinkRef = useRef(onCreateLink);
  const onUpdateLinkRef = useRef(onUpdateLink);
  const onDeleteLinkRef = useRef(onDeleteLink);
  const onNavigateToSubgraphRef = useRef(onNavigateToSubgraph);

  // Fetch topology data from API when resourceId is provided
  console.log('[TopologyGraph] Rendering with resourceId:', resourceId);

  const {
    topology: apiTopology,
    rawData,
    loading: apiLoading,
    error: apiError,
    refetch,
  } = useTopology(resourceId ?? null, { autoFetch: !!resourceId });

  console.log('[TopologyGraph] useTopology result:', { apiTopology, apiLoading, apiError });

  // Use API data or static data
  const data: Topology | null = resourceId && apiTopology
    ? {
        nodes: apiTopology.nodes.map(n => ({
          id: n.id,
          label: n.label,
          type: n.type,
          layer: (n.layer || 'application') as TopologyLayer,
          isShadow: false,
          isSubgraph: n.isSubgraph,
          status: n.status,
        })),
        links: apiTopology.links.map(l => ({
          source: l.source,
          target: l.target,
          type: l.type as TopologyLink['type'],
          confidence: l.confidence,
          relationshipId: l.relationshipId,
        })),
      }
    : staticData ?? null;

  // Determine render state - but DON'T return early, just use for conditional rendering
  const isLoading = resourceId && apiLoading;
  const hasError = resourceId && apiError;
  const isEmpty = !data || data.nodes.length === 0;

  // 处理连接点点击 - ALL HOOKS MUST BE BEFORE ANY RETURNS
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
      // Show success message
      const sourceName = data?.nodes.find(n => n.id === pendingLink.source)?.label || pendingLink.source;
      const targetName = data?.nodes.find(n => n.id === pendingLink.target)?.label || pendingLink.target;
      const linkLabel = LINK_TYPES.find(l => l.value === linkType)?.label || linkType;
      setLinkCreatedMessage(`Created ${linkLabel} link: ${sourceName} → ${targetName}`);
      setTimeout(() => setLinkCreatedMessage(null), 3000);
    }
    setPendingLink(null);
    setShowLinkTypeModal(false);
  }, [pendingLink, data?.nodes]);

  const handlePortClickRef = useRef(handlePortClick);
  // 同步更新 ref，确保点击时能获取最新的 handler
  handlePortClickRef.current = handlePortClick;

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
    onNodeDoubleClickRef.current = onNodeDoubleClick;
    onCreateLinkRef.current = onCreateLink;
    onUpdateLinkRef.current = onUpdateLink;
    onDeleteLinkRef.current = onDeleteLink;
    onNavigateToSubgraphRef.current = onNavigateToSubgraph;
  }, [onNodeClick, onNodeDoubleClick, onCreateLink, onUpdateLink, onDeleteLink, onNavigateToSubgraph]);

  // Handle link double-click to open edit modal
  const handleLinkDoubleClick = useCallback((linkData: EditableLinkData) => {
    setSelectedLink(linkData);
    setShowLinkEditModal(true);
  }, []);

  // Handle link type update
  const handleUpdateLinkType = useCallback((newType: string) => {
    if (selectedLink && onUpdateLinkRef.current) {
      onUpdateLinkRef.current({
        source: selectedLink.source,
        target: selectedLink.target,
        oldType: selectedLink.type,
        newType,
        relationshipId: selectedLink.relationshipId,
      });
    }
    setShowLinkEditModal(false);
    setSelectedLink(null);
  }, [selectedLink]);

  // Handle link deletion
  const handleDeleteLink = useCallback(() => {
    if (selectedLink && onDeleteLinkRef.current) {
      onDeleteLinkRef.current({
        source: selectedLink.source,
        target: selectedLink.target,
        type: selectedLink.type,
        relationshipId: selectedLink.relationshipId,
      });
    }
    setShowLinkEditModal(false);
    setSelectedLink(null);
  }, [selectedLink]);

  // Ref for link double-click handler (used in D3 effect)
  const handleLinkDoubleClickRef = useRef(handleLinkDoubleClick);
  handleLinkDoubleClickRef.current = handleLinkDoubleClick;

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
    // Note: Do NOT clear visited between root nodes to prevent duplicate nodes
    // If a node is reachable from multiple roots, it should only appear once
    visited.clear(); // Clear once at the start
    const treeChildren = rootNodes.map(n => {
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
    const baseLayerHeight = 120; // Base height of each layer band
    const minLayerHeight = 80; // Minimum layer height
    const layerPadding = 60; // Padding at top

    // Group nodes by layer
    const layerNodeMap = new Map<TopologyLayer, any[]>();
    LAYER_ORDER.forEach(layer => layerNodeMap.set(layer, []));

    treeNodes.forEach((d: any) => {
      const layer = (d.data.layer || 'application') as TopologyLayer;
      layerNodeMap.get(layer)?.push(d);
    });

    // Always show all layers (not just those with nodes)
    // This ensures consistent visualization for both topology views and resource node views
    const activeLayers = [...LAYER_ORDER];

    // Track layer heights (can be expanded during drag)
    const layerHeights = new Map<TopologyLayer, number>();
    activeLayers.forEach(layer => layerHeights.set(layer, baseLayerHeight));

    // Calculate layer Y positions
    const layerYPositions = new Map<TopologyLayer, { top: number; center: number; bottom: number }>();

    const recalculateLayerPositions = () => {
      let currentY = layerPadding;
      activeLayers.forEach((layer) => {
        const h = layerHeights.get(layer) || baseLayerHeight;
        layerYPositions.set(layer, {
          top: currentY,
          center: currentY + h / 2,
          bottom: currentY + h,
        });
        currentY += h;
      });
    };

    // Calculate dependency depth within each layer for intra-layer call links
    const calculateIntraLayerDepth = (nodesInLayer: any[], allLinks: typeof data.links) => {
      if (nodesInLayer.length === 0) return new Map<string, number>();

      const nodeIds = new Set(nodesInLayer.map((n: any) => n.data.id));

      // Find call links within this layer
      const intraLayerLinks = allLinks
        .filter(l => {
          const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
          const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
          return (l.type === 'call' || !l.type) && nodeIds.has(sourceId) && nodeIds.has(targetId);
        })
        .map(l => ({
          source: typeof l.source === 'object' ? (l.source as any).id : l.source,
          target: typeof l.target === 'object' ? (l.target as any).id : l.target,
        }));

      // If no intra-layer links, all nodes are at depth 0
      if (intraLayerLinks.length === 0) {
        const depthMap = new Map<string, number>();
        nodesInLayer.forEach((n: any) => depthMap.set(n.data.id, 0));
        return depthMap;
      }

      // Build adjacency list and calculate in-degree
      const inDegree = new Map<string, number>();
      const children = new Map<string, string[]>();
      nodeIds.forEach(id => {
        inDegree.set(id, 0);
        children.set(id, []);
      });

      intraLayerLinks.forEach(link => {
        inDegree.set(link.target, (inDegree.get(link.target) || 0) + 1);
        children.get(link.source)?.push(link.target);
      });

      // Topological sort with BFS to calculate depth
      const depthMap = new Map<string, number>();
      const queue: string[] = [];

      // Start with nodes that have no incoming edges within the layer
      nodeIds.forEach(id => {
        if ((inDegree.get(id) || 0) === 0) {
          queue.push(id);
          depthMap.set(id, 0);
        }
      });

      while (queue.length > 0) {
        const current = queue.shift()!;
        const currentDepth = depthMap.get(current) || 0;

        children.get(current)?.forEach(child => {
          const newDepth = currentDepth + 1;
          const existingDepth = depthMap.get(child);
          if (existingDepth === undefined || newDepth > existingDepth) {
            depthMap.set(child, newDepth);
          }

          const newInDegree = (inDegree.get(child) || 1) - 1;
          inDegree.set(child, newInDegree);
          if (newInDegree === 0) {
            queue.push(child);
          }
        });
      }

      // Handle any remaining nodes (cycles) - assign them max depth + 1
      const maxDepth = Math.max(...Array.from(depthMap.values()), 0);
      nodeIds.forEach(id => {
        if (!depthMap.has(id)) {
          depthMap.set(id, maxDepth + 1);
        }
      });

      return depthMap;
    };

    // Position nodes within their layer bands based on dependency depth
    const rowHeight = 90; // Height between row centers within a layer (increased for better spacing)
    const nodeHeight = 50; // Height of each node rect
    const layerEdgePadding = 45; // Padding from layer edge to node edge (ensures visual spacing)
    const minRowGap = 40; // Minimum vertical gap between nodes in different rows

    activeLayers.forEach(layer => {
      const nodesInLayer = layerNodeMap.get(layer) || [];
      if (nodesInLayer.length === 0) return;

      // Calculate depth for each node within this layer
      const depthMap = calculateIntraLayerDepth(nodesInLayer, data.links);

      // Group nodes by depth
      const nodesByDepth = new Map<number, any[]>();
      nodesInLayer.forEach((node: any) => {
        const depth = depthMap.get(node.data.id) || 0;
        if (!nodesByDepth.has(depth)) {
          nodesByDepth.set(depth, []);
        }
        nodesByDepth.get(depth)!.push(node);
      });

      // Get sorted depth levels
      const depthLevels = Array.from(nodesByDepth.keys()).sort((a, b) => a - b);
      const numRows = depthLevels.length;

      // Calculate minimum height needed:
      // - Top padding (from layer edge to first node center)
      // - Space for all rows (numRows - 1) * rowHeight
      // - Bottom padding (from last node center to layer edge)
      // - Account for half node height at top and bottom
      const minHeightNeeded = numRows > 1
        ? layerEdgePadding * 2 + (numRows - 1) * rowHeight + nodeHeight
        : layerEdgePadding * 2 + nodeHeight;

      const currentHeight = layerHeights.get(layer) || baseLayerHeight;
      if (minHeightNeeded > currentHeight) {
        layerHeights.set(layer, minHeightNeeded);
      }
    });

    // Recalculate layer positions after height adjustments
    recalculateLayerPositions();

    // Now position nodes within layers using Barycenter method (Sugiyama algorithm)
    // This minimizes edge crossings by ordering nodes based on connected neighbors
    activeLayers.forEach(layer => {
      const nodesInLayer = layerNodeMap.get(layer) || [];
      const layerPos = layerYPositions.get(layer);
      if (!layerPos || nodesInLayer.length === 0) return;

      const nodeIds = new Set(nodesInLayer.map((n: any) => n.data.id));

      // Build adjacency relationships for intra-layer call links
      const parentMap = new Map<string, string[]>(); // child -> parents (callers)
      const childMap = new Map<string, string[]>();  // parent -> children (callees)
      nodeIds.forEach(id => {
        parentMap.set(id, []);
        childMap.set(id, []);
      });

      data.links.forEach(l => {
        const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        if ((l.type === 'call' || !l.type) && nodeIds.has(sourceId) && nodeIds.has(targetId)) {
          parentMap.get(targetId)?.push(sourceId);
          childMap.get(sourceId)?.push(targetId);
        }
      });

      // Calculate depth for each node within this layer
      const depthMap = calculateIntraLayerDepth(nodesInLayer, data.links);

      // Group nodes by depth
      const nodesByDepth = new Map<number, any[]>();
      nodesInLayer.forEach((node: any) => {
        const depth = depthMap.get(node.data.id) || 0;
        if (!nodesByDepth.has(depth)) {
          nodesByDepth.set(depth, []);
        }
        nodesByDepth.get(depth)!.push(node);
      });

      // Get sorted depth levels
      const depthLevels = Array.from(nodesByDepth.keys()).sort((a, b) => a - b);
      const numRows = depthLevels.length;

      // Calculate vertical spacing within the layer
      const layerH = layerHeights.get(layer) || baseLayerHeight;
      const topPadding = layerEdgePadding + nodeHeight / 2;
      const bottomPadding = layerEdgePadding + nodeHeight / 2;
      const availableHeight = layerH - topPadding - bottomPadding;
      const rowSpacing = numRows > 1 ? availableHeight / (numRows - 1) : 0;
      const startY = numRows > 1 ? layerPos.top + topPadding : layerPos.center;

      const nodeSpacing = 180;

      // Store node order index within each depth level
      const nodeOrderIndex = new Map<string, number>();

      // Initialize first depth level order
      const firstDepthNodes = nodesByDepth.get(depthLevels[0]) || [];
      firstDepthNodes.forEach((node: any, idx: number) => {
        nodeOrderIndex.set(node.data.id, idx);
      });

      // Barycenter method: multiple passes to minimize crossings
      const numPasses = 4; // More passes = better results

      for (let pass = 0; pass < numPasses; pass++) {
        // Forward pass: order based on parents (top-down)
        for (let i = 1; i < depthLevels.length; i++) {
          const nodesAtDepth = nodesByDepth.get(depthLevels[i]) || [];

          nodesAtDepth.forEach((node: any) => {
            const parents = parentMap.get(node.data.id) || [];
            if (parents.length > 0) {
              // Calculate barycenter (average order of parents)
              const barycenter = parents.reduce((sum, pid) => {
                return sum + (nodeOrderIndex.get(pid) ?? 0);
              }, 0) / parents.length;
              node.barycenter = barycenter;
            } else {
              node.barycenter = nodeOrderIndex.get(node.data.id) ?? 0;
            }
          });

          // Sort by barycenter
          nodesAtDepth.sort((a: any, b: any) => a.barycenter - b.barycenter);

          // Update order indices
          nodesAtDepth.forEach((node: any, idx: number) => {
            nodeOrderIndex.set(node.data.id, idx);
          });
        }

        // Backward pass: order based on children (bottom-up)
        for (let i = depthLevels.length - 2; i >= 0; i--) {
          const nodesAtDepth = nodesByDepth.get(depthLevels[i]) || [];

          nodesAtDepth.forEach((node: any) => {
            const children = childMap.get(node.data.id) || [];
            if (children.length > 0) {
              // Calculate barycenter (average order of children)
              const barycenter = children.reduce((sum, cid) => {
                return sum + (nodeOrderIndex.get(cid) ?? 0);
              }, 0) / children.length;
              node.barycenter = barycenter;
            } else {
              node.barycenter = nodeOrderIndex.get(node.data.id) ?? 0;
            }
          });

          // Sort by barycenter
          nodesAtDepth.sort((a: any, b: any) => a.barycenter - b.barycenter);

          // Update order indices
          nodesAtDepth.forEach((node: any, idx: number) => {
            nodeOrderIndex.set(node.data.id, idx);
          });
        }
      }

      // Now assign actual X positions based on final order
      depthLevels.forEach((depth, rowIndex) => {
        const nodesAtDepth = nodesByDepth.get(depth) || [];
        const rowY = numRows > 1 ? startY + rowIndex * rowSpacing : startY;

        // Nodes are already sorted by barycenter from the passes above
        const totalWidth = (nodesAtDepth.length - 1) * nodeSpacing;
        const startX = -totalWidth / 2;

        nodesAtDepth.forEach((node: any, idx: number) => {
          node.x = startX + idx * nodeSpacing;
          node.y = rowY;
        });
      });
    });

    // Load and apply cached layout if available
    layoutCacheKey.current = getLayoutCacheKey(data.nodes);
    const cachedLayout = loadLayoutCache(layoutCacheKey.current);

    if (cachedLayout) {
      // Apply cached layer heights
      let hasLayerHeightChanges = false;
      Object.entries(cachedLayout.layerHeights).forEach(([layer, height]) => {
        if (layerHeights.has(layer as TopologyLayer)) {
          layerHeights.set(layer as TopologyLayer, height);
          hasLayerHeightChanges = true;
        }
      });

      // Recalculate layer positions if heights changed
      if (hasLayerHeightChanges) {
        recalculateLayerPositions();
      }

      // Apply cached node positions
      treeNodes.forEach((d: any) => {
        const cachedPos = cachedLayout.nodePositions[d.data.id];
        if (cachedPos) {
          d.x = cachedPos.x;
          d.y = cachedPos.y;
        }
      });
    }

    // Helper function to save current layout to cache
    const saveCurrentLayout = () => {
      const nodePositions = new Map<string, { x: number; y: number }>();
      treeNodes.forEach((d: any) => {
        nodePositions.set(d.data.id, { x: d.x, y: d.y });
      });
      saveLayoutCache(layoutCacheKey.current, nodePositions, layerHeights);
    };

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

    // 节点阴影滤镜
    const dropShadow = defs.append("filter")
      .attr("id", "node-shadow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    dropShadow.append("feDropShadow")
      .attr("dx", 0)
      .attr("dy", 4)
      .attr("stdDeviation", 8)
      .attr("flood-color", "rgba(0, 0, 0, 0.5)");

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

    // Helper function to constrain node positions within layer boundaries
    const constrainNodePositions = () => {
      const halfNodeWidth = rectWidth / 2;
      const halfNodeHeight = rectHeight / 2;
      const padding = 10;

      treeNodes.forEach((d: any) => {
        const nodeLayer = (d.data.layer || 'application') as TopologyLayer;
        const layerPos = layerYPositions.get(nodeLayer);

        // Constrain X within layer bounds
        const xMinBound = layerStartX + halfNodeWidth + padding;
        const xMaxBound = layerStartX + layerWidth - halfNodeWidth - padding;
        // Ensure min <= max (safety check for narrow layers)
        const effectiveMinX = Math.min(xMinBound, xMaxBound);
        const effectiveMaxX = Math.max(xMinBound, xMaxBound);
        if (d.x < effectiveMinX) d.x = effectiveMinX;
        if (d.x > effectiveMaxX) d.x = effectiveMaxX;

        // Constrain Y within layer bounds
        if (layerPos) {
          const yMinBound = layerPos.top + halfNodeHeight + padding;
          const yMaxBound = layerPos.bottom - halfNodeHeight - padding;
          // Ensure min <= max (safety check for short layers)
          const effectiveMinY = Math.min(yMinBound, yMaxBound);
          const effectiveMaxY = Math.max(yMinBound, yMaxBound);
          if (d.y < effectiveMinY) d.y = effectiveMinY;
          if (d.y > effectiveMaxY) d.y = effectiveMaxY;
        }
      });
    };

    // Apply constraints to all nodes (handles cached positions that may be outside bounds)
    constrainNodePositions();

    activeLayers.forEach(layer => {
      const config = LAYER_CONFIG[layer];
      const yPos = layerYPositions.get(layer);
      const h = layerHeights.get(layer) || baseLayerHeight;
      if (!yPos) return;

      // Background rectangle spanning at least 60% of viewport width
      layerGroup.append("rect")
        .attr("class", `layer-bg layer-bg-${layer}`)
        .attr("x", layerStartX)
        .attr("y", yPos.top)
        .attr("width", layerWidth)
        .attr("height", h)
        .attr("fill", config.color)
        .attr("stroke", config.borderColor)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,2")
        .attr("rx", 4);

      // Layer label on the left
      layerGroup.append("text")
        .attr("class", `layer-label layer-label-${layer}`)
        .attr("x", labelOffset)
        .attr("y", yPos.center)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("fill", config.borderColor.replace('0.3', '0.95'))
        .attr("font-size", "16px")
        .attr("font-weight", "700")
        .attr("letter-spacing", "0.5px")
        .text(config.label);
    });

    // Function to update layer backgrounds when heights change
    const updateLayerBackgrounds = () => {
      activeLayers.forEach(layer => {
        const yPos = layerYPositions.get(layer);
        const h = layerHeights.get(layer) || baseLayerHeight;
        if (!yPos) return;

        // Update background rectangle
        layerGroup.select(`.layer-bg-${layer}`)
          .attr("y", yPos.top)
          .attr("height", h);

        // Update label position
        layerGroup.select(`.layer-label-${layer}`)
          .attr("y", yPos.center);
      });

      // Update middle divider positions
      for (let i = 0; i < activeLayers.length - 1; i++) {
        const upperLayer = activeLayers[i];
        const upperPos = layerYPositions.get(upperLayer);
        if (upperPos) {
          layerGroup.select(`.layer-divider-${i}`)
            .attr("y1", upperPos.bottom)
            .attr("y2", upperPos.bottom);
          layerGroup.select(`.layer-divider-handle-${i}`)
            .attr("y", upperPos.bottom - 6);
        }
      }

      // Update top boundary divider position
      if (activeLayers.length > 0) {
        const topLayer = activeLayers[0];
        const topPos = layerYPositions.get(topLayer);
        if (topPos) {
          layerGroup.select(`.layer-divider-top`)
            .attr("y1", topPos.top)
            .attr("y2", topPos.top);
          layerGroup.select(`.layer-divider-handle-top`)
            .attr("y", topPos.top - dividerHandleHeight / 2);
        }
      }

      // Update bottom boundary divider position
      if (activeLayers.length > 0) {
        const bottomLayer = activeLayers[activeLayers.length - 1];
        const bottomPos = layerYPositions.get(bottomLayer);
        if (bottomPos) {
          layerGroup.select(`.layer-divider-bottom`)
            .attr("y1", bottomPos.bottom)
            .attr("y2", bottomPos.bottom);
          layerGroup.select(`.layer-divider-handle-bottom`)
            .attr("y", bottomPos.bottom - dividerHandleHeight / 2);
        }
      }
    };

    // Draw draggable dividers between layers and at boundaries
    const dividerHandleHeight = 12;

    // Top boundary divider (for the topmost layer)
    if (activeLayers.length > 0) {
      const topLayer = activeLayers[0];
      const topPos = layerYPositions.get(topLayer);
      if (topPos) {
        // Top boundary line
        layerGroup.append("line")
          .attr("class", "layer-divider layer-divider-top")
          .attr("x1", layerStartX)
          .attr("x2", layerStartX + layerWidth)
          .attr("y1", topPos.top)
          .attr("y2", topPos.top)
          .attr("stroke", "rgba(100, 116, 139, 0.5)")
          .attr("stroke-width", 2);

        // Top boundary handle
        layerGroup.append("rect")
          .attr("class", "layer-divider-handle layer-divider-handle-top")
          .attr("x", layerStartX)
          .attr("y", topPos.top - dividerHandleHeight / 2)
          .attr("width", layerWidth)
          .attr("height", dividerHandleHeight)
          .attr("fill", "transparent")
          .attr("cursor", "ns-resize")
          .call(d3.drag<SVGRectElement, unknown>()
            .on("start", function() {
              d3.select(this.previousSibling as Element)
                .attr("stroke", "rgba(34, 211, 238, 0.8)")
                .attr("stroke-width", 3);
            })
            .on("drag", function(event) {
              const topLayer = activeLayers[0];
              const topPos = layerYPositions.get(topLayer);

              if (topPos) {
                // Keep bottom fixed, adjust top
                const fixedBottom = topPos.bottom;
                const newTop = event.y;
                const newHeight = fixedBottom - newTop;

                if (newHeight >= minLayerHeight) {
                  // Update just the top layer's position and height
                  layerHeights.set(topLayer, newHeight);
                  layerYPositions.set(topLayer, {
                    top: newTop,
                    center: newTop + newHeight / 2,
                    bottom: fixedBottom
                  });
                  updateLayerBackgrounds();

                  // Adjust nodes in the top layer only
                  treeNodes.forEach((d: any) => {
                    const nodeLayer = (d.data.layer || 'application') as TopologyLayer;
                    if (nodeLayer === topLayer) {
                      const layerPos = layerYPositions.get(nodeLayer);
                      if (layerPos) {
                        const halfNodeHeight = rectHeight / 2;
                        const padding = 10;
                        const minY = layerPos.top + halfNodeHeight + padding;
                        const maxY = layerPos.bottom - halfNodeHeight - padding;
                        if (d.y < minY) d.y = minY;
                        if (d.y > maxY) d.y = maxY;
                      }
                    }
                  });
                  nodeSelectionRef.current?.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
                  updateLinks();
                }
              }
            })
            .on("end", function() {
              d3.select(this.previousSibling as Element)
                .attr("stroke", "rgba(100, 116, 139, 0.5)")
                .attr("stroke-width", 2);
              saveCurrentLayout(); // Save layout after drag
            })
          );
      }
    }

    // Bottom boundary divider (for the bottommost layer)
    if (activeLayers.length > 0) {
      const bottomLayer = activeLayers[activeLayers.length - 1];
      const bottomPos = layerYPositions.get(bottomLayer);
      if (bottomPos) {
        // Bottom boundary line
        layerGroup.append("line")
          .attr("class", "layer-divider layer-divider-bottom")
          .attr("x1", layerStartX)
          .attr("x2", layerStartX + layerWidth)
          .attr("y1", bottomPos.bottom)
          .attr("y2", bottomPos.bottom)
          .attr("stroke", "rgba(100, 116, 139, 0.5)")
          .attr("stroke-width", 2);

        // Bottom boundary handle
        layerGroup.append("rect")
          .attr("class", "layer-divider-handle layer-divider-handle-bottom")
          .attr("x", layerStartX)
          .attr("y", bottomPos.bottom - dividerHandleHeight / 2)
          .attr("width", layerWidth)
          .attr("height", dividerHandleHeight)
          .attr("fill", "transparent")
          .attr("cursor", "ns-resize")
          .call(d3.drag<SVGRectElement, unknown>()
            .on("start", function() {
              d3.select(this.previousSibling as Element)
                .attr("stroke", "rgba(34, 211, 238, 0.8)")
                .attr("stroke-width", 3);
            })
            .on("drag", function(event) {
              const bottomLayer = activeLayers[activeLayers.length - 1];
              const bottomPos = layerYPositions.get(bottomLayer);

              if (bottomPos) {
                // Keep top fixed, adjust bottom
                const fixedTop = bottomPos.top;
                const newBottom = event.y;
                const newHeight = newBottom - fixedTop;

                if (newHeight >= minLayerHeight) {
                  // Update just the bottom layer's position and height
                  layerHeights.set(bottomLayer, newHeight);
                  layerYPositions.set(bottomLayer, {
                    top: fixedTop,
                    center: fixedTop + newHeight / 2,
                    bottom: newBottom
                  });
                  updateLayerBackgrounds();

                  // Adjust nodes in the bottom layer only
                  treeNodes.forEach((d: any) => {
                    const nodeLayer = (d.data.layer || 'application') as TopologyLayer;
                    if (nodeLayer === bottomLayer) {
                      const layerPos = layerYPositions.get(nodeLayer);
                      if (layerPos) {
                        const halfNodeHeight = rectHeight / 2;
                        const padding = 10;
                        const minY = layerPos.top + halfNodeHeight + padding;
                        const maxY = layerPos.bottom - halfNodeHeight - padding;
                        if (d.y < minY) d.y = minY;
                        if (d.y > maxY) d.y = maxY;
                      }
                    }
                  });
                  nodeSelectionRef.current?.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
                  updateLinks();
                }
              }
            })
            .on("end", function() {
              d3.select(this.previousSibling as Element)
                .attr("stroke", "rgba(100, 116, 139, 0.5)")
                .attr("stroke-width", 2);
              saveCurrentLayout(); // Save layout after drag
            })
          );
      }
    }

    // Middle dividers between layers
    for (let i = 0; i < activeLayers.length - 1; i++) {
      const upperLayer = activeLayers[i];
      const upperPos = layerYPositions.get(upperLayer);
      if (!upperPos) continue;

      // Divider line
      layerGroup.append("line")
        .attr("class", `layer-divider layer-divider-${i}`)
        .attr("x1", layerStartX)
        .attr("x2", layerStartX + layerWidth)
        .attr("y1", upperPos.bottom)
        .attr("y2", upperPos.bottom)
        .attr("stroke", "rgba(100, 116, 139, 0.5)")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "none");

      // Draggable handle (invisible but larger hit area)
      const dividerIndex = i;
      layerGroup.append("rect")
        .attr("class", `layer-divider-handle layer-divider-handle-${i}`)
        .attr("x", layerStartX)
        .attr("y", upperPos.bottom - dividerHandleHeight / 2)
        .attr("width", layerWidth)
        .attr("height", dividerHandleHeight)
        .attr("fill", "transparent")
        .attr("cursor", "ns-resize")
        .call(d3.drag<SVGRectElement, unknown>()
          .on("start", function() {
            d3.select(this.previousSibling as Element)
              .attr("stroke", "rgba(34, 211, 238, 0.8)")
              .attr("stroke-width", 3);
          })
          .on("drag", function(event) {
            const upperLayer = activeLayers[dividerIndex];
            const upperPos = layerYPositions.get(upperLayer);

            if (upperPos) {
              // Calculate new height based on drag position
              const newBottom = event.y;
              const newHeight = newBottom - upperPos.top;

              // Enforce minimum height
              if (newHeight >= minLayerHeight) {
                layerHeights.set(upperLayer, newHeight);
                recalculateLayerPositions();
                updateLayerBackgrounds();

                // Adjust nodes to stay within their layer bounds
                treeNodes.forEach((d: any) => {
                  const nodeLayer = (d.data.layer || 'application') as TopologyLayer;
                  const layerPos = layerYPositions.get(nodeLayer);
                  if (layerPos) {
                    const halfNodeHeight = rectHeight / 2;
                    const padding = 10;
                    const minY = layerPos.top + halfNodeHeight + padding;
                    const maxY = layerPos.bottom - halfNodeHeight - padding;

                    // Clamp node Y position within layer bounds
                    if (d.y < minY) d.y = minY;
                    if (d.y > maxY) d.y = maxY;
                  }
                });

                // Update node positions in DOM
                nodeSelectionRef.current?.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
                updateLinks();
              }
            }
          })
          .on("end", function() {
            d3.select(this.previousSibling as Element)
              .attr("stroke", "rgba(100, 116, 139, 0.5)")
              .attr("stroke-width", 2);
            saveCurrentLayout(); // Save layout after drag
          })
        );
    }

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
      .attr("cursor", "pointer")
      .attr("d", (d: any) => {
        // 从源节点底部端口到目标节点顶部端口
        const sx = d.source.x;
        const sy = d.source.y + rectHeight / 2; // 底部端口
        const tx = d.target.x;
        const ty = d.target.y - rectHeight / 2; // 顶部端口
        const my = (sy + ty) / 2;
        return `M${sx},${sy} C${sx},${my} ${tx},${my} ${tx},${ty}`;
      })
      .on("dblclick", (e: any, d: any) => {
        e.stopPropagation();
        const sourceId = d.source.data.id;
        const targetId = d.target.data.id;
        // Find the original link data to get the relationship ID
        const originalLink = data.links.find(l => {
          const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
          const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
          return s === sourceId && t === targetId;
        });
        handleLinkDoubleClickRef.current({
          source: sourceId,
          target: targetId,
          type: originalLink?.type || 'call',
          relationshipId: originalLink?.relationshipId,
        });
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
        confidence: l.confidence,
        relationshipId: l.relationshipId,
      }))
      .filter(l => {
        // 非 call 类型总是显示
        if (l.type !== 'call') return true;
        // call 类型：只有不在树中的才额外显示
        return !renderedCallLinks.has(`${l.source}->${l.target}`);
      });

    // Create a map to lookup relationship IDs by source-target pair
    const linkRelationshipMap = new Map<string, number>();
    data.links.forEach(l => {
      const source = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const target = typeof l.target === 'object' ? (l.target as any).id : l.target;
      if (l.relationshipId) {
        linkRelationshipMap.set(`${source}->${target}`, l.relationshipId);
      }
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
      .attr("cursor", "pointer")
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
      })
      .on("dblclick", (e: any, d: any) => {
        e.stopPropagation();
        handleLinkDoubleClickRef.current({
          source: d.source,
          target: d.target,
          type: d.type || 'call',
          relationshipId: d.relationshipId,
        });
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

    // 拖拽行为 - 限制在所属 Layer 内（X和Y轴都限制）
    const drag = d3.drag<SVGGElement, any>()
      .filter(event => {
        // 排除端口点击，避免拖拽干扰链接操作
        return !event.target.classList.contains('port');
      })
      .on("start", function(event, d) {
        d3.select(this).raise().classed("dragging", true);
      })
      .on("drag", function(event, d) {
        // 获取节点所属的 Layer
        const nodeLayer = (d.data.layer || 'application') as TopologyLayer;
        const layerPos = layerYPositions.get(nodeLayer);

        const halfNodeWidth = rectWidth / 2;
        const halfNodeHeight = rectHeight / 2;
        const padding = 10;

        // X 坐标限制在 Layer 范围内
        const minX = layerStartX + halfNodeWidth + padding;
        const maxX = layerStartX + layerWidth - halfNodeWidth - padding;
        d.x = Math.max(minX, Math.min(maxX, event.x));

        // Y 坐标限制在 Layer 范围内
        if (layerPos) {
          const minY = layerPos.top + halfNodeHeight + padding;
          const maxY = layerPos.bottom - halfNodeHeight - padding;
          d.y = Math.max(minY, Math.min(maxY, event.y));
        } else {
          d.y = event.y;
        }

        d3.select(this).attr("transform", `translate(${d.x},${d.y})`);
        updateLinks();
      })
      .on("end", function(event, d) {
        d3.select(this).classed("dragging", false);
        saveCurrentLayout(); // Save layout after drag
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

    // 添加阴影底层矩形（立体感）
    nodeGroup.append("rect")
      .attr("width", rectWidth)
      .attr("height", rectHeight)
      .attr("x", -rectWidth / 2 + 2)
      .attr("y", -rectHeight / 2 + 3)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("fill", "rgba(0, 0, 0, 0.4)")
      .attr("class", "node-shadow");

    nodeGroup.append("rect")
      .attr("width", rectWidth)
      .attr("height", rectHeight)
      .attr("x", -rectWidth / 2)
      .attr("y", -rectHeight / 2)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("fill", (d: any) => {
        if (d.data.isShadow) return "rgba(88, 28, 135, 0.2)";
        if (d.data.isOrphan) return "rgba(30, 41, 59, 0.8)";
        return "#0f172a";
      })
      .attr("stroke", (d: any) => {
        if (d.data.isOrphan) return "#64748b";
        return getTypeColor(d.data.type, d.data.isShadow);
      })
      .attr("stroke-width", (d: any) => d.data.isShadow ? 1.5 : 2)
      .attr("stroke-dasharray", (d: any) => {
        if (d.data.isShadow) return "5,5";
        if (d.data.isOrphan) return "4,2";
        return "none";
      })
      .attr("filter", (d: any) => d.data.isShadow ? "none" : "url(#node-shadow)")
      .attr("class", "node-rect transition-all duration-300");

    // 添加顶部高光（立体感）
    nodeGroup.append("rect")
      .attr("width", rectWidth - 8)
      .attr("height", 1)
      .attr("x", -rectWidth / 2 + 4)
      .attr("y", -rectHeight / 2 + 2)
      .attr("rx", 1)
      .attr("fill", (d: any) => {
        if (d.data.isShadow || d.data.isOrphan) return "transparent";
        return "rgba(255, 255, 255, 0.1)";
      });

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
    const node = data?.nodes.find(n => n.id === nodeId);
    return node?.label || nodeId;
  };

  // 处理背景点击（取消链接模式）
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // 只有点击 SVG 背景时才取消链接
    if (linkingState && (e.target as HTMLElement).tagName === 'svg') {
      cancelLinking();
    }
  }, [linkingState, cancelLinking]);

  // Loading state - rendered conditionally
  if (isLoading) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-slate-400 text-sm">Loading topology...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 bg-red-950/20 border border-red-900/30 rounded-xl p-8 max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <span className="text-red-400 text-sm text-center">{apiError}</span>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm transition-all"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-sm font-medium">No topology data</p>
          <p className="text-xs text-slate-600">Add members to this subgraph to see the topology</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-900 overflow-hidden relative" onClick={handleBackgroundClick}>
      {/* 图例 */}
      {showLegend && (
        <div className="absolute top-2 right-2 z-10 pointer-events-none p-3 bg-slate-950/40 backdrop-blur rounded-lg border border-slate-800">
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

      {/* Linking mode indicator */}
      {linkingState && (
        <div className="absolute top-2 left-2 z-20 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg backdrop-blur">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span>Linking mode: Starting from "{getNodeName(linkingState.sourceNodeId)}"</span>
            <button
              onClick={(e) => { e.stopPropagation(); cancelLinking(); }}
              className="ml-2 text-cyan-300 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Link created success message */}
      {linkCreatedMessage && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg backdrop-blur animate-pulse">
          <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{linkCreatedMessage}</span>
          </div>
        </div>
      )}

      <svg ref={svgRef} className="w-full h-full" />

      {/* Link type selection modal */}
      {showLinkTypeModal && pendingLink && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={cancelLinking}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-2">Select Link Type</h3>
            <p className="text-slate-400 text-sm mb-4">
              From <span className="text-cyan-400">{getNodeName(pendingLink.source)}</span> to <span className="text-cyan-400">{getNodeName(pendingLink.target)}</span>
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
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Link edit modal (double-click on link) */}
      {showLinkEditModal && selectedLink && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowLinkEditModal(false); setSelectedLink(null); }}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-2">Edit Link</h3>
            <p className="text-slate-400 text-sm mb-4">
              From <span className="text-cyan-400">{getNodeName(selectedLink.source)}</span> to <span className="text-cyan-400">{getNodeName(selectedLink.target)}</span>
            </p>
            <p className="text-slate-500 text-xs mb-4">
              Current type: <span className="text-white font-medium">{LINK_TYPES.find(l => l.value === selectedLink.type)?.label || selectedLink.type}</span>
            </p>
            <div className="space-y-2 mb-4">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Change to:</p>
              {LINK_TYPES.map(linkType => (
                <button
                  key={linkType.value}
                  onClick={() => handleUpdateLinkType(linkType.value)}
                  disabled={linkType.value === selectedLink.type}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    linkType.value === selectedLink.type
                      ? 'bg-slate-800/50 border-slate-700/50 opacity-50 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="w-8 h-1 rounded" style={{ backgroundColor: linkType.color }}></div>
                  <div>
                    <div className="text-white font-medium text-sm">{linkType.label}</div>
                    <div className="text-slate-500 text-xs">{linkType.description}</div>
                  </div>
                  {linkType.value === selectedLink.type && (
                    <span className="ml-auto text-cyan-400 text-xs">Current</span>
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-slate-700 pt-4 flex flex-col gap-2">
              <button
                onClick={handleDeleteLink}
                className="w-full py-2 px-4 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded-lg text-red-400 hover:text-red-300 text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Link
              </button>
              <button
                onClick={() => { setShowLinkEditModal(false); setSelectedLink(null); }}
                className="w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopologyGraph;
