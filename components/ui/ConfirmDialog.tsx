import React from 'react';
import { AlertTriangle, X, Trash2, CheckCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: Trash2,
          iconColor: 'text-red-400',
          buttonColor: 'bg-red-600 hover:bg-red-500',
          borderColor: 'border-t-red-600'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-400',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-500',
          borderColor: 'border-t-yellow-600'
        };
      case 'info':
        return {
          icon: CheckCircle,
          iconColor: 'text-cyan-400',
          buttonColor: 'bg-cyan-600 hover:bg-cyan-500',
          borderColor: 'border-t-cyan-600'
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-400',
          buttonColor: 'bg-red-600 hover:bg-red-500',
          borderColor: 'border-t-red-600'
        };
    }
  };

  const styles = getTypeStyles();
  const IconComponent = styles.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-t-4 ${styles.borderColor}`}>
        <div className="flex items-center justify-between p-5 bg-slate-950/50 border-b border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
            <IconComponent size={16} className={styles.iconColor} />
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            {message}
          </p>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-6 py-2.5 text-white text-xs font-black tracking-widest rounded-lg shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 ${styles.buttonColor}`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <IconComponent size={16} />
                  {confirmText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;