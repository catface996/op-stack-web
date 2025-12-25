import React, { useState, useEffect } from 'react';
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
  Plus
} from 'lucide-react';
import { resourceApi, getResourceTypeIcon, getStatusConfig } from '../services/api/resources';
import { useResourceAuditLogs } from '../services/hooks/useResourceAuditLogs';
import type { ResourceDTO } from '../services/api/types';

interface ApiResourceDetailViewProps {
  resourceId: number;
  onBack: () => void;
}

type TabType = 'info' | 'topologies' | 'agents' | 'history';

const ApiResourceDetailView: React.FC<ApiResourceDetailViewProps> = ({ resourceId, onBack }) => {
  const [resource, setResource] = useState<ResourceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');

  const { logs, pagination, loading: logsLoading, setPage } = useResourceAuditLogs(resourceId);

  useEffect(() => {
    const fetchResource = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await resourceApi.get(resourceId);
        setResource(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resource');
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [resourceId]);

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
            <button className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition-all">
              <Settings size={16} className="text-cyan-400" />
              Edit Resource
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition-all">
              <Activity size={16} className="text-green-400" />
              Change Status
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-red-950/30 hover:bg-red-950/50 rounded-lg text-sm text-red-400 hover:text-red-300 transition-all border border-red-900/30">
              <Trash2 size={16} />
              Delete Resource
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTopologiesTab = () => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-white">Associated Topologies</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-bold text-white transition-all">
          <Plus size={14} /> Link Topology
        </button>
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Network size={48} className="opacity-20 mb-4" />
        <p className="text-sm font-medium">No topologies linked</p>
        <p className="text-xs text-slate-600 mt-1">Link this resource to topology groups for better visibility</p>
      </div>
    </div>
  );

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
              <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">{resource.resourceTypeName}</div>
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
    </div>
  );
};

export default ApiResourceDetailView;
