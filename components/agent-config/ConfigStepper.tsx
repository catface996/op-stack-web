/**
 * ConfigStepper Component
 *
 * Three-stage stepper navigation for agent configuration
 * Feature: 013-agent-config-page
 */

import React from 'react';
import { Settings, FileText, Wrench, Check } from 'lucide-react';

export type ConfigStage = 'basicInfo' | 'promptTemplate' | 'tools';

interface StageConfig {
  key: ConfigStage;
  label: string;
  icon: React.ElementType;
}

const STAGES: StageConfig[] = [
  { key: 'basicInfo', label: 'Basic Info', icon: Settings },
  { key: 'promptTemplate', label: 'Prompt Template', icon: FileText },
  { key: 'tools', label: 'Tools', icon: Wrench },
];

interface ConfigStepperProps {
  currentStage: ConfigStage;
  completedStages: Set<ConfigStage>;
  onStageClick: (stage: ConfigStage) => void;
  disabled?: boolean;
}

export const ConfigStepper: React.FC<ConfigStepperProps> = ({
  currentStage,
  completedStages,
  onStageClick,
  disabled = false,
}) => {
  const getStageIndex = (stage: ConfigStage): number => {
    return STAGES.findIndex(s => s.key === stage);
  };

  const currentIndex = getStageIndex(currentStage);

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {STAGES.map((stage, index) => {
        const isActive = stage.key === currentStage;
        const isCompleted = completedStages.has(stage.key);
        const isPending = !isActive && !isCompleted;
        const Icon = stage.icon;

        return (
          <React.Fragment key={stage.key}>
            {/* Stage Button */}
            <button
              onClick={() => !disabled && onStageClick(stage.key)}
              disabled={disabled}
              className={`
                relative flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                ${isActive
                  ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-900/30'
                  : isCompleted
                    ? 'bg-green-950/30 border-green-500/30 text-green-400 hover:bg-green-950/50'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                }
              `}
            >
              {/* Icon with completion indicator */}
              <div className={`
                relative p-1.5 rounded-lg
                ${isActive
                  ? 'bg-cyan-500/30'
                  : isCompleted
                    ? 'bg-green-500/20'
                    : 'bg-slate-800'
                }
              `}>
                {isCompleted && !isActive ? (
                  <Check size={16} className="text-green-400" />
                ) : (
                  <Icon size={16} />
                )}
              </div>

              {/* Label */}
              <div className="flex flex-col items-start">
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                  Step {index + 1}
                </span>
                <span className="text-xs font-bold">
                  {stage.label}
                </span>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-400 rounded-full" />
              )}
            </button>

            {/* Connector Line */}
            {index < STAGES.length - 1 && (
              <div className={`
                w-8 h-0.5 rounded-full transition-colors
                ${index < currentIndex || completedStages.has(STAGES[index + 1].key)
                  ? 'bg-green-500/50'
                  : 'bg-slate-800'
                }
              `} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ConfigStepper;
