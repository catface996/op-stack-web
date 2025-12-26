import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

/**
 * 404 Not Found page component
 * Displayed when user navigates to an unmatched route
 */
const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-6 bg-slate-900 border border-slate-800 rounded-xl p-12 max-w-md text-center">
        <div className="p-4 rounded-full bg-amber-950/30 border border-amber-900/30">
          <AlertTriangle className="w-16 h-16 text-amber-500" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
          <p className="text-slate-400 text-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm transition-all"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white text-sm font-bold transition-all"
          >
            <Home size={16} /> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
