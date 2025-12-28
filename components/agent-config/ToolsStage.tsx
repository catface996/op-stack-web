/**
 * ToolsStage Component
 *
 * Stage 3 of agent configuration: Select tools grouped by category
 * Two-column layout: Available Tools (left) | Bound Tools (right)
 * Uses tools service binding API instead of agent update API
 * Feature: 013-agent-config-page
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Wrench,
  Loader2,
  AlertCircle,
  Check,
  Inbox,
  FolderOpen,
  Search,
  X,
  Plus,
  Minus,
  Package,
  CheckCircle2,
} from 'lucide-react';
import type { AgentWithApiFields } from '../../services/hooks/useAgents';
import { useAgentBinding } from '../../services/hooks/useAgentBinding';
import type { ToolDTO } from '../../types';

interface ToolsStageProps {
  agent: AgentWithApiFields;
  onDirtyChange: (isDirty: boolean) => void;
}

export const ToolsStage: React.FC<ToolsStageProps> = ({
  agent,
  onDirtyChange,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Use binding API
  const {
    boundTools,
    boundLoading,
    boundError,
    boundTotal,
    unboundTools,
    unboundLoading,
    unboundError,
    bind,
    binding,
    bindError,
    refreshBound,
    refreshUnbound,
  } = useAgentBinding({
    agentId: agent.id,
    keyword: searchKeyword || undefined,
  });

  // Add tool
  const handleAddTool = useCallback(async (toolId: string) => {
    const currentIds = boundTools.map(t => t.id);
    await bind([...currentIds, toolId]);
  }, [boundTools, bind]);

  // Remove tool
  const handleRemoveTool = useCallback(async (toolId: string) => {
    const currentIds = boundTools.map(t => t.id).filter(id => id !== toolId);
    await bind(currentIds);
  }, [boundTools, bind]);

  // Add all unbound tools
  const handleAddAll = useCallback(async () => {
    const currentIds = boundTools.map(t => t.id);
    const newIds = unboundTools.map(t => t.id);
    await bind([...currentIds, ...newIds]);
  }, [boundTools, unboundTools, bind]);

  // Clear all bound tools
  const handleClearAll = useCallback(async () => {
    await bind([]);
  }, [bind]);

  // Filter tools by search
  const filteredUnbound = useMemo(() => {
    if (!searchKeyword.trim()) return unboundTools;
    const kw = searchKeyword.toLowerCase();
    return unboundTools.filter(t =>
      (t.display_name || t.name).toLowerCase().includes(kw) ||
      t.description?.toLowerCase().includes(kw)
    );
  }, [unboundTools, searchKeyword]);

  const filteredBound = useMemo(() => {
    if (!searchKeyword.trim()) return boundTools;
    const kw = searchKeyword.toLowerCase();
    return boundTools.filter(t =>
      (t.display_name || t.name).toLowerCase().includes(kw) ||
      t.description?.toLowerCase().includes(kw)
    );
  }, [boundTools, searchKeyword]);

  // Group tools by category
  const groupByCategory = (tools: ToolDTO[]) => {
    const groups = new Map<string, { name: string; tools: ToolDTO[] }>();
    tools.forEach(tool => {
      const catId = tool.category_id || 'uncategorized';
      const catName = tool.category?.name || 'Uncategorized';
      const existing = groups.get(catId);
      if (existing) {
        existing.tools.push(tool);
      } else {
        groups.set(catId, { name: catName, tools: [tool] });
      }
    });
    return groups;
  };

  const unboundByCategory = useMemo(() => groupByCategory(filteredUnbound), [filteredUnbound]);
  const boundByCategory = useMemo(() => groupByCategory(filteredBound), [filteredBound]);

  const loading = boundLoading || unboundLoading;
  const error = boundError || unboundError || bindError;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">Tool Configuration</h2>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-800 rounded-lg">
            <Wrench size={12} className="text-cyan-400" />
            <span className="text-xs text-slate-300 font-medium">
              {boundTotal} bound
            </span>
          </div>
          {binding && <Loader2 size={14} className="text-cyan-400 animate-spin" />}
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Search tools..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-slate-300 rounded transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <span className="text-xs text-red-300">{error}</span>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
        {/* Left Panel: Available Tools (3 columns) */}
        <div className="col-span-3 flex flex-col min-h-0 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="shrink-0 px-4 py-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Available Tools
              </span>
              <span className="text-xs text-slate-500">
                ({filteredUnbound.length})
              </span>
            </div>
            {filteredUnbound.length > 0 && (
              <button
                onClick={handleAddAll}
                disabled={binding}
                className="px-2 py-1 text-[10px] font-bold text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors disabled:opacity-50"
              >
                Bind All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="text-cyan-400 animate-spin" />
              </div>
            ) : unboundByCategory.size === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox size={32} className="text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">No available tools</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {Array.from(unboundByCategory.entries()).map(([catId, { name, tools }]) => (
                  <CategoryCard
                    key={catId}
                    categoryId={catId}
                    categoryName={name}
                    tools={tools}
                    isExpanded={expandedCategories.has(catId)}
                    onToggle={(id) => setExpandedCategories(prev => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    })}
                    onAddTool={handleAddTool}
                    disabled={binding}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Bound Tools (1 column) */}
        <div className="col-span-1 flex flex-col min-h-0 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="shrink-0 px-4 py-3 border-b border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-cyan-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Bound
                </span>
                <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded">
                  {boundTotal}
                </span>
              </div>
              {boundTotal > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={binding}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2">
            {boundByCategory.size === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <Inbox size={28} className="text-slate-700 mb-2" />
                <p className="text-[11px] text-slate-500 font-medium">No tools bound</p>
                <p className="text-[10px] text-slate-600 mt-1">
                  Click + to bind tools
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from(boundByCategory.entries()).map(([catId, { name, tools }]) => (
                  <BoundCategoryCard
                    key={catId}
                    categoryName={name}
                    tools={tools}
                    onRemoveTool={handleRemoveTool}
                    disabled={binding}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Category Card for Available Tools
interface CategoryCardProps {
  categoryId: string;
  categoryName: string;
  tools: ToolDTO[];
  isExpanded: boolean;
  onToggle: (categoryId: string) => void;
  onAddTool: (toolId: string) => void;
  disabled?: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  categoryId,
  categoryName,
  tools,
  isExpanded,
  onToggle,
  onAddTool,
  disabled,
}) => {
  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${
      isExpanded
        ? 'border-cyan-500/30 bg-slate-900/80'
        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
    }`}>
      <button
        onClick={() => onToggle(categoryId)}
        className="w-full px-2.5 py-2 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <FolderOpen size={12} className={isExpanded ? 'text-cyan-400' : 'text-slate-500'} />
          <span className={`text-[11px] font-bold truncate ${isExpanded ? 'text-cyan-300' : 'text-slate-300'}`}>
            {categoryName}
          </span>
        </div>
        <span className="shrink-0 px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[9px] font-bold rounded">
          {tools.length}
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-800/50 max-h-36 overflow-auto">
          {tools.map(tool => (
            <div
              key={tool.id}
              className="group flex items-center justify-between px-2.5 py-1.5 border-t border-slate-800/30 first:border-t-0 hover:bg-slate-800/30"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Wrench size={10} className="shrink-0 text-slate-600" />
                <span className="text-[10px] text-slate-400 truncate">
                  {tool.display_name || tool.name}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTool(tool.id);
                }}
                disabled={disabled}
                className="shrink-0 p-1 text-cyan-400 hover:bg-cyan-500/20 rounded transition-colors disabled:opacity-50"
                title="Bind"
              >
                <Plus size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Bound Category Card
interface BoundCategoryCardProps {
  categoryName: string;
  tools: ToolDTO[];
  onRemoveTool: (toolId: string) => void;
  disabled?: boolean;
}

const BoundCategoryCard: React.FC<BoundCategoryCardProps> = ({
  categoryName,
  tools,
  onRemoveTool,
  disabled,
}) => {
  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
      <div className="px-2.5 py-2 flex items-center justify-between bg-slate-900/50 border-b border-slate-800/50">
        <div className="flex items-center gap-1.5 min-w-0">
          <FolderOpen size={12} className="text-cyan-400" />
          <span className="text-[11px] font-bold text-cyan-300 truncate">
            {categoryName}
          </span>
          <span className="text-[9px] text-slate-500">({tools.length})</span>
        </div>
      </div>

      <div className="max-h-32 overflow-auto">
        {tools.map(tool => (
          <div
            key={tool.id}
            className="group flex items-center justify-between px-2.5 py-1.5 border-t border-slate-800/30 first:border-t-0 hover:bg-slate-800/30"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Wrench size={10} className="shrink-0 text-cyan-500" />
              <span className="text-[10px] text-slate-300 truncate">
                {tool.display_name || tool.name}
              </span>
            </div>
            <button
              onClick={() => onRemoveTool(tool.id)}
              disabled={disabled}
              className="shrink-0 p-1 text-slate-600 hover:text-red-400 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
              title="Unbind"
            >
              <Minus size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolsStage;
