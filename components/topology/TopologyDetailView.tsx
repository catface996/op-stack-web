/**
 * TopologyDetailView Component
 *
 * Displays topology graph visualization with member management sidebar
 * Feature: 004-topology-api-separation (updated from 003-topologies-management)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { topologyApi } from '../../services/api/topology';
import { useMembers, useMemberMutations } from '../../services/hooks';
import { parseTopologyAttributes } from '../../services/api/types';
import type { TopologyDTO, TopologyMember, TopologyAttributes } from '../../services/api/types';
import { MembersList } from './MembersList';
import { AddMembersDialog } from './AddMembersDialog';
import TopologyGraph from '../TopologyGraph';
import {
  ArrowLeft,
  Network,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Tag,
  FileText,
  Activity,
  Calendar,
  PanelRightClose,
  PanelRightOpen,
  List,
  X,
} from 'lucide-react';
import { TopologyReportTemplates } from './TopologyReportTemplates';

interface TopologyDetailViewProps {
  topologyId: number;
  onBack: () => void;
  onViewResource: (resourceId: number) => void;
  onNavigateToDiagnosis?: () => void;
}

// Default operator ID (hardcoded until auth is implemented)
const DEFAULT_OPERATOR_ID = 1;

export const TopologyDetailView: React.FC<TopologyDetailViewProps> = ({
  topologyId,
  onBack,
  onViewResource,
  onNavigateToDiagnosis,
}) => {
  // Topology data - T029: Using TopologyDTO instead of ResourceDTO
  const [topology, setTopology] = useState<TopologyDTO | null>(null);
  const [topologyAttrs, setTopologyAttrs] = useState<TopologyAttributes | null>(null);
  const [loadingTopology, setLoadingTopology] = useState(true);
  const [topologyError, setTopologyError] = useState<string | null>(null);

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(true);

  // Graph refresh key - increment to force TopologyGraph refetch
  const [graphKey, setGraphKey] = useState(0);

  // Member management
  const {
    members,
    pagination,
    loading: loadingMembers,
    error: membersError,
    refresh: refreshMembers,
    setPage,
  } = useMembers(topologyId);

  const memberMutations = useMemberMutations();

  // Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TopologyMember | null>(null);
  const [showReportTemplates, setShowReportTemplates] = useState(false);

  // Fetch topology details - T028: Uses topologyApi.get() instead of resourceApi.get()
  const fetchTopology = useCallback(async () => {
    setLoadingTopology(true);
    setTopologyError(null);

    try {
      // T020: GetTopologyRequest only needs id, not operatorId
      const result = await topologyApi.get({ id: topologyId });
      setTopology(result);
      setTopologyAttrs(parseTopologyAttributes(result.attributes));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch topology details';
      setTopologyError(message);
      console.error('Failed to fetch topology:', err);
    } finally {
      setLoadingTopology(false);
    }
  }, [topologyId]);

  useEffect(() => {
    fetchTopology();
  }, [fetchTopology]);

  // Get existing member IDs for the add dialog
  const existingMemberIds = members.map(m => m.memberId);

  // Handle add members
  const handleAddMembers = async (memberIds: number[]): Promise<boolean> => {
    const result = await memberMutations.add(topologyId, memberIds);
    if (result) {
      refreshMembers();
      // Refresh topology graph to show new members
      setGraphKey(prev => prev + 1);
      return true;
    }
    return false;
  };

  // Handle check cycle
  const handleCheckCycle = async (memberIds: number[]) => {
    return memberMutations.checkCycle(topologyId, memberIds);
  };

  // Handle remove single member
  const handleRemoveMember = async (member: TopologyMember) => {
    const success = await memberMutations.remove(topologyId, [member.memberId]);
    if (success) {
      refreshMembers();
      setMemberToRemove(null);
      // Refresh topology graph
      setGraphKey(prev => prev + 1);
    }
  };

  // Handle remove selected members
  const handleRemoveSelected = async (selectedMembers: TopologyMember[]) => {
    const memberIds = selectedMembers.map(m => m.memberId);
    const success = await memberMutations.remove(topologyId, memberIds);
    if (success) {
      refreshMembers();
      // Refresh topology graph
      setGraphKey(prev => prev + 1);
    }
  };

  // Handle node click in topology graph
  const handleNodeClick = useCallback((nodeId: string) => {
    // Node click - could be used for selection
    console.log('Node clicked:', nodeId);
  }, []);

  // Handle node double click - view resource details
  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    const resourceId = parseInt(nodeId, 10);
    if (!isNaN(resourceId)) {
      onViewResource(resourceId);
    }
  }, [onViewResource]);

  // Handle create link between nodes
  const handleCreateLink = useCallback(async (link: { source: string; target: string; type: string }) => {
    // Map UI link type to API RelationshipType
    const typeMapping: Record<string, 'CALL' | 'DEPENDENCY' | 'DEPLOYMENT' | 'DATA_FLOW'> = {
      call: 'CALL',
      dependency: 'DEPENDENCY',
      deployment: 'DEPLOYMENT',
    };

    const relationshipType = typeMapping[link.type] || 'CALL';

    const requestData = {
      sourceResourceId: parseInt(link.source, 10),
      targetResourceId: parseInt(link.target, 10),
      relationshipType: relationshipType,
      direction: 'UNIDIRECTIONAL' as const,
      strength: 'STRONG' as const,
      topologyId: topologyId,
    };

    console.log('[TopologyDetailView] Creating relationship:', requestData);

    try {
      await topologyApi.createRelationship(requestData);

      // Refresh the graph to show the new link
      setGraphKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to create relationship:', err);
      console.error('Request data was:', requestData);
      // Could add error toast notification here
    }
  }, []);

  // Handle update link type
  const handleUpdateLink = useCallback(async (link: { source: string; target: string; oldType: string; newType: string; relationshipId?: number }) => {
    if (!link.relationshipId) {
      console.error('Cannot update link: missing relationshipId');
      return;
    }

    // Map UI link type to API RelationshipType
    const typeMapping: Record<string, 'CALL' | 'DEPENDENCY' | 'DEPLOYMENT' | 'DATA_FLOW'> = {
      call: 'CALL',
      dependency: 'DEPENDENCY',
      deployment: 'DEPLOYMENT',
    };

    const relationshipType = typeMapping[link.newType] || 'CALL';

    console.log('[TopologyDetailView] Updating relationship:', { id: link.relationshipId, type: relationshipType });

    try {
      await topologyApi.updateRelationship({
        id: link.relationshipId,
        type: relationshipType,
        version: 0, // Backend should handle version or return current version
      });

      // Refresh the graph to show the updated link
      setGraphKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to update relationship:', err);
      // Could add error toast notification here
    }
  }, []);

  // Handle delete link
  const handleDeleteLink = useCallback(async (link: { source: string; target: string; type: string; relationshipId?: number }) => {
    if (!link.relationshipId) {
      console.error('Cannot delete link: missing relationshipId');
      return;
    }

    console.log('[TopologyDetailView] Deleting relationship:', { id: link.relationshipId });

    try {
      await topologyApi.deleteRelationship({
        id: link.relationshipId,
      });

      // Refresh the graph to show the deleted link
      setGraphKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to delete relationship:', err);
      // Could add error toast notification here
    }
  }, []);

  // Loading state
  if (loadingTopology) {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6">
        <div className="flex flex-col items-center justify-center flex-1">
          <Loader2 size={48} className="animate-spin text-cyan-500 mb-4" />
          <p className="text-sm font-bold">Loading topology details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (topologyError || !topology) {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6">
        <div className="flex flex-col items-center justify-center flex-1">
          <AlertTriangle size={48} className="text-red-500 opacity-50 mb-4" />
          <p className="text-sm font-bold text-red-400 mb-4">{topologyError || 'Topology not found'}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all"
            >
              <ArrowLeft size={14} /> Back to list
            </button>
            <button
              onClick={fetchTopology}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">Topology:</span> {topology.name}
            </h2>
            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
              ID: {topologyId} •
              <span className={`${
                topology.status === 'RUNNING' ? 'text-green-400' :
                topology.status === 'STOPPED' ? 'text-slate-400' :
                topology.status === 'MAINTENANCE' ? 'text-yellow-400' : 'text-red-400'
              }`}>{topology.status}</span> •
              {topology.memberCount ?? pagination.totalElements} Members
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`/diagnosis?topologyId=${topologyId}`, '_blank')}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors shadow-lg shadow-indigo-900/20"
          >
            <Activity size={14} /> Diagnose Topology
          </button>
          <button
            onClick={() => setShowReportTemplates(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded text-xs font-bold transition-colors"
          >
            <FileText size={14} /> Report Templates
          </button>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition-colors shadow-lg shadow-cyan-900/20"
          >
            <Plus size={14} /> Add Members
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
            title={showSidebar ? 'Hide members panel' : 'Show members panel'}
          >
            {showSidebar ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Topology Graph Canvas */}
        <div className="flex-1 relative bg-slate-950">
          <TopologyGraph
            key={graphKey}
            resourceId={topologyId}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onCreateLink={handleCreateLink}
            onUpdateLink={handleUpdateLink}
            onDeleteLink={handleDeleteLink}
            showLegend={true}
          />
        </div>

        {/* Right: Members Sidebar */}
        {showSidebar && (
          <div className="w-72 border-l border-slate-800 bg-slate-900/50 flex flex-col">
            {/* Sidebar header */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <List size={14} />
                Members ({topology.memberCount ?? pagination.totalElements})
              </div>
              <button
                onClick={refreshMembers}
                disabled={loadingMembers}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
              >
                <RefreshCw size={12} className={loadingMembers ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Members list */}
            <div className="flex-1 overflow-auto p-2">
              <MembersList
                members={members}
                pagination={pagination}
                loading={loadingMembers}
                error={membersError}
                onRefresh={refreshMembers}
                onPageChange={setPage}
                onRemoveMember={(member) => handleRemoveMember(member)}
                onRemoveSelected={handleRemoveSelected}
                onViewResource={onViewResource}
                removing={memberMutations.removing}
                compact={true}
              />
            </div>

            {/* Topology info footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/80">
              <div className="text-[10px] text-slate-500 space-y-1">
                {topology.description && (
                  <p className="text-slate-400 line-clamp-2">{topology.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={10} />
                  Created {new Date(topology.createdAt).toLocaleDateString()}
                </div>
                {topologyAttrs?.tags && topologyAttrs.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {topologyAttrs.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] font-bold text-slate-400 uppercase">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Members Dialog */}
      {showAddDialog && (
        <AddMembersDialog
          subgraphId={topologyId}
          existingMemberIds={existingMemberIds}
          onClose={() => {
            setShowAddDialog(false);
            memberMutations.clearError();
            memberMutations.clearCycleError();
          }}
          onAdd={handleAddMembers}
          onCheckCycle={handleCheckCycle}
          adding={memberMutations.adding}
          checkingCycle={memberMutations.checkingCycle}
          error={memberMutations.error}
          cycleError={memberMutations.cycleError}
        />
      )}

      {/* Report Templates Modal */}
      {showReportTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowReportTemplates(false)}
          />
          {/* Modal */}
          <div className="relative w-[90%] max-w-6xl h-[80vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="shrink-0 px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-cyan-400" />
                <h2 className="text-lg font-bold text-white">Report Templates</h2>
                <span className="text-xs text-slate-500">
                  Topology: {topology.name}
                </span>
              </div>
              <button
                onClick={() => setShowReportTemplates(false)}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>
            {/* Modal Body */}
            <div className="flex-1 overflow-hidden p-6">
              <TopologyReportTemplates topologyId={topologyId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopologyDetailView;
