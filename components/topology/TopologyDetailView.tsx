/**
 * TopologyDetailView Component
 *
 * Displays topology graph visualization with member management sidebar
 * Feature: 004-topology-api-separation (updated from 003-topologies-management)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { topologyApi } from '../../services/api/topology';
import { listAgents } from '../../services/api/agents';
import { useMembers, useMemberMutations, useHierarchicalTeam } from '../../services/hooks';
import { parseTopologyAttributes } from '../../services/api/types';
import type { TopologyDTO, TopologyMember, TopologyAttributes, UnboundAgentDTO, HierarchicalAgentDTO, AgentRoleDTO } from '../../services/api/types';
import { agentBoundsApi, bindGlobalSupervisor, unbindGlobalSupervisor, bindAgentToNode, unbindAgentFromNode } from '../../services/api/agentBounds';
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
  Shield,
  Unlink,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  Server,
  UserPlus,
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
  const [sidebarTab, setSidebarTab] = useState<'members' | 'agents'>('members');

  // Graph refresh key - increment to force TopologyGraph refetch
  const [graphKey, setGraphKey] = useState(0);

  // Hierarchical team data
  const {
    team: hierarchicalTeam,
    loading: loadingTeam,
    error: teamError,
    refresh: refreshTeam,
  } = useHierarchicalTeam(topologyId);

  // Agent binding state for hierarchy panel
  const [bindingAgent, setBindingAgent] = useState(false);
  const [showAgentSelectModal, setShowAgentSelectModal] = useState<{
    type: 'global' | 'supervisor' | 'worker';
    nodeId?: number;
    nodeName?: string;
  } | null>(null);
  const [showAgentUnbindConfirm, setShowAgentUnbindConfirm] = useState<{
    agent: HierarchicalAgentDTO;
    type: 'global' | 'supervisor' | 'worker';
    nodeId?: number;
  } | null>(null);

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

  // Supervisor binding state (used by SupervisorSelectModal)
  const [showSupervisorSelect, setShowSupervisorSelect] = useState(false);
  const [showUnbindConfirm, setShowUnbindConfirm] = useState(false);
  const [supervisorBinding, setSupervisorBinding] = useState(false);

  // Report templates state
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

  // Handle bind supervisor
  const handleBindSupervisor = async (agentId: number) => {
    setSupervisorBinding(true);
    try {
      await topologyApi.bindSupervisor({ topologyId, agentId });
      await fetchTopology(); // Refresh topology to get updated supervisor info
      setShowSupervisorSelect(false);
    } catch (err) {
      console.error('Failed to bind supervisor:', err);
    } finally {
      setSupervisorBinding(false);
    }
  };

  // Handle unbind supervisor
  const handleUnbindSupervisor = async () => {
    setSupervisorBinding(true);
    try {
      const updated = await topologyApi.unbindSupervisor({ topologyId });
      setTopology(updated);
      setShowUnbindConfirm(false);
    } catch (err) {
      console.error('Failed to unbind supervisor:', err);
    } finally {
      setSupervisorBinding(false);
    }
  };

  // Handle bind agent from hierarchy panel
  const handleBindAgentFromHierarchy = async (agentId: number) => {
    if (!showAgentSelectModal) return;

    setBindingAgent(true);
    try {
      if (showAgentSelectModal.type === 'global') {
        await bindGlobalSupervisor(topologyId, agentId);
        await fetchTopology();
      } else if (showAgentSelectModal.nodeId) {
        await bindAgentToNode(showAgentSelectModal.nodeId, agentId);
      }
      refreshTeam();
      setShowAgentSelectModal(null);
    } catch (err) {
      console.error('Failed to bind agent:', err);
    } finally {
      setBindingAgent(false);
    }
  };

  // Handle unbind agent from hierarchy panel
  const handleUnbindAgentFromHierarchy = async () => {
    if (!showAgentUnbindConfirm) return;

    setBindingAgent(true);
    try {
      if (showAgentUnbindConfirm.type === 'global') {
        await unbindGlobalSupervisor(topologyId, showAgentUnbindConfirm.agent.id);
        await fetchTopology();
      } else if (showAgentUnbindConfirm.nodeId) {
        await unbindAgentFromNode(showAgentUnbindConfirm.nodeId, showAgentUnbindConfirm.agent.id);
      }
      refreshTeam();
      setShowAgentUnbindConfirm(null);
    } catch (err) {
      console.error('Failed to unbind agent:', err);
    } finally {
      setBindingAgent(false);
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

    console.log('[TopologyDetailView] Deleting relationship:', { relationshipId: link.relationshipId });

    try {
      await topologyApi.deleteRelationship({
        relationshipId: link.relationshipId,
        operatorId: 1,
      });

      // Refresh the graph to show the deleted link
      setGraphKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to delete relationship:', err);
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

        {/* Right: Sidebar */}
        {showSidebar && (
          <div className="w-72 border-l border-slate-800 bg-slate-900/50 flex flex-col">
            {/* Tab Switcher */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setSidebarTab('members')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  sidebarTab === 'members'
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-950/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <List size={12} />
                Members
              </button>
              <button
                onClick={() => setSidebarTab('agents')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  sidebarTab === 'agents'
                    ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-950/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <Users size={12} />
                Agents
              </button>
            </div>

            {/* Tab Content */}
            {sidebarTab === 'members' ? (
              <>
                {/* Members header */}
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <List size={14} />
                    Members ({topology.memberCount ?? pagination.totalElements})
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddDialog(true)}
                      className="flex items-center gap-1 px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold transition-colors"
                    >
                      <Plus size={10} /> Add
                    </button>
                    <button
                      onClick={refreshMembers}
                      disabled={loadingMembers}
                      className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      <RefreshCw size={12} className={loadingMembers ? 'animate-spin' : ''} />
                    </button>
                  </div>
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
              </>
            ) : (
              <>
                {/* Agents Tab Header */}
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <Network size={14} />
                    Agent Hierarchy
                  </div>
                  <button
                    onClick={refreshTeam}
                    disabled={loadingTeam}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    <RefreshCw size={12} className={loadingTeam ? 'animate-spin' : ''} />
                  </button>
                </div>

                {/* Hierarchical Agent Panel */}
                <div className="flex-1 overflow-auto p-2">
                  <EditableHierarchyPanel
                    team={hierarchicalTeam}
                    loading={loadingTeam}
                    error={teamError}
                    onBindGlobalSupervisor={() => setShowAgentSelectModal({ type: 'global' })}
                    onUnbindGlobalSupervisor={(agent) => setShowAgentUnbindConfirm({ agent, type: 'global' })}
                    onBindSupervisor={(nodeId, nodeName) => setShowAgentSelectModal({ type: 'supervisor', nodeId, nodeName })}
                    onUnbindSupervisor={(agent, nodeId) => setShowAgentUnbindConfirm({ agent, type: 'supervisor', nodeId })}
                    onBindWorker={(nodeId, nodeName) => setShowAgentSelectModal({ type: 'worker', nodeId, nodeName })}
                    onUnbindWorker={(agent, nodeId) => setShowAgentUnbindConfirm({ agent, type: 'worker', nodeId })}
                  />
                </div>
              </>
            )}

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

      {/* Supervisor Select Modal */}
      {showSupervisorSelect && (
        <SupervisorSelectModal
          topologyId={topologyId}
          onSelect={handleBindSupervisor}
          onClose={() => setShowSupervisorSelect(false)}
          binding={supervisorBinding}
        />
      )}

      {/* Unbind Supervisor Confirmation Modal */}
      {showUnbindConfirm && topology.globalSupervisors?.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="h-1 w-full bg-red-600"></div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-950/50 rounded-lg">
                  <Unlink size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Unbind Supervisor</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Confirm action</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Are you sure you want to unbind <span className="font-bold text-white">{topology.globalSupervisors[0].agentName}</span> from this topology?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowUnbindConfirm(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnbindSupervisor}
                  disabled={supervisorBinding}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {supervisorBinding && <Loader2 size={14} className="animate-spin" />}
                  Unbind
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Unbind Confirmation Modal (from Hierarchy Panel) */}
      {showAgentUnbindConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="h-1 w-full bg-red-600"></div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-950/50 rounded-lg">
                  <Unlink size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Unbind Agent</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {showAgentUnbindConfirm.type === 'global' ? 'Global Supervisor' :
                     showAgentUnbindConfirm.type === 'supervisor' ? 'Team Supervisor' : 'Worker'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Are you sure you want to unbind <span className="font-bold text-white">{showAgentUnbindConfirm.agent.name}</span>?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAgentUnbindConfirm(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnbindAgentFromHierarchy}
                  disabled={bindingAgent}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {bindingAgent && <Loader2 size={14} className="animate-spin" />}
                  Unbind
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Select Modal (for Team Supervisor / Worker binding) */}
      {showAgentSelectModal && (
        <AgentSelectModal
          topologyId={topologyId}
          nodeId={showAgentSelectModal.nodeId}
          agentType={showAgentSelectModal.type}
          nodeName={showAgentSelectModal.nodeName}
          onSelect={handleBindAgentFromHierarchy}
          onClose={() => setShowAgentSelectModal(null)}
          binding={bindingAgent}
        />
      )}
    </div>
  );
};

// Supervisor Select Modal Component
interface SupervisorSelectModalProps {
  topologyId: number;
  onSelect: (agentId: number) => void;
  onClose: () => void;
  binding: boolean;
}

const PAGE_SIZE = 10;

const SupervisorSelectModal: React.FC<SupervisorSelectModalProps> = ({ topologyId, onSelect, onClose, binding }) => {
  const [agents, setAgents] = useState<UnboundAgentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Search and pagination state
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Fetch unbound Global Supervisor agents for this topology
  const fetchUnboundAgents = useCallback(async (searchKeyword: string, pageNum: number) => {
    setLoading(true);
    try {
      const result = await topologyApi.queryUnboundSupervisors({
        topologyId,
        keyword: searchKeyword || undefined,
        page: pageNum,
        size: PAGE_SIZE,
      });
      setAgents(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (error) {
      console.error('Failed to fetch unbound supervisors:', error);
      setAgents([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [topologyId]);

  // Initial fetch
  useEffect(() => {
    fetchUnboundAgents(keyword, page);
  }, [fetchUnboundAgents, keyword, page]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== keyword) {
        setKeyword(searchInput);
        setPage(1); // Reset to first page on search
        setSelectedId(null); // Clear selection on search
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, keyword]);

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">Select Global Supervisor</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or specialty..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Agent List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="text-indigo-400 animate-spin" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Shield size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">{keyword ? 'No matching supervisors found' : 'No Global Supervisors available'}</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedId(agent.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      selectedId === agent.id
                        ? 'bg-indigo-950/30 border-indigo-500/50'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded bg-indigo-950/50 text-indigo-400">
                        <Shield size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                        <p className="text-[10px] text-slate-500">{agent.specialty || 'Global Supervisor'}</p>
                      </div>
                      {selectedId === agent.id && <Check size={16} className="text-indigo-400" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-500">
                    {totalElements} total
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={page <= 1}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs text-slate-400">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={page >= totalPages}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button
              onClick={() => selectedId && onSelect(selectedId)}
              disabled={!selectedId || binding}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2"
            >
              {binding && <Loader2 size={14} className="animate-spin" />}
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Agent Select Modal Component (for Team Supervisor / Worker)
interface AgentSelectModalProps {
  topologyId: number;
  nodeId?: number;
  agentType: 'global' | 'supervisor' | 'worker';
  nodeName?: string;
  onSelect: (agentId: number) => void;
  onClose: () => void;
  binding: boolean;
}

const AgentSelectModal: React.FC<AgentSelectModalProps> = ({
  topologyId,
  nodeId,
  agentType,
  nodeName,
  onSelect,
  onClose,
  binding,
}) => {
  const [agents, setAgents] = useState<UnboundAgentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Determine hierarchy level based on agent type
  const hierarchyLevel = agentType === 'global' ? 'GLOBAL_SUPERVISOR' :
                         agentType === 'supervisor' ? 'TEAM_SUPERVISOR' : 'TEAM_WORKER';

  // Fetch unbound agents
  const fetchAgents = useCallback(async (searchKeyword: string, pageNum: number) => {
    setLoading(true);
    try {
      // For Global Supervisor, use the topology unbound API
      if (agentType === 'global') {
        const result = await topologyApi.queryUnboundSupervisors({
          topologyId,
          keyword: searchKeyword || undefined,
          page: pageNum,
          size: PAGE_SIZE,
        });
        setAgents(result.content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      } else if (nodeId) {
        // For Team Supervisor / Worker:
        // 1. Query all agents with the specific role
        // 2. Filter out agents already bound to this node
        const role: AgentRoleDTO = agentType === 'supervisor' ? 'TEAM_SUPERVISOR' : 'WORKER';

        // Fetch agents and bound agents in parallel
        const [agentsResult, boundAgents] = await Promise.all([
          listAgents({
            role,
            keyword: searchKeyword || undefined,
            page: pageNum,
            size: PAGE_SIZE,
          }),
          agentBoundsApi.queryByEntity({
            entityType: 'NODE',
            entityId: nodeId,
          }),
        ]);

        // Get IDs of agents already bound to this node
        const boundAgentIds = new Set(boundAgents.map(a => a.agentId));

        // Filter out bound agents and convert to UnboundAgentDTO format
        const unboundAgents: UnboundAgentDTO[] = agentsResult.data.content
          .filter(a => !boundAgentIds.has(a.id))
          .map(a => ({
            id: a.id,
            name: a.name,
            specialty: a.specialty || null,
            model: a.model || null,
          }));

        setAgents(unboundAgents);
        // Note: pagination counts may include bound agents, but filtering is done client-side
        // Use unboundAgents.length as the accurate count for the current page
        const estimatedTotal = Math.max(0, agentsResult.data.totalElements - boundAgentIds.size);
        setTotalPages(Math.ceil(estimatedTotal / PAGE_SIZE) || 1);
        setTotalElements(estimatedTotal);
      } else {
        // No nodeId provided for non-global agent type
        setAgents([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setAgents([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [topologyId, nodeId, agentType]);

  useEffect(() => {
    fetchAgents(keyword, page);
  }, [fetchAgents, keyword, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== keyword) {
        setKeyword(searchInput);
        setPage(1);
        setSelectedId(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, keyword]);

  const getTitle = () => {
    switch (agentType) {
      case 'global': return 'Select Global Supervisor';
      case 'supervisor': return `Select Team Supervisor${nodeName ? ` for ${nodeName}` : ''}`;
      case 'worker': return `Select Worker${nodeName ? ` for ${nodeName}` : ''}`;
    }
  };

  const getIconColor = () => {
    switch (agentType) {
      case 'global': return 'bg-indigo-950/50 text-indigo-400';
      case 'supervisor': return 'bg-purple-950/50 text-purple-400';
      case 'worker': return 'bg-cyan-950/50 text-cyan-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">{getTitle()}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or specialty..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Agent List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="text-indigo-400 animate-spin" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">{keyword ? 'No matching agents found' : 'No agents available'}</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedId(agent.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      selectedId === agent.id
                        ? 'bg-indigo-950/30 border-indigo-500/50'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${getIconColor()}`}>
                        {agentType === 'global' ? <Network size={14} /> :
                         agentType === 'supervisor' ? <Server size={14} /> :
                         <Activity size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                        <p className="text-[10px] text-slate-500">{agent.specialty || hierarchyLevel.replace(/_/g, ' ')}</p>
                      </div>
                      {selectedId === agent.id && <Check size={16} className="text-indigo-400" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-500">{totalElements} total</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => page > 1 && setPage(page - 1)}
                      disabled={page <= 1}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs text-slate-400">{page} / {totalPages}</span>
                    <button
                      onClick={() => page < totalPages && setPage(page + 1)}
                      disabled={page >= totalPages}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button
              onClick={() => selectedId && onSelect(selectedId)}
              disabled={!selectedId || binding}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2"
            >
              {binding && <Loader2 size={14} className="animate-spin" />}
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Editable Hierarchy Panel Component
interface EditableHierarchyPanelProps {
  team: import('../../services/api/types').HierarchicalTeamDTO | null;
  loading: boolean;
  error: string | null;
  onBindGlobalSupervisor: () => void;
  onUnbindGlobalSupervisor: (agent: HierarchicalAgentDTO) => void;
  onBindSupervisor: (nodeId: number, nodeName: string) => void;
  onUnbindSupervisor: (agent: HierarchicalAgentDTO, nodeId: number) => void;
  onBindWorker: (nodeId: number, nodeName: string) => void;
  onUnbindWorker: (agent: HierarchicalAgentDTO, nodeId: number) => void;
}

const EditableHierarchyPanel: React.FC<EditableHierarchyPanelProps> = ({
  team,
  loading,
  error,
  onBindGlobalSupervisor,
  onUnbindGlobalSupervisor,
  onBindSupervisor,
  onUnbindSupervisor,
  onBindWorker,
  onUnbindWorker,
}) => {
  // API now returns all nodes with supervisor=null and workers=[] for unbound nodes
  const allNodes = team?.teams || [];

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4">
        <Loader2 size={24} className="animate-spin mb-2" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Loading agents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400 p-4">
        <AlertTriangle size={24} className="mb-2" />
        <span className="text-[10px] font-bold uppercase tracking-widest mb-1">Error</span>
        <span className="text-[9px] text-slate-500 text-center">{error}</span>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4">
        <Network size={24} className="opacity-30 mb-2" />
        <span className="text-[10px] font-bold uppercase tracking-widest">No data</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Global Supervisor */}
      <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-1">
        Global Supervisor
      </div>
      {team.globalSupervisor ? (
        <div className="flex items-center justify-between p-2 bg-indigo-950/40 border border-indigo-500/30 rounded-lg group">
          <div className="flex items-center gap-2 min-w-0">
            <Network size={14} className="text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-indigo-100 truncate">{team.globalSupervisor.name}</div>
              {team.globalSupervisor.modelName && (
                <div className="text-[9px] text-indigo-300/60 truncate">{team.globalSupervisor.modelName}</div>
              )}
              <div className="text-[9px] text-slate-500">{team.globalSupervisor.specialty || 'Global Supervisor'}</div>
            </div>
          </div>
          <button
            onClick={() => onUnbindGlobalSupervisor(team.globalSupervisor!)}
            className="p-1 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
            title="Unbind"
          >
            <Unlink size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={onBindGlobalSupervisor}
          className="w-full flex items-center justify-center gap-2 p-2 bg-slate-900/30 border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-lg text-[10px] text-slate-500 hover:text-indigo-400 transition-all"
        >
          <UserPlus size={12} />
          Assign Global Supervisor
        </button>
      )}

      {/* Node Teams */}
      {allNodes.length > 0 ? (
        allNodes.map((nodeTeam) => (
          <div key={nodeTeam.nodeId} className="mt-3">
            {/* Node Name */}
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-600 uppercase tracking-widest px-1 mb-1">
              <Users size={10} />
              {nodeTeam.nodeName}
            </div>

            {/* Team Supervisor */}
            {nodeTeam.supervisor ? (
              <div className="flex items-center justify-between p-1.5 bg-purple-950/40 border border-purple-500/30 rounded group mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Server size={12} className="text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium text-slate-200 truncate">{nodeTeam.supervisor.name}</div>
                    {nodeTeam.supervisor.modelName && (
                      <div className="text-[8px] text-purple-300/50 truncate">{nodeTeam.supervisor.modelName}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onUnbindSupervisor(nodeTeam.supervisor!, nodeTeam.nodeId)}
                  className="p-0.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                  title="Unbind Supervisor"
                >
                  <Unlink size={10} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onBindSupervisor(nodeTeam.nodeId, nodeTeam.nodeName)}
                className="w-full flex items-center justify-center gap-1 p-1.5 border border-dashed border-slate-700 hover:border-purple-500/50 rounded text-[9px] text-slate-600 hover:text-purple-400 transition-all mb-1"
              >
                <UserPlus size={10} />
                Assign Supervisor
              </button>
            )}

            {/* Workers */}
            <div className="pl-3 space-y-1">
              {nodeTeam.workers.length > 0 ? (
                nodeTeam.workers.map(worker => (
                  <div key={worker.id} className="flex items-center justify-between p-1.5 bg-cyan-950/30 border border-cyan-500/20 rounded group">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Activity size={10} className="text-cyan-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-medium text-slate-200 truncate">{worker.name}</div>
                        {worker.modelName && (
                          <div className="text-[8px] text-cyan-300/50 truncate">{worker.modelName}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onUnbindWorker(worker, nodeTeam.nodeId)}
                      className="p-0.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title="Unbind Worker"
                    >
                      <Unlink size={10} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-[9px] text-slate-600 italic px-1 py-0.5">No workers</div>
              )}
              <button
                onClick={() => onBindWorker(nodeTeam.nodeId, nodeTeam.nodeName)}
                className="w-full flex items-center justify-center gap-1 p-1 border border-dashed border-slate-800 hover:border-cyan-500/50 rounded text-[9px] text-slate-600 hover:text-cyan-400 transition-all"
              >
                <UserPlus size={10} />
                Add Worker
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center p-4 text-slate-600 text-[10px] italic">
          No nodes in topology
        </div>
      )}
    </div>
  );
};

export default TopologyDetailView;
