
import React, { useState, useMemo } from 'react';
import { TopologyGroup, Topology, TopologyNode } from '../types';
import TopologyGraph from './TopologyGraph';
import { ChevronLeft, Plus, X, Trash2, Database, Shield, Server, Activity, Settings, Stethoscope, Zap, Play, Search } from 'lucide-react';

interface SubGraphCanvasProps {
  topologyGroup: TopologyGroup;
  globalTopology: Topology; // We need all nodes to allow adding them
  activeScopeId?: string;
  isSimulating?: boolean;
  onBack: () => void;
  onDiagnose: () => void; // Starts a NEW diagnosis
  onNavigateToDiagnosis: () => void; // Navigates to EXISTING diagnosis
  onAddNode: (nodeId: string) => void;
  onRemoveNode: (nodeId: string) => void;
  onViewResource: (node: TopologyNode) => void;
}

// Static empty set to prevent unnecessary effect triggers in TopologyGraph
const EMPTY_SET = new Set<string>();

const SubGraphCanvas: React.FC<SubGraphCanvasProps> = ({ 
  topologyGroup, 
  globalTopology, 
  activeScopeId,
  isSimulating,
  onBack, 
  onDiagnose,
  onNavigateToDiagnosis,
  onAddNode, 
  onRemoveNode,
  onViewResource
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addNodeSearchTerm, setAddNodeSearchTerm] = useState('');

  const isActiveScope = activeScopeId === topologyGroup.id;

  // 1. Construct Local Topology (Memoized for stability)
  const localTopology = useMemo(() => {
    // Filter global nodes to only those in the topologyGroup.nodeIds
    const localNodes = globalTopology.nodes.filter(n => topologyGroup.nodeIds.includes(n.id));
    
    // Filter global links: Both source and target must be in the topologyGroup
    const localLinks = globalTopology.links.filter(l => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return topologyGroup.nodeIds.includes(sourceId) && topologyGroup.nodeIds.includes(targetId);
    });

    return {
      nodes: localNodes,
      links: localLinks
    };
  }, [globalTopology, topologyGroup.nodeIds]);

  // Determine available nodes (those NOT in the topology)
  const availableNodes = useMemo(() => {
    return globalTopology.nodes.filter(n => !topologyGroup.nodeIds.includes(n.id));
  }, [globalTopology, topologyGroup.nodeIds]);

  // Filter available nodes based on search term
  const filteredAvailableNodes = useMemo(() => {
    return availableNodes.filter(n => 
      n.label.toLowerCase().includes(addNodeSearchTerm.toLowerCase()) || 
      n.id.toLowerCase().includes(addNodeSearchTerm.toLowerCase())
    );
  }, [availableNodes, addNodeSearchTerm]);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'Database': return <Database size={14} className="text-purple-400" />;
      case 'Gateway': return <Shield size={14} className="text-pink-400" />;
      case 'Service': return <Server size={14} className="text-blue-400" />;
      case 'Cache': return <Activity size={14} className="text-orange-400" />;
      default: return <Server size={14} className="text-slate-400" />;
    }
  };

  const handleCloseAddModal = () => {
      setIsAddModalOpen(false);
      setAddNodeSearchTerm(''); // Reset search on close
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="h-14 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">Topology:</span> {topologyGroup.name}
            </h2>
            <div className="text-[10px] text-slate-500 font-mono">ID: {topologyGroup.id} • {localTopology.nodes.length} Nodes</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={isActiveScope ? onNavigateToDiagnosis : onDiagnose}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all shadow-lg mr-2
              ${isActiveScope 
                  ? isSimulating 
                      ? 'bg-indigo-600 text-white shadow-indigo-900/40 animate-pulse border border-indigo-400' 
                      : 'bg-indigo-900 text-indigo-200 border border-indigo-500/50 hover:bg-indigo-800'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
              }
            `}
          >
            {isActiveScope ? (
               isSimulating ? <Zap size={14} /> : <Activity size={14} />
            ) : (
               <Stethoscope size={14} />
            )}
            
            {isActiveScope ? (
               isSimulating ? 'Diagnosis Running' : 'Diagnosis Active'
            ) : 'Diagnose Topology'}
          </button>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition-colors shadow-lg shadow-cyan-900/20"
          >
            <Plus size={14} /> Add Resource
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Topology Canvas */}
        <div className="flex-1 relative bg-slate-950">
          <TopologyGraph 
            data={localTopology}
            activeNodeIds={EMPTY_SET} 
            onNodeClick={() => {}} 
            onNodeDoubleClick={(id) => {
                const node = globalTopology.nodes.find(n => n.id === id);
                if (node) onViewResource(node);
            }}
          />
          {localTopology.nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 pointer-events-none">
               <Settings size={48} className="opacity-20 mb-4" />
               <p>Canvas is empty.</p>
               <p className="text-sm">Add resources to define this topology.</p>
            </div>
          )}
        </div>

        {/* Right: Resource List / Manager Sidebar */}
        <div className="w-64 border-l border-slate-800 bg-slate-900/50 flex flex-col">
           <div className="p-3 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase">
             Associated Resources
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
             {localTopology.nodes.map(node => (
               <div key={node.id} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-600 group transition-colors">
                  <div className="flex items-center gap-2 overflow-hidden">
                     {getNodeIcon(node.type)}
                     <div className="flex flex-col min-w-0">
                       <span className="text-xs font-bold text-slate-200 truncate">{node.label}</span>
                       <span className="text-xs text-slate-500 font-mono truncate">{node.id}</span>
                     </div>
                  </div>
                  <button 
                    onClick={() => onRemoveNode(node.id)}
                    className="p-1 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                    title="Remove from Topology"
                  >
                    <Trash2 size={14} />
                  </button>
               </div>
             ))}
             {localTopology.nodes.length === 0 && (
               <div className="p-4 text-center text-xs text-slate-500 italic">
                 No resources associated.
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Add Node Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-bold text-white">Add Resource to Topology</h3>
              <button onClick={handleCloseAddModal} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-3 border-b border-slate-800 bg-slate-950/50 space-y-3">
               <p className="text-xs text-slate-400 px-1">Select global resources to associate with <span className="text-white font-bold">{topologyGroup.name}</span>.</p>
               <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                  <input
                    type="text"
                    placeholder="Search available resources..."
                    value={addNodeSearchTerm}
                    onChange={e => setAddNodeSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                  />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredAvailableNodes.length > 0 ? (
                filteredAvailableNodes.map(node => (
                  <button 
                    key={node.id}
                    onClick={() => {
                        onAddNode(node.id);
                        // Don't close immediately to allow multi-add
                    }}
                    className="w-full flex items-center justify-between p-3 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500 hover:bg-slate-900 transition-all group text-left"
                  >
                     <div className="flex items-center gap-3">
                        {getNodeIcon(node.type)}
                        <div>
                          <div className="text-sm font-bold text-slate-200 group-hover:text-cyan-400">{node.label}</div>
                          <div className="text-xs text-slate-500 font-mono">{node.id}</div>
                        </div>
                     </div>
                     <Plus size={16} className="text-slate-600 group-hover:text-cyan-400" />
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Database size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">
                    {addNodeSearchTerm ? 'No matching resources found.' : 'All global resources are already in this topology.'}
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button onClick={handleCloseAddModal} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded transition-colors">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubGraphCanvas;
