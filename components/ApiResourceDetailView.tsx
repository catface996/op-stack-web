import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Server,
  Settings,
  Trash2,
  Activity,
  Clock,
  User,
  FileText,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Box,
  Network,
  Bot,
  History,
  Info,
  Plus,
  X,
  Check,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';
import { resourceApi, getResourceTypeIcon, getStatusConfig, STATUS_CONFIG } from '../services/api/resources';
import { nodeApi } from '../services/api/nodes';
import { useResourceAuditLogs } from '../services/hooks/useResourceAuditLogs';
import { useResourceTypes } from '../services/hooks/useResourceTypes';
import { useNodeTopologies } from '../services/hooks/useNodeTopologies';
import { ApiError } from '../services/api/client';
import type { ResourceDTO, ResourceStatus, NodeDTO } from '../services/api/types';
import StyledSelect from './ui/StyledSelect';
import TopologyGraph from './TopologyGraph';

interface ApiResourceDetailViewProps {
  resourceId: number;
  onBack: () => void;
  onNavigateToTopology?: (topologyId: number) => void;
}

type TabType = 'info' | 'topologies' | 'agents' | 'history';

/**
 * Convert NodeDTO to ResourceDTO for backward compatibility
 */
function nodeToResource(node: NodeDTO): ResourceDTO {
  return {
    id: node.id,
    name: node.name,
    description: node.description,
    resourceTypeId: node.nodeTypeId,
    resourceTypeName: node.nodeTypeName,
    resourceTypeCode: node.nodeTypeCode,
    status: node.status,
    statusDisplay: node.statusDisplay,
    attributes: node.attributes,
    version: node.version,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    createdBy: node.createdBy,
  };
}

const ApiResourceDetailView: React.FC<ApiResourceDetailViewProps> = ({ resourceId, onBack, onNavigateToTopology }) => {
  const [resource, setResource] = useState<ResourceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Topologies view mode: 'card' or 'list'
  const [topologiesViewMode, setTopologiesViewMode] = useState<'card' | 'list'>('card');

  const { logs, pagination, loading: logsLoading, setPage, refresh: refreshLogs } = useResourceAuditLogs(resourceId);
  const { types: resourceTypes, loading: typesLoading } = useResourceTypes();
  const {
    topologies: nodeTopologies,
    pagination: topologiesPagination,
    loading: topologiesLoading,
    error: topologiesError,
    refresh: refreshTopologies,
    setPage: setTopologiesPage,
  } = useNodeTopologies(resourceId);

  const fetchResource = async () => {
    setLoading(true);
    setError(null);
    try {
      const nodeData = await nodeApi.get(resourceId);
      setResource(nodeToResource(nodeData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resource');
    } finally {
      setLoading(false);
    }
  };

  const refreshResource = async () => {
    try {
      const nodeData = await nodeApi.get(resourceId);
      setResource(nodeToResource(nodeData));
      refreshLogs();
    } catch (err) {
      // Silent refresh failure
    }
  };

  useEffect(() => {
    fetchResource();
  }, [resourceId]);

  // Handle navigation to a subgraph's topology view
  // NOTE: This hook MUST be before any early returns to follow React's rules of hooks
  const handleNavigateToSubgraph = useCallback((subgraphId: number) => {
    // Navigate to subgraph resource detail - for now just log, can be enhanced
    console.log('Navigate to subgraph:', subgraphId);
    // Could trigger navigation to that resource's detail page
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-slate-400 text-sm">Loading resource...</span>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4 bg-red-950/20 border border-red-900/30 rounded-xl p-8">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <span className="text-red-400 text-sm">{error || 'Resource not found'}</span>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm transition-all"
          >
            <ArrowLeft size={16} /> Back to Resources
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(resource.status);
  const TypeIcon = getResourceTypeIcon(resource.resourceTypeCode, resource.name);
  const attributes = resource.attributes ? JSON.parse(resource.attributes) : null;

  // Get type style for gradient (matching card style)
  const getTypeGradient = () => {
    const code = resource.resourceTypeCode?.toUpperCase() || '';
    const name = resource.name?.toLowerCase() || '';

    if (['DATABASE', 'DB', 'MYSQL', 'POSTGRES', 'MONGODB'].includes(code) || name.includes('mysql') || name.includes('postgres') || name.includes('mongodb') || name.includes('elasticsearch')) {
      return { color: 'text-purple-400', gradient: 'from-purple-500/40 via-purple-600/20 to-transparent', accent: 'bg-purple-600' };
    }
    if (['CACHE', 'MEMCACHE', 'REDIS'].includes(code) || name.includes('redis') || name.includes('cache')) {
      return { color: 'text-orange-400', gradient: 'from-orange-500/40 via-orange-600/20 to-transparent', accent: 'bg-orange-600' };
    }
    if (['MQ', 'QUEUE', 'KAFKA', 'RABBITMQ', 'ROCKETMQ'].includes(code) || name.includes('kafka') || name.includes('rabbitmq') || name.includes('mq')) {
      return { color: 'text-yellow-400', gradient: 'from-yellow-500/40 via-yellow-600/20 to-transparent', accent: 'bg-yellow-600' };
    }
    if (['REGISTRY', 'CONFIG'].includes(code) || name.includes('nacos') || name.includes('consul') || name.includes('registry')) {
      return { color: 'text-green-400', gradient: 'from-green-500/40 via-green-600/20 to-transparent', accent: 'bg-green-600' };
    }
    if (['GATEWAY', 'API_GATEWAY'].includes(code) || name.includes('gateway') || name.includes('nginx')) {
      return { color: 'text-pink-400', gradient: 'from-pink-500/40 via-pink-600/20 to-transparent', accent: 'bg-pink-600' };
    }
    if (['CONTAINER', 'DOCKER', 'K8S', 'KUBERNETES'].includes(code) || name.includes('k8s') || name.includes('kubernetes') || name.includes('docker')) {
      return { color: 'text-cyan-400', gradient: 'from-cyan-500/40 via-cyan-600/20 to-transparent', accent: 'bg-cyan-600' };
    }
    return { color: 'text-cyan-400', gradient: 'from-cyan-500/40 via-cyan-600/20 to-transparent', accent: 'bg-cyan-600' };
  };

  const typeStyle = getTypeGradient();

  const tabs = [
    { id: 'info' as TabType, label: 'Info', icon: Info },
    { id: 'topologies' as TabType, label: 'Topologies', icon: Network },
    { id: 'agents' as TabType, label: 'Agents', icon: Bot },
    { id: 'history' as TabType, label: 'History', icon: History },
  ];

  const renderInfoTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Description */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <FileText size={14} /> Description
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            {resource.description || 'No description provided'}
          </p>
        </div>

        {/* Attributes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Box size={14} /> Attributes
          </h3>
          {attributes && Object.keys(attributes).length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(attributes).map(([key, value]) => (
                <div key={key} className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{key}</div>
                  <div className="text-sm text-white font-mono">{String(value)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-sm">
              No attributes defined
            </div>
          )}
        </div>

        {/* Audit Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Activity size={14} /> Audit Logs
          </h3>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : logs.length > 0 ? (
            <>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className={`p-1.5 rounded ${
                      log.operation === 'CREATE' ? 'bg-green-950 text-green-400' :
                      log.operation === 'UPDATE' ? 'bg-blue-950 text-blue-400' :
                      log.operation === 'DELETE' ? 'bg-red-950 text-red-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      <Activity size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{log.operationDisplay || log.operation}</span>
                        <span className="text-xs text-slate-500">{log.operatorName || 'System'}</span>
                      </div>
                      {(log.oldValue || log.newValue) && (
                        <p className="text-xs text-slate-400 mt-1 truncate">{log.newValue || log.oldValue}</p>
                      )}
                      <div className="text-xs text-slate-600 mt-1">
                        {new Date(log.operatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-400"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs text-slate-500">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-400"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              No audit logs available
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Metadata */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Details</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <Server size={14} className="text-slate-400" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Resource ID</div>
                <div className="text-sm text-white font-mono">{resource.id}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <Box size={14} className="text-slate-400" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Resource Type</div>
                <div className="text-sm text-white">{resource.resourceTypeName}</div>
                <div className="text-xs text-slate-500 font-mono">{resource.resourceTypeCode}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <User size={14} className="text-slate-400" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Created By</div>
                <div className="text-sm text-white">{resource.createdBy || 'System'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <Clock size={14} className="text-slate-400" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Created At</div>
                <div className="text-sm text-white">{new Date(resource.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <RefreshCw size={14} className="text-slate-400" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Updated At</div>
                <div className="text-sm text-white">{new Date(resource.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition-all"
            >
              <Settings size={16} className="text-cyan-400" />
              Edit Resource
            </button>
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition-all"
            >
              <Activity size={16} className="text-green-400" />
              Change Status
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full flex items-center gap-3 p-3 bg-red-950/30 hover:bg-red-950/50 rounded-lg text-sm text-red-400 hover:text-red-300 transition-all border border-red-900/30"
            >
              <Trash2 size={16} />
              Delete Resource
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Check if resource is a subgraph (has isSubgraph attribute or resourceTypeCode contains 'subgraph')
  // TODO: Adjust this logic based on actual backend data structure
  const isSubgraph = resource.attributes
    ? JSON.parse(resource.attributes)?.isSubgraph === true
    : false;

  // For testing: Always show topology graph to verify API calls
  // Remove this line after testing
  const showTopologyGraph = true; // isSubgraph;

  const renderTopologiesTab = () => {
    // Card view component - matches TopologiesManagement card style
    const renderCardView = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {nodeTopologies.map((topology) => {
          const statusColor = topology.status === 'RUNNING' ? 'bg-green-500' :
            topology.status === 'STOPPED' ? 'bg-slate-500' :
            topology.status === 'MAINTENANCE' ? 'bg-yellow-500' : 'bg-red-500';

          return (
            <div
              key={topology.id}
              onClick={() => onNavigateToTopology?.(topology.id)}
              className="relative bg-slate-900 border border-slate-800/80 rounded-xl transition-all cursor-pointer flex flex-col min-h-[200px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-cyan-950/10 hover:border-cyan-500/40 hover:bg-slate-800/40"
            >
              {/* Top accent bar */}
              <div className={`h-1 w-full ${statusColor} opacity-50`}></div>

              <div className="p-5 flex flex-col flex-1">
                {/* Header: Icon and badges */}
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-lg bg-slate-950 text-cyan-500 border border-slate-800">
                    <Network size={20} />
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">
                    <Box size={10} /> {topology.memberCount ?? 0} MEMBERS
                  </div>
                </div>

                {/* Name and description */}
                <div className="mb-4">
                  <h3 className="text-base font-bold mb-0.5 truncate text-white leading-tight">{topology.name}</h3>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] opacity-80">
                    ID: {topology.id}
                  </div>
                  {topology.description && (
                    <div className="text-[10px] text-slate-500 mt-2 line-clamp-2">{topology.description}</div>
                  )}
                </div>

                {/* Flex spacer */}
                <div className="flex-1"></div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-slate-800/40 flex items-center justify-between">
                  <div className="text-[9px] text-slate-600">
                    {topology.createdAt ? new Date(topology.createdAt).toLocaleDateString() : ''}
                  </div>
                  <ChevronRight size={16} className="text-slate-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );

    // List view component (table style)
    const renderListView = () => (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID</th>
              <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</th>
              <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
              <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Members</th>
              <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Created</th>
              <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Updated</th>
            </tr>
          </thead>
          <tbody>
            {nodeTopologies.map((topology) => (
              <tr
                key={topology.id}
                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
              >
                <td className="py-3 px-4 text-xs font-mono text-slate-400">{topology.id}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Network size={14} className="text-cyan-500" />
                    <span className="text-sm font-bold text-white">{topology.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500 max-w-[200px] truncate">
                  {topology.description || '-'}
                </td>
                <td className="py-3 px-4 text-xs text-slate-400 font-mono">{topology.memberCount ?? 0}</td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    topology.status === 'RUNNING' ? 'text-green-400' :
                    topology.status === 'STOPPED' ? 'text-slate-500' :
                    topology.status === 'MAINTENANCE' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {topology.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">
                  {topology.createdAt ? new Date(topology.createdAt).toLocaleDateString() : '-'}
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">
                  {topology.updatedAt ? new Date(topology.updatedAt).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-white">Associated Topologies</h3>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setTopologiesViewMode('card')}
                className={`p-1.5 rounded transition-all ${
                  topologiesViewMode === 'card'
                    ? 'bg-slate-700 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Card view"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setTopologiesViewMode('list')}
                className={`p-1.5 rounded transition-all ${
                  topologiesViewMode === 'list'
                    ? 'bg-slate-700 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="List view"
              >
                <LayoutList size={14} />
              </button>
            </div>
            {/* Refresh button */}
            <button
              onClick={refreshTopologies}
              disabled={topologiesLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-all"
            >
              <RefreshCw size={14} className={topologiesLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading state */}
        {topologiesLoading && nodeTopologies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 size={32} className="animate-spin text-cyan-500 mb-4" />
            <p className="text-sm font-medium">Loading topologies...</p>
          </div>
        )}

        {/* Error state */}
        {topologiesError && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <AlertTriangle size={32} className="text-red-500 opacity-50 mb-4" />
            <p className="text-sm font-medium text-red-400">{topologiesError}</p>
            <button
              onClick={refreshTopologies}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!topologiesLoading && !topologiesError && nodeTopologies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Network size={48} className="opacity-20 mb-4" />
            <p className="text-sm font-medium">No topologies found</p>
            <p className="text-xs text-slate-600 mt-1">This resource is not a member of any topology</p>
          </div>
        )}

        {/* Topologies content */}
        {!topologiesError && nodeTopologies.length > 0 && (
          <>
            {topologiesViewMode === 'card' ? renderCardView() : renderListView()}

            {/* Pagination */}
            {topologiesPagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-6 mt-6 border-t border-slate-800">
                <button
                  onClick={() => setTopologiesPage(topologiesPagination.page - 1)}
                  disabled={topologiesPagination.page === 1 || topologiesLoading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-30 hover:bg-slate-700 text-slate-300 transition-all text-xs font-bold"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-xs text-slate-400">
                  Page <span className="text-white font-mono font-bold">{topologiesPagination.page}</span> of{' '}
                  <span className="font-mono font-bold">{topologiesPagination.totalPages}</span>
                  <span className="text-slate-600 ml-2">({topologiesPagination.totalElements} total)</span>
                </span>
                <button
                  onClick={() => setTopologiesPage(topologiesPagination.page + 1)}
                  disabled={topologiesPagination.page >= topologiesPagination.totalPages || topologiesLoading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-30 hover:bg-slate-700 text-slate-300 transition-all text-xs font-bold"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Show topology graph if this is a subgraph */}
        {isSubgraph && nodeTopologies.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Topology Graph Preview</h4>
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden" style={{ height: '400px' }}>
              <TopologyGraph
                resourceId={resource.id}
                onNodeClick={(nodeId) => console.log('Node clicked:', nodeId)}
                onNodeDoubleClick={(nodeId) => console.log('Node double-clicked:', nodeId)}
                onNavigateToSubgraph={handleNavigateToSubgraph}
                showLegend={true}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAgentsTab = () => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-white">Associated Agents</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-bold text-white transition-all">
          <Plus size={14} /> Assign Agent
        </button>
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Bot size={48} className="opacity-20 mb-4" />
        <p className="text-sm font-medium">No agents assigned</p>
        <p className="text-xs text-slate-600 mt-1">Assign agent teams to monitor and diagnose this resource</p>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-white">Analysis History</h3>
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <History size={48} className="opacity-20 mb-4" />
        <p className="text-sm font-medium">No analysis history</p>
        <p className="text-xs text-slate-600 mt-1">Previous diagnosis sessions will appear here</p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return renderInfoTab();
      case 'topologies':
        return renderTopologiesTab();
      case 'agents':
        return renderAgentsTab();
      case 'history':
        return renderHistoryTab();
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-slate-900/50 border-b border-slate-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            {/* Tech-style Icon Container - matching card style */}
            <div className="relative">
              <div className={`absolute inset-0 rounded-xl ${typeStyle.accent} opacity-20 blur-xl`}></div>
              <div className={`relative p-0.5 rounded-xl bg-gradient-to-br ${typeStyle.gradient} shadow-lg`}>
                <div className={`p-3.5 rounded-[10px] bg-slate-950/90 backdrop-blur-sm ${typeStyle.color}`}>
                  <TypeIcon size={28} className="drop-shadow-sm" />
                </div>
              </div>
            </div>
            <div>
              <div className="inline-flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{resource.name}</span>
                <span className={`text-sm font-bold ${statusConfig.color}`}>{statusConfig.label}</span>
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                {resource.resourceTypeName}
                <span className="ml-2 text-slate-600 font-mono">({resource.resourceTypeCode})</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors">
              <Settings size={20} />
            </button>
            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 bg-slate-900/30 border-b border-slate-800 px-6">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-cyan-400 border-cyan-400'
                    : 'text-slate-400 border-transparent hover:text-white hover:border-slate-600'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {renderTabContent()}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditResourceModal
          resource={resource}
          onClose={() => setIsEditModalOpen(false)}
          onSave={() => {
            setIsEditModalOpen(false);
            refreshResource();
          }}
        />
      )}

      {/* Status Modal */}
      {isStatusModalOpen && (
        <ChangeStatusModal
          resource={resource}
          onClose={() => setIsStatusModalOpen(false)}
          onSave={() => {
            setIsStatusModalOpen(false);
            refreshResource();
          }}
        />
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <DeleteResourceModal
          resource={resource}
          onClose={() => setIsDeleteModalOpen(false)}
          onDeleted={() => {
            setIsDeleteModalOpen(false);
            onBack();
          }}
        />
      )}
    </div>
  );
};

// Edit Resource Modal
interface EditResourceModalProps {
  resource: ResourceDTO;
  onClose: () => void;
  onSave: () => void;
}

const EditResourceModal: React.FC<EditResourceModalProps> = ({ resource, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: resource.name,
    description: resource.description || '',
    attributes: resource.attributes || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await nodeApi.update({
        operatorId: 1,
        id: resource.id,
        name: formData.name,
        description: formData.description || undefined,
        attributes: formData.attributes || undefined,
        version: resource.version,
      });
      onSave();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Update failed, please try again');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">Edit Resource</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500 outline-none resize-none h-20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Attributes (JSON)</label>
            <textarea
              value={formData.attributes}
              onChange={e => setFormData({ ...formData, attributes: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono focus:border-cyan-500 outline-none resize-none h-24"
              placeholder='{"key": "value"}'
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-bold text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Change Status Modal
interface ChangeStatusModalProps {
  resource: ResourceDTO;
  onClose: () => void;
  onSave: () => void;
}

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({ resource, onClose, onSave }) => {
  const [selectedStatus, setSelectedStatus] = useState<ResourceStatus>(resource.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = Object.entries(STATUS_CONFIG).map(([key, config]) => ({
    value: key,
    label: config.label,
  }));

  const handleSubmit = async () => {
    if (selectedStatus === resource.status) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await resourceApi.updateStatus({
        id: resource.id,
        status: selectedStatus,
        version: resource.version,
      });
      onSave();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Update failed, please try again');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">Change Status</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
            <StyledSelect
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val as ResourceStatus)}
              options={statusOptions}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-bold text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Resource Modal
interface DeleteResourceModalProps {
  resource: ResourceDTO;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteResourceModal: React.FC<DeleteResourceModalProps> = ({ resource, onClose, onDeleted }) => {
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmName === resource.name;

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      await nodeApi.delete({ operatorId: 1, id: resource.id });
      onDeleted();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Delete failed, please try again');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-bold text-red-400 text-sm">Delete Resource</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm">{error}</div>
          )}
          <p className="text-sm text-slate-400">
            This action cannot be undone. Please type <span className="font-bold text-white">{resource.name}</span> to confirm.
          </p>
          <input
            type="text"
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            placeholder="Enter resource name"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-red-500 outline-none"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold text-white disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiResourceDetailView;
