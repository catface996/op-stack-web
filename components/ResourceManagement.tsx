
import React, { useState, useMemo } from 'react';
import { TopologyNode } from '../types';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Server, 
  Database, 
  Activity, 
  Shield,
  Settings,
  AlertTriangle,
  LayoutList,
  LayoutGrid
} from 'lucide-react';

interface ResourceManagementProps {
  nodes: TopologyNode[];
  onAdd: (node: TopologyNode) => void;
  onUpdate: (node: TopologyNode) => void;
  onDelete: (id: string) => void;
  onViewDetail: (node: TopologyNode) => void; // New prop for navigation
}

const ITEMS_PER_PAGE = 8;

const ResourceManagement: React.FC<ResourceManagementProps> = ({ nodes, onAdd, onUpdate, onDelete, onViewDetail }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Selection States
  const [editingNode, setEditingNode] = useState<TopologyNode | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<TopologyNode | null>(null);

  // Filter and Pagination Logic
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => 
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
      node.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [nodes, searchTerm]);

  const totalPages = Math.ceil(filteredNodes.length / ITEMS_PER_PAGE);
  const paginatedNodes = filteredNodes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const openAddModal = () => {
    setEditingNode(null);
    setIsModalOpen(true);
  };

  const openEditModal = (node: TopologyNode) => {
    setEditingNode(node);
    setIsModalOpen(true);
  };

  const promptDelete = (e: React.MouseEvent, node: TopologyNode) => {
    e.stopPropagation();
    setNodeToDelete(node);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (nodeToDelete) {
      onDelete(nodeToDelete.id);
      setIsDeleteModalOpen(false);
      setNodeToDelete(null);
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'Database': return <Database size={16} className="text-purple-400" />;
      case 'Gateway': return <Shield size={16} className="text-pink-400" />;
      case 'Service': return <Server size={16} className="text-blue-400" />;
      case 'Cache': return <Activity size={16} className="text-orange-400" />;
      default: return <Server size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Resource Management</h2>
          <p className="text-slate-400 text-sm mt-1">Manage infrastructure nodes and topology definitions.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-cyan-900/20 font-medium text-sm"
        >
          <Plus size={16} /> Add Resource
        </button>
      </div>

      {/* Toolbar: Search & View Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 shrink-0">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search resources by name or ID..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500 text-slate-200"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
             {/* View Mode Toggle */}
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    title="List View"
                >
                    <LayoutList size={16} />
                </button>
                <button
                    onClick={() => setViewMode('card')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'card' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Card View"
                >
                    <LayoutGrid size={16} />
                </button>
            </div>

            <div className="text-xs text-slate-500 whitespace-nowrap">
              <span className="text-white font-bold">{paginatedNodes.length}</span> / <span className="text-white font-bold">{filteredNodes.length}</span> items
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-slate-900/30 border border-slate-800 rounded-lg shadow-inner custom-scrollbar relative">
        {viewMode === 'list' ? (
            // LIST VIEW
            <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950/90 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                <tr>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Type</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Resource Name</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">ID</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900">
                {paginatedNodes.length > 0 ? (
                paginatedNodes.map((node) => (
                    <tr key={node.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        {getNodeIcon(node.type)}
                        <span>{node.type}</span>
                        </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-white">{node.label}</td>
                    <td className="p-4 text-sm font-mono text-slate-500">{node.id}</td>
                    <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onViewDetail(node); }} 
                            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-cyan-400 transition-colors" 
                            title="View Details"
                        >
                            <Eye size={16} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); openEditModal(node); }} 
                            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400 transition-colors" 
                            title="Edit"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                            onClick={(e) => promptDelete(e, node)} 
                            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors" 
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                        </div>
                    </td>
                    </tr>
                ))
                ) : (
                <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500 italic">
                    No resources found matching your criteria.
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        ) : (
            // CARD VIEW
            <div className="p-4">
                {paginatedNodes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {paginatedNodes.map((node) => (
                            <div 
                                key={node.id} 
                                className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all group flex flex-col h-[180px] cursor-pointer"
                                onClick={() => onViewDetail(node)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2 px-2 py-1 bg-slate-950 rounded border border-slate-800">
                                        {getNodeIcon(node.type)}
                                        <span className="text-xs font-bold text-slate-300">{node.type}</span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onViewDetail(node); }}
                                            className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-cyan-400"
                                            title="View Details"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); openEditModal(node); }}
                                            className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-blue-400"
                                            title="Edit"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => promptDelete(e, node)}
                                            className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-red-400"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white mb-1 truncate" title={node.label}>{node.label}</h3>
                                    <div className="text-xs text-slate-500 font-mono bg-slate-950/50 px-2 py-1 rounded border border-slate-800/50 truncate mb-2">
                                        ID: {node.id}
                                    </div>
                                    {node.properties && Object.keys(node.properties).length > 0 && (
                                        <div className="flex gap-1 flex-wrap">
                                            {Object.keys(node.properties).slice(0, 2).map(k => (
                                                <span key={k} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                                                    {k}
                                                </span>
                                            ))}
                                            {Object.keys(node.properties).length > 2 && (
                                                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">+{Object.keys(node.properties).length - 2}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Online
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <Server size={32} className="opacity-20 mb-2" />
                        <p>No resources found matching your criteria.</p>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 py-2 border-t border-slate-900 shrink-0">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-slate-400">
          Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{Math.max(1, totalPages)}</span>
        </span>
        <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <ResourceFormModal 
          node={editingNode} 
          onClose={() => setIsModalOpen(false)} 
          onSave={(node) => {
            if (editingNode) onUpdate(node);
            else onAdd(node);
            setIsModalOpen(false);
          }} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && nodeToDelete && (
        <ResourceDeleteModal
          node={nodeToDelete}
          onClose={() => { setIsDeleteModalOpen(false); setNodeToDelete(null); }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

const ResourceFormModal: React.FC<{ 
  node: TopologyNode | null, 
  onClose: () => void, 
  onSave: (node: TopologyNode) => void 
}> = ({ node, onClose, onSave }) => {
  const [formData, setFormData] = useState<TopologyNode>(node || {
    id: `node-${Math.random().toString(36).substr(2, 5)}`,
    label: '',
    type: 'Service'
  });

  // State for Custom Properties management
  const [customProps, setCustomProps] = useState<{key: string, value: string}[]>(() => {
    if (node?.properties) {
        return Object.entries(node.properties).map(([k, v]) => ({ key: k, value: v }));
    }
    return [];
  });

  const handleAddProp = () => {
    setCustomProps([...customProps, { key: '', value: '' }]);
  };

  const handleRemoveProp = (index: number) => {
    setCustomProps(customProps.filter((_, i) => i !== index));
  };

  const handlePropChange = (index: number, field: 'key' | 'value', value: string) => {
    const newProps = [...customProps];
    newProps[index][field] = value;
    setCustomProps(newProps);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert props array back to object
    const properties: Record<string, string> = {};
    customProps.forEach(p => {
        if (p.key.trim()) {
            properties[p.key.trim()] = p.value;
        }
    });

    onSave({ ...formData, properties });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-bold text-white">{node ? 'Edit Resource' : 'Add New Resource'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Resource ID</label>
            <input 
              type="text" 
              required
              disabled={!!node} // ID immutable on edit for simplicity
              value={formData.id}
              onChange={e => setFormData({...formData, id: e.target.value})}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Label Name</label>
            <input 
              type="text" 
              required
              value={formData.label}
              onChange={e => setFormData({...formData, label: e.target.value})}
              placeholder="e.g. Order Service"
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Type</label>
            <select
               value={formData.type}
               onChange={e => setFormData({...formData, type: e.target.value as any})}
               className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="Service">Service</option>
              <option value="Database">Database</option>
              <option value="Gateway">Gateway</option>
              <option value="Cache">Cache</option>
            </select>
          </div>

          {/* Custom Properties Section */}
          <div className="pt-2">
             <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-400 uppercase">Custom Attributes</label>
                <button 
                  type="button" 
                  onClick={handleAddProp}
                  className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                    <Plus size={12} /> Add
                </button>
             </div>
             
             <div className="space-y-2">
                {customProps.map((prop, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <input 
                           type="text"
                           placeholder="Key"
                           value={prop.key}
                           onChange={(e) => handlePropChange(idx, 'key', e.target.value)}
                           className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                         <input 
                           type="text"
                           placeholder="Value"
                           value={prop.value}
                           onChange={(e) => handlePropChange(idx, 'value', e.target.value)}
                           className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                        <button 
                           type="button"
                           onClick={() => handleRemoveProp(idx)}
                           className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                {customProps.length === 0 && (
                    <div className="text-center py-2 border border-dashed border-slate-800 rounded text-xs text-slate-600">
                        No custom attributes defined
                    </div>
                )}
             </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded text-slate-400 hover:bg-slate-800 text-sm font-medium transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors flex items-center gap-2">
              <Save size={16} /> Save Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ResourceDeleteModal: React.FC<{
  node: TopologyNode,
  onClose: () => void,
  onConfirm: () => void
}> = ({ node, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 border-red-500/20">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-red-500">
            <div className="p-2 bg-red-500/10 rounded-full border border-red-500/20">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-lg text-white">Delete Resource?</h3>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Are you sure you want to delete <span className="text-white font-bold">{node.label}</span> (ID: {node.id})? 
            <br/><br/>
            This action will remove the associated Agent Team and any linked connections in the topology. This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 rounded text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm} 
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors shadow-lg shadow-red-900/20"
            >
              Delete Resource
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceManagement;
