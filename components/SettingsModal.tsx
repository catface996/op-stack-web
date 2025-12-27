
import React, { useState } from 'react';
import { X, Moon, Sun, Monitor, Globe, Check, Save, Settings } from 'lucide-react';

export interface AppSettings {
  language: 'en' | 'zh';
  theme: 'dark' | 'light' | 'system';
}

interface SettingsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onClose, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50 rounded-t-xl">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 text-slate-300">
                <Settings size={20} />
             </div>
             <div>
                <h3 className="font-bold text-white">System Settings</h3>
                <p className="text-xs text-slate-500">Configure interface preferences</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-8">
            {/* Language Section */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Globe size={14} /> Language
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setFormData({ ...formData, language: 'en' })}
                        className={`
                            relative p-3 rounded-lg border flex items-center justify-center gap-2 transition-all
                            ${formData.language === 'en' 
                                ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]' 
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:border-slate-700'
                            }
                        `}
                    >
                        <span className="font-bold text-sm">English</span>
                        {formData.language === 'en' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400"></div>}
                    </button>

                    <button
                        onClick={() => setFormData({ ...formData, language: 'zh' })}
                        className={`
                            relative p-3 rounded-lg border flex items-center justify-center gap-2 transition-all
                            ${formData.language === 'zh' 
                                ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]' 
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:border-slate-700'
                            }
                        `}
                    >
                        <span className="font-bold text-sm">Chinese</span>
                        {formData.language === 'zh' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400"></div>}
                    </button>
                </div>
            </div>

            {/* Theme Section */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Monitor size={14} /> Appearance
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'system', label: 'System', icon: Monitor },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setFormData({ ...formData, theme: item.id as any })}
                            className={`
                                flex flex-col items-center gap-2 p-3 rounded-lg border transition-all
                                ${formData.theme === item.id 
                                    ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-400' 
                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900 hover:text-slate-300'
                                }
                            `}
                        >
                            <item.icon size={20} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50 rounded-b-xl flex justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
             <button 
                onClick={() => onSave(formData)}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2"
             >
                <Save size={16} /> Save Changes
             </button>
        </div>
      </div>
    </div>
  );
};
