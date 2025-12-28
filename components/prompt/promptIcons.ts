/**
 * Prompt Template Icon Utilities
 * 
 * Shared icon mapping for prompt template usage types
 */

import {
  Terminal,
  Bot,
  MessageSquare,
  BarChart3,
  ClipboardList,
  Wand2,
  Brain,
  Code,
  Shield,
  Zap,
  type LucideIcon,
} from 'lucide-react';

// Icon mapping for different usage types (by code or name)
const USAGE_ICON_MAP: Record<string, LucideIcon> = {
  // 实际业务类型 - by code
  FAULT_DIAGNOSIS: Zap,        // 故障诊断
  KNOWLEDGE_QA: Brain,         // 知识问答
  DATA_ANALYSIS: BarChart3,    // 数据分析
  REPORT_GENERATION: ClipboardList, // 报告生成
  CODE_REVIEW: Code,           // 代码审查
  OPS_SUGGESTION: Wand2,       // 运维建议
  DAILY_INSPECTION: ClipboardList, // 日常巡检
  OPERATION_SUGGESTION: Wand2, // 运维建议 (备选code)
  ROUTINE_CHECK: ClipboardList, // 日常巡检 (备选code)
  // 通用类型
  SYSTEM_PROMPT: Bot,
  USER_PROMPT: MessageSquare,
  ANALYSIS: BarChart3,
  REPORTING: ClipboardList,
  GENERATION: Wand2,
  REASONING: Brain,
  CODE: Code,
  SECURITY: Shield,
  AUTOMATION: Zap,
  // 中文名称映射
  '故障诊断': Zap,
  '知识问答': Brain,
  '数据分析': BarChart3,
  '报告生成': ClipboardList,
  '代码审查': Code,
  '运维建议': Wand2,
  '日常巡检': ClipboardList,
};

export const getUsageIcon = (usageCodeOrName: string | null | undefined): LucideIcon => {
  if (!usageCodeOrName) return Terminal;
  // Try exact match first, then uppercase
  return USAGE_ICON_MAP[usageCodeOrName] || USAGE_ICON_MAP[usageCodeOrName.toUpperCase()] || Terminal;
};

// Style for usage type
export interface UsageStyle {
  accent: string;
  text: string;
  bg: string;
  border: string;
}

const USAGE_STYLES: UsageStyle[] = [
  { accent: 'bg-indigo-600', text: 'text-indigo-400', bg: 'bg-indigo-950/30', border: 'border-indigo-500/20' },
  { accent: 'bg-purple-600', text: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-500/20' },
  { accent: 'bg-pink-600', text: 'text-pink-400', bg: 'bg-pink-950/30', border: 'border-pink-500/20' },
  { accent: 'bg-cyan-600', text: 'text-cyan-400', bg: 'bg-cyan-950/30', border: 'border-cyan-500/20' },
  { accent: 'bg-emerald-600', text: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-500/20' },
  { accent: 'bg-amber-600', text: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-500/20' },
];

const DEFAULT_STYLE: UsageStyle = { accent: 'bg-slate-600', text: 'text-slate-400', bg: 'bg-slate-950/30', border: 'border-slate-500/20' };

export const getUsageStyle = (usageName: string | null | undefined): UsageStyle => {
  if (!usageName) return DEFAULT_STYLE;
  const hash = usageName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return USAGE_STYLES[hash % USAGE_STYLES.length];
};
