/**
 * TopologyReportTemplates Component
 *
 * Two-column layout for managing report template bindings to a topology
 * Left: Available templates (unbound) grouped by category
 * Right: Bound templates grouped by category
 * Feature: 014-topology-report-template
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  FileText,
  Loader2,
  AlertCircle,
  Inbox,
  FolderOpen,
  Search,
  X,
  Plus,
  Minus,
  Package,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTopologyReportTemplates } from '../../services/hooks';
import type { ReportTemplateDTO, ReportTemplateCategory } from '../../services/api/types';

interface TopologyReportTemplatesProps {
  topologyId: number;
}

// Category display config
const CATEGORY_CONFIG: Record<ReportTemplateCategory, { label: string; color: string }> = {
  Incident: { label: 'Incident', color: 'text-red-400' },
  Performance: { label: 'Performance', color: 'text-blue-400' },
  Security: { label: 'Security', color: 'text-amber-400' },
  Audit: { label: 'Audit', color: 'text-purple-400' },
};

export const TopologyReportTemplates: React.FC<TopologyReportTemplatesProps> = ({
  topologyId,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Use binding hook
  const {
    boundTemplates,
    boundLoading,
    boundError,
    boundTotal,
    boundPage,
    boundTotalPages,
    setBoundPage,
    unboundTemplates,
    unboundLoading,
    unboundError,
    unboundTotal,
    unboundPage,
    unboundTotalPages,
    setUnboundPage,
    bind,
    unbind,
    binding,
    bindError,
  } = useTopologyReportTemplates({
    topologyId,
    keyword: searchKeyword || undefined,
  });

  // Bind single template
  const handleBindTemplate = useCallback(async (templateId: number) => {
    await bind([templateId]);
  }, [bind]);

  // Unbind single template
  const handleUnbindTemplate = useCallback(async (templateId: number) => {
    await unbind([templateId]);
  }, [unbind]);

  // Bind all unbound templates
  const handleBindAll = useCallback(async () => {
    const ids = unboundTemplates.map(t => t.id);
    await bind(ids);
  }, [unboundTemplates, bind]);

  // Clear all bound templates
  const handleClearAll = useCallback(async () => {
    const ids = boundTemplates.map(t => t.id);
    await unbind(ids);
  }, [boundTemplates, unbind]);

  // Filter templates by search (client-side filter for display)
  const filteredUnbound = useMemo(() => {
    if (!searchKeyword.trim()) return unboundTemplates;
    const kw = searchKeyword.toLowerCase();
    return unboundTemplates.filter(t =>
      t.name.toLowerCase().includes(kw) ||
      t.description?.toLowerCase().includes(kw)
    );
  }, [unboundTemplates, searchKeyword]);

  const filteredBound = useMemo(() => {
    if (!searchKeyword.trim()) return boundTemplates;
    const kw = searchKeyword.toLowerCase();
    return boundTemplates.filter(t =>
      t.name.toLowerCase().includes(kw) ||
      t.description?.toLowerCase().includes(kw)
    );
  }, [boundTemplates, searchKeyword]);

  // Group templates by category
  const groupByCategory = (templates: ReportTemplateDTO[]) => {
    const groups = new Map<ReportTemplateCategory, ReportTemplateDTO[]>();
    templates.forEach(template => {
      const cat = template.category;
      const existing = groups.get(cat);
      if (existing) {
        existing.push(template);
      } else {
        groups.set(cat, [template]);
      }
    });
    return groups;
  };

  const unboundByCategory = useMemo(() => groupByCategory(filteredUnbound), [filteredUnbound]);
  const boundByCategory = useMemo(() => groupByCategory(filteredBound), [filteredBound]);

  const error = boundError || unboundError || bindError;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">Report Templates</h2>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-800 rounded-lg">
            <FileText size={12} className="text-cyan-400" />
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
            placeholder="Search templates..."
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
        {/* Left Panel: Available Templates (3 columns) */}
        <div className="col-span-3 flex flex-col min-h-0 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="shrink-0 px-4 py-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Available Templates
              </span>
              <span className="text-xs text-slate-500">
                ({filteredUnbound.length})
              </span>
            </div>
            {filteredUnbound.length > 0 && (
              <button
                onClick={handleBindAll}
                disabled={binding}
                className="px-2 py-1 text-[10px] font-bold text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors disabled:opacity-50"
              >
                Bind All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-3">
            {unboundLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="text-cyan-400 animate-spin" />
              </div>
            ) : unboundByCategory.size === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox size={32} className="text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">No available templates</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {Array.from(unboundByCategory.entries()).map(([category, templates]) => (
                  <CategoryCard
                    key={category}
                    category={category}
                    templates={templates}
                    isExpanded={expandedCategories.has(category)}
                    onToggle={(cat) => setExpandedCategories(prev => {
                      const next = new Set(prev);
                      if (next.has(cat)) next.delete(cat);
                      else next.add(cat);
                      return next;
                    })}
                    onBindTemplate={handleBindTemplate}
                    disabled={binding}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination for Available Templates */}
          {unboundTotalPages > 1 && (
            <div className="shrink-0 px-4 py-2 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                {unboundTotal} templates
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setUnboundPage(unboundPage - 1)}
                  disabled={unboundPage <= 1 || unboundLoading}
                  className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} className="text-slate-400" />
                </button>
                <span className="text-[10px] text-slate-400 px-2">
                  {unboundPage} / {unboundTotalPages}
                </span>
                <button
                  onClick={() => setUnboundPage(unboundPage + 1)}
                  disabled={unboundPage >= unboundTotalPages || unboundLoading}
                  className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Bound Templates (1 column) */}
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
            {boundLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="text-cyan-400 animate-spin" />
              </div>
            ) : boundByCategory.size === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <Inbox size={28} className="text-slate-700 mb-2" />
                <p className="text-[11px] text-slate-500 font-medium">No templates bound</p>
                <p className="text-[10px] text-slate-600 mt-1">
                  Click + to bind templates
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from(boundByCategory.entries()).map(([category, templates]) => (
                  <BoundCategoryCard
                    key={category}
                    category={category}
                    templates={templates}
                    onUnbindTemplate={handleUnbindTemplate}
                    disabled={binding}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination for Bound Templates */}
          {boundTotalPages > 1 && (
            <div className="shrink-0 px-3 py-2 border-t border-slate-800 bg-slate-900/50 flex items-center justify-center gap-1">
              <button
                onClick={() => setBoundPage(boundPage - 1)}
                disabled={boundPage <= 1 || boundLoading}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={12} className="text-slate-400" />
              </button>
              <span className="text-[9px] text-slate-500 px-1">
                {boundPage}/{boundTotalPages}
              </span>
              <button
                onClick={() => setBoundPage(boundPage + 1)}
                disabled={boundPage >= boundTotalPages || boundLoading}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={12} className="text-slate-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Category Card for Available Templates
interface CategoryCardProps {
  category: ReportTemplateCategory;
  templates: ReportTemplateDTO[];
  isExpanded: boolean;
  onToggle: (category: ReportTemplateCategory) => void;
  onBindTemplate: (templateId: number) => void;
  disabled?: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  templates,
  isExpanded,
  onToggle,
  onBindTemplate,
  disabled,
}) => {
  const config = CATEGORY_CONFIG[category];

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${
      isExpanded
        ? 'border-cyan-500/30 bg-slate-900/80'
        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
    }`}>
      <button
        onClick={() => onToggle(category)}
        className="w-full px-2.5 py-2 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <FolderOpen size={12} className={isExpanded ? 'text-cyan-400' : 'text-slate-500'} />
          <span className={`text-[11px] font-bold truncate ${isExpanded ? 'text-cyan-300' : config.color}`}>
            {config.label}
          </span>
        </div>
        <span className="shrink-0 px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[9px] font-bold rounded">
          {templates.length}
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-800/50 max-h-48 overflow-auto">
          {templates.map(template => (
            <div
              key={template.id}
              className="group flex items-center justify-between px-2.5 py-1.5 border-t border-slate-800/30 first:border-t-0 hover:bg-slate-800/30"
            >
              <div className="flex-1 min-w-0 mr-2">
                <div className="flex items-center gap-1.5">
                  <FileText size={10} className="shrink-0 text-slate-600" />
                  <span className="text-[10px] text-slate-400 truncate">
                    {template.name}
                  </span>
                </div>
                {template.description && (
                  <p className="text-[9px] text-slate-600 truncate mt-0.5 pl-4">
                    {template.description}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBindTemplate(template.id);
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
  category: ReportTemplateCategory;
  templates: ReportTemplateDTO[];
  onUnbindTemplate: (templateId: number) => void;
  disabled?: boolean;
}

const BoundCategoryCard: React.FC<BoundCategoryCardProps> = ({
  category,
  templates,
  onUnbindTemplate,
  disabled,
}) => {
  const config = CATEGORY_CONFIG[category];

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
      <div className="px-2.5 py-2 flex items-center justify-between bg-slate-900/50 border-b border-slate-800/50">
        <div className="flex items-center gap-1.5 min-w-0">
          <FolderOpen size={12} className="text-cyan-400" />
          <span className={`text-[11px] font-bold truncate ${config.color}`}>
            {config.label}
          </span>
          <span className="text-[9px] text-slate-500">({templates.length})</span>
        </div>
      </div>

      <div className="max-h-40 overflow-auto">
        {templates.map(template => (
          <div
            key={template.id}
            className="group flex items-center justify-between px-2.5 py-1.5 border-t border-slate-800/30 first:border-t-0 hover:bg-slate-800/30"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <FileText size={10} className="shrink-0 text-cyan-500" />
              <span className="text-[10px] text-slate-300 truncate">
                {template.name}
              </span>
            </div>
            <button
              onClick={() => onUnbindTemplate(template.id)}
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

export default TopologyReportTemplates;
