
import React, { useState, useCallback, useEffect, useRef } from 'react';
import StyledSelect from './ui/StyledSelect';
import { useResources, type ResourceFilters } from '../services/hooks/useResources';
import { useResourceTypes } from '../services/hooks/useResourceTypes';
import { resourceApi, getResourceTypeIcon, getStatusConfig, type ResourceIcon } from '../services/api/resources';
import { nodeApi } from '../services/api/nodes';
import { ApiError } from '../services/api/client';
import type { ResourceDTO, ResourceStatus, ResourceTypeDTO, CreateResourceRequest, UpdateResourceRequest, CreateNodeRequest } from '../services/api/types';
import {
  Search,
  Plus,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Save,
  Server,
  Activity,
  Settings,
  AlertTriangle,
  LayoutList,
  LayoutGrid,
  Globe,
  ArrowUpRight,
  Box,
  Zap,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface ResourceManagementProps {
  onViewDetail?: (resource: ResourceDTO) => void;
}

const ITEMS_PER_PAGE = 8;

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const ResourceManagement: React.FC<ResourceManagementProps> = ({ onViewDetail }) => {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<ResourceStatus | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceDTO | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<ResourceDTO | null>(null);

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // API hooks
  const filters: ResourceFilters = {
    resourceTypeId: selectedTypeId,
    status: selectedStatus,
    keyword: debouncedSearchTerm || undefined,
  };

  const {
    resources,
    pagination,
    loading,
    error,
    refresh,
    setPage
  } = useResources(filters);

  const { types: resourceTypes, loading: typesLoading } = useResourceTypes();

  // Handle view detail
  const handleViewDetail = useCallback((resource: ResourceDTO) => {
    if (onViewDetail) {
      onViewDetail(resource);
    }
  }, [onViewDetail]);

  // Get type style based on resource type code and name
  const getTypeStyle = (typeCode: string, resourceName?: string) => {
    const icon = getResourceTypeIcon(typeCode, resourceName);
    const code = typeCode?.toUpperCase() || '';
    const name = resourceName?.toLowerCase() || '';

    // Database types (MySQL, PostgreSQL, MongoDB, Elasticsearch)
    if (['DATABASE', 'DB', 'MYSQL', 'POSTGRES', 'MONGODB'].includes(code) || typeCode === '数据库' ||
        name.includes('mysql') || name.includes('postgres') || name.includes('mongodb') || name.includes('elasticsearch') || name.includes('elastic')) {
      return { color: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-500/20', accent: 'bg-purple-600', gradient: 'from-purple-500/40 via-purple-600/20 to-transparent', icon };
    }
    // Cache types (Redis, Memcache)
    if (['CACHE', 'MEMCACHE', 'REDIS'].includes(code) || typeCode === '缓存' ||
        name.includes('redis') || name.includes('cache') || name.includes('memcache')) {
      return { color: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-500/20', accent: 'bg-orange-600', gradient: 'from-orange-500/40 via-orange-600/20 to-transparent', icon };
    }
    // Message Queue types (Kafka, RabbitMQ, RocketMQ)
    if (['MQ', 'QUEUE', 'KAFKA', 'RABBITMQ', 'ROCKETMQ'].includes(code) || typeCode === '消息队列' ||
        name.includes('kafka') || name.includes('rabbitmq') || name.includes('rocketmq') || name.includes('mq')) {
      return { color: 'text-yellow-400', bg: 'bg-yellow-950/30', border: 'border-yellow-500/20', accent: 'bg-yellow-600', gradient: 'from-yellow-500/40 via-yellow-600/20 to-transparent', icon };
    }
    // Registry/Config types (Nacos, Consul, Eureka)
    if (['REGISTRY', 'CONFIG'].includes(code) ||
        name.includes('nacos') || name.includes('consul') || name.includes('eureka') || name.includes('registry') || name.includes('config')) {
      return { color: 'text-green-400', bg: 'bg-green-950/30', border: 'border-green-500/20', accent: 'bg-green-600', gradient: 'from-green-500/40 via-green-600/20 to-transparent', icon };
    }
    // Gateway types
    if (['GATEWAY', 'API_GATEWAY', 'APIGATEWAY'].includes(code) || typeCode === '网关' ||
        name.includes('gateway') || name.includes('nginx') || name.includes('kong')) {
      return { color: 'text-pink-400', bg: 'bg-pink-950/30', border: 'border-pink-500/20', accent: 'bg-pink-600', gradient: 'from-pink-500/40 via-pink-600/20 to-transparent', icon };
    }
    // Server/API types
    if (['SERVER', 'SERVICE', 'API'].includes(code) || ['服务器', '服务'].includes(typeCode) ||
        name.includes('api') || name.includes('service') || name.includes('server')) {
      return { color: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/20', accent: 'bg-blue-600', gradient: 'from-blue-500/40 via-blue-600/20 to-transparent', icon };
    }
    // Infrastructure types
    if (['INFRASTRUCTURE', 'INFRA'].includes(code) || typeCode === '基础设施') {
      return { color: 'text-slate-400', bg: 'bg-slate-800/30', border: 'border-slate-700/20', accent: 'bg-slate-500', gradient: 'from-slate-500/40 via-slate-600/20 to-transparent', icon };
    }
    // Cloud types
    if (['CLOUD', 'AWS', 'AZURE', 'GCP'].includes(code) || typeCode === '云服务' ||
        name.includes('cloud') || name.includes('aws') || name.includes('azure') || name.includes('gcp')) {
      return { color: 'text-sky-400', bg: 'bg-sky-950/30', border: 'border-sky-500/20', accent: 'bg-sky-600', gradient: 'from-sky-500/40 via-sky-600/20 to-transparent', icon };
    }
    // Container types
    if (['CONTAINER', 'DOCKER', 'K8S', 'KUBERNETES', 'POD'].includes(code) || typeCode === '容器' ||
        name.includes('k8s') || name.includes('kubernetes') || name.includes('docker') || name.includes('container') || name.includes('pod')) {
      return { color: 'text-cyan-400', bg: 'bg-cyan-950/30', border: 'border-cyan-500/20', accent: 'bg-cyan-600', gradient: 'from-cyan-500/40 via-cyan-600/20 to-transparent', icon };
    }
    // Network/LB types
    if (['NETWORK', 'VPC', 'SUBNET', 'LOADBALANCER', 'LB', 'ROUTER'].includes(code) || ['网络', '负载均衡'].includes(typeCode) ||
        name.includes('lb') || name.includes('loadbalancer') || name.includes('load-balancer')) {
      return { color: 'text-teal-400', bg: 'bg-teal-950/30', border: 'border-teal-500/20', accent: 'bg-teal-600', gradient: 'from-teal-500/40 via-teal-600/20 to-transparent', icon };
    }
    // Storage types
    if (['STORAGE', 'DISK'].includes(code) || typeCode === '存储') {
      return { color: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-500/20', accent: 'bg-amber-600', gradient: 'from-amber-500/40 via-amber-600/20 to-transparent', icon };
    }
    // Middleware types
    if (['MIDDLEWARE'].includes(code) || typeCode === '中间件') {
      return { color: 'text-indigo-400', bg: 'bg-indigo-950/30', border: 'border-indigo-500/20', accent: 'bg-indigo-600', gradient: 'from-indigo-500/40 via-indigo-600/20 to-transparent', icon };
    }
    // Application types
    if (['APPLICATION', 'APP'].includes(code) || typeCode === '应用') {
      return { color: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-500/20', accent: 'bg-emerald-600', gradient: 'from-emerald-500/40 via-emerald-600/20 to-transparent', icon };
    }
    // Web types
    if (['WEB', 'HTTP'].includes(code) || typeCode === '网站') {
      return { color: 'text-rose-400', bg: 'bg-rose-950/30', border: 'border-rose-500/20', accent: 'bg-rose-600', gradient: 'from-rose-500/40 via-rose-600/20 to-transparent', icon };
    }
    // Default
    return { color: 'text-slate-400', bg: 'bg-slate-900', border: 'border-slate-800', accent: 'bg-slate-700', gradient: 'from-slate-500/40 via-slate-600/20 to-transparent', icon };
  };

  // Get status style
  const getStatusStyle = (status: ResourceStatus) => {
    const config = getStatusConfig(status);
    return {
      color: config.color,
      bgColor: config.bgColor,
      label: config.label,
    };
  };

  // Filter type options for dropdown
  const typeOptions = [
    { value: '', label: 'All Types' },
    ...resourceTypes.map(t => ({ value: String(t.id), label: t.name }))
  ];

  // Status options for dropdown
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'RUNNING', label: 'Running' },
    { value: 'STOPPED', label: 'Stopped' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'OFFLINE', label: 'Offline' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
             <Box className="text-cyan-400" /> Infrastructure Registry
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">Manage and provision logical resource units across the cluster.</p>
        </div>
        <button
          onClick={() => { setEditingResource(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-cyan-900/20 font-bold text-xs tracking-widest"
        >
          <Plus size={14} /> Add resource
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 shrink-0 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 text-slate-200 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {/* Type Filter */}
          <div className="w-32">
            <StyledSelect
              value={selectedTypeId !== undefined ? String(selectedTypeId) : ''}
              onChange={(val) => setSelectedTypeId(val ? Number(val) : undefined)}
              options={typeOptions}
              placeholder="Type"
            />
          </div>

          {/* Status Filter */}
          <div className="w-28">
            <StyledSelect
              value={selectedStatus || ''}
              onChange={(val) => setSelectedStatus(val as ResourceStatus | undefined || undefined)}
              options={statusOptions}
              placeholder="Status"
            />
          </div>

          <div className="flex bg-slate-950/80 rounded-lg p-1 border border-slate-800">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><LayoutList size={16} /></button>
            <button onClick={() => setViewMode('card')} className={`p-1.5 rounded transition-all ${viewMode === 'card' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={16} /></button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-slate-400 text-sm">Loading resources...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 bg-red-950/20 border border-red-900/30 rounded-xl p-8">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <span className="text-red-400 text-sm text-center">{error}</span>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm transition-all"
            >
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div className="flex-1 overflow-auto custom-scrollbar">
          {resources.length > 0 ? (
            viewMode === 'list' ? (
              <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-950 sticky top-0 z-10">
                    <tr>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Resource</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">Status</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">ID</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                    {resources.map((resource) => {
                      const style = getTypeStyle(resource.resourceTypeCode, resource.name);
                      const statusStyle = getStatusStyle(resource.status);
                      const Icon = style.icon;
                      return (
                        <tr key={resource.id} className="hover:bg-slate-800/40 transition-colors group cursor-pointer" onClick={() => handleViewDetail(resource)}>
                          <td className="p-4">
                            <div className="flex items-center gap-4">
                              {/* Tech-style Icon for List View */}
                              <div className="relative">
                                <div className={`absolute inset-0 rounded-lg ${style.accent} opacity-0 group-hover:opacity-15 blur-md transition-all duration-300`}></div>
                                <div className={`relative p-0.5 rounded-lg bg-gradient-to-br ${style.gradient}`}>
                                  <div className={`p-2 rounded-[6px] bg-slate-950/90 ${style.color}`}>
                                    <Icon size={18} className="drop-shadow-sm" />
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{resource.name}</div>
                                <div className="text-[9px] uppercase font-black text-slate-500 tracking-widest">{resource.resourceTypeName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${statusStyle.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.color.replace('text-', 'bg-')}`}></span>
                              {statusStyle.label}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-500 opacity-60">{resource.id}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={(e) => { e.stopPropagation(); handleViewDetail(resource); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400"><Eye size={16} /></button>
                              <button onClick={(e) => { e.stopPropagation(); setEditingResource(resource); setIsModalOpen(true); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400"><Settings size={16} /></button>
                              <button onClick={(e) => { e.stopPropagation(); setResourceToDelete(resource); setIsDeleteModalOpen(true); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6">
                {resources.map((resource) => {
                  const style = getTypeStyle(resource.resourceTypeCode, resource.name);
                  const statusStyle = getStatusStyle(resource.status);
                  const Icon = style.icon;
                  const attributes = resource.attributes ? JSON.parse(resource.attributes) : null;
                  return (
                    <div
                      key={resource.id}
                      className="relative bg-slate-900 border border-slate-800/80 rounded-xl hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all group flex flex-col min-h-[220px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-cyan-950/10 cursor-pointer"
                      onClick={() => handleViewDetail(resource)}
                    >
                      {/* Decorative Top Line */}
                      <div className={`h-1 w-full ${style.accent} opacity-30 group-hover:opacity-100 transition-opacity`}></div>

                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            {/* Tech-style Icon Container */}
                            <div className="relative">
                              {/* Glow effect */}
                              <div className={`absolute inset-0 rounded-xl ${style.accent} opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500`}></div>
                              {/* Outer ring */}
                              <div className={`relative p-0.5 rounded-xl bg-gradient-to-br ${style.gradient} group-hover:shadow-lg group-hover:shadow-current/20 transition-all duration-300`}>
                                {/* Inner container */}
                                <div className={`p-3 rounded-[10px] bg-slate-950/90 backdrop-blur-sm ${style.color}`}>
                                  <Icon size={24} className="drop-shadow-sm" />
                                </div>
                              </div>
                              {/* Subtle corner accents */}
                              <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${style.accent} rounded-full opacity-0 group-hover:opacity-60 transition-all duration-300 blur-[1px]`}></div>
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base font-bold text-white mb-0.5 truncate group-hover:text-cyan-400 transition-colors leading-tight">{resource.name}</h3>
                              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] opacity-80">{resource.resourceTypeName}</div>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${statusStyle.color} ${statusStyle.bgColor} border-current/30`}>
                            <span className={`w-1 h-1 rounded-full ${statusStyle.color.replace('text-', 'bg-')}`}></span>
                            {statusStyle.label}
                          </div>
                        </div>

                        <div className="space-y-2.5 flex-1">
                          {attributes ? (
                            Object.entries(attributes).slice(0, 2).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0">
                                  {key.toLowerCase().includes('region') ? <Globe size={12} className="text-slate-500" /> :
                                   key.toLowerCase().includes('replicas') ? <Box size={12} className="text-slate-500" /> :
                                   <Zap size={12} className="text-slate-500" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[10px] text-slate-500 leading-none mb-1 capitalize">{key}</div>
                                  <div className="text-xs text-slate-200 font-bold truncate">{String(value)}</div>
                                </div>
                              </div>
                            ))
                          ) : resource.description ? (
                            <div className="text-xs text-slate-400 line-clamp-2">{resource.description}</div>
                          ) : (
                            <div className="flex items-center gap-3 opacity-40">
                              <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0">
                                <Activity size={12} className="text-slate-600" />
                              </div>
                              <div className="text-[10px] text-slate-600 italic">No attributes defined</div>
                            </div>
                          )}
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-800/40 flex justify-between items-center shrink-0">
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); handleViewDetail(resource); }} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all"><Eye size={15} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingResource(resource); setIsModalOpen(true); }} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-cyan-400 transition-all"><Settings size={15} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setResourceToDelete(resource); setIsDeleteModalOpen(true); }} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-red-400 transition-all"><Trash2 size={15} /></button>
                          </div>
                          <button className="px-2.5 py-1 rounded bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold transition-all flex items-center gap-1.5">
                            Analyze <ArrowUpRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
              <Server size={48} className="opacity-10 mb-4" />
              {debouncedSearchTerm || selectedTypeId || selectedStatus ? (
                <>
                  <p className="text-sm font-bold tracking-wide">No matching resources found</p>
                  <p className="text-xs text-slate-600 mt-1">Try adjusting your search or filter criteria</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold tracking-wide">No resources yet</p>
                  <p className="text-xs text-slate-600 mt-1">Click the button above to add your first resource</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && pagination.totalPages > 0 && (
        <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-900/50 shrink-0">
          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest">Page</span>
            <span className="text-xs text-white bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">{pagination.page}</span>
            <span className="text-[10px] text-slate-500 font-bold">/</span>
            <span className="text-xs text-slate-400 font-mono font-bold">{pagination.totalPages}</span>
            <span className="text-[10px] text-slate-600 ml-2">({pagination.totalElements} total)</span>
          </div>
          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <ResourceFormModal
          resource={editingResource}
          resourceTypes={resourceTypes}
          typesLoading={typesLoading}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false);
            refresh();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && resourceToDelete && (
        <DeleteConfirmModal
          resource={resourceToDelete}
          onClose={() => setIsDeleteModalOpen(false)}
          onDeleted={() => {
            setIsDeleteModalOpen(false);
            refresh();
          }}
        />
      )}
    </div>
  );
};

// Resource Form Modal Component
interface ResourceFormModalProps {
  resource: ResourceDTO | null;
  resourceTypes: ResourceTypeDTO[];
  typesLoading: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  resource,
  resourceTypes,
  typesLoading,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: resource?.name || '',
    description: resource?.description || '',
    resourceTypeId: resource?.resourceTypeId || (resourceTypes[0]?.id || 0),
    attributes: resource?.attributes || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Update resourceTypeId when types load
  useEffect(() => {
    if (!resource && resourceTypes.length > 0 && !formData.resourceTypeId) {
      setFormData(prev => ({ ...prev, resourceTypeId: resourceTypes[0].id }));
    }
  }, [resourceTypes, resource, formData.resourceTypeId]);

  // Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Resource name is required';
    } else if (formData.name.length > 100) {
      errors.name = 'Resource name cannot exceed 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }

    if (!formData.resourceTypeId) {
      errors.resourceTypeId = 'Please select a resource type';
    }

    if (formData.attributes.trim()) {
      try {
        JSON.parse(formData.attributes);
      } catch {
        errors.attributes = 'Attributes must be valid JSON format';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (resource) {
        // Update
        const updateData: UpdateResourceRequest = {
          id: resource.id,
          name: formData.name,
          description: formData.description || undefined,
          attributes: formData.attributes || undefined,
          version: resource.version,
        };
        await resourceApi.update(updateData);
      } else {
        // Create - Uses nodeApi instead of resourceApi (005-api-reintegration)
        const createData: CreateNodeRequest = {
          operatorId: 1,
          name: formData.name,
          description: formData.description || undefined,
          nodeTypeId: formData.resourceTypeId, // resourceTypeId maps to nodeTypeId
          attributes: formData.attributes || undefined,
        };
        await nodeApi.create(createData);
      }
      onSave();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          if (resource) {
            setError('Data has been modified by another user, please refresh and try again');
          } else {
            setError('Resource name already exists');
          }
        } else {
          setError(err.message);
        }
      } else {
        setError('Operation failed, please try again later');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = resourceTypes.map(t => ({ value: String(t.id), label: t.name }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-t-cyan-600">
        <div className="flex items-center justify-between p-5 bg-slate-950/50 border-b border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
            <Sparkles size={16} className="text-cyan-400" /> {resource ? 'Edit Resource' : 'Add Resource'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Resource Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className={`w-full bg-slate-900 border rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all ${validationErrors.name ? 'border-red-500' : 'border-slate-700'}`}
                placeholder="e.g. Core API Gateway"
              />
              {validationErrors.name && <p className="text-red-400 text-xs mt-1">{validationErrors.name}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Resource Type *</label>
              {typesLoading ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 size={14} className="animate-spin" /> Loading...
                </div>
              ) : (
                <StyledSelect
                  value={String(formData.resourceTypeId)}
                  onChange={(val) => setFormData({...formData, resourceTypeId: Number(val)})}
                  options={typeOptions}
                  placeholder="Select resource type..."
                  disabled={!!resource} // Can't change type when editing
                />
              )}
              {validationErrors.resourceTypeId && <p className="text-red-400 text-xs mt-1">{validationErrors.resourceTypeId}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className={`w-full bg-slate-900 border rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all resize-none ${validationErrors.description ? 'border-red-500' : 'border-slate-700'}`}
                placeholder="Resource description (optional)"
                rows={2}
              />
              {validationErrors.description && <p className="text-red-400 text-xs mt-1">{validationErrors.description}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Attributes (JSON)</label>
              <textarea
                value={formData.attributes}
                onChange={e => setFormData({...formData, attributes: e.target.value})}
                className={`w-full bg-slate-900 border rounded-lg p-2.5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all resize-none font-mono ${validationErrors.attributes ? 'border-red-500' : 'border-slate-700'}`}
                placeholder='{"ip": "192.168.1.100"}'
                rows={2}
              />
              {validationErrors.attributes && <p className="text-red-400 text-xs mt-1">{validationErrors.attributes}</p>}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black tracking-widest shadow-lg shadow-cyan-900/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
interface DeleteConfirmModalProps {
  resource: ResourceDTO;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ resource, onClose, onDeleted }) => {
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNameMatch = confirmName === resource.name;

  const handleDelete = async () => {
    if (!isNameMatch) return;

    setIsDeleting(true);
    setError(null);

    try {
      await resourceApi.delete(resource.id, confirmName);
      onDeleted();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Delete failed, please try again later');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex justify-center mb-4 text-red-500">
          <div className="p-4 bg-red-950/20 rounded-full border border-red-900/30">
            <AlertTriangle size={32} />
          </div>
        </div>
        <h3 className="font-bold text-xl text-white mb-2 tracking-tight text-center">Confirm Delete</h3>
        <p className="text-slate-400 text-sm mb-4 leading-relaxed text-center">
          You are about to delete resource <span className="text-white font-black">{resource.name}</span>
        </p>

        {error && (
          <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Enter resource name to confirm</label>
          <input
            type="text"
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-red-500/50 outline-none transition-all"
            placeholder={resource.name}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!isNameMatch || isDeleting}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black tracking-widest shadow-lg shadow-red-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : null}
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceManagement;
