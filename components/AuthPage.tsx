
import React, { useState } from 'react';
import {
  Brain,
  Mail,
  Lock,
  User,
  ArrowRight,
  Github,
  Chrome,
  AlertCircle
} from 'lucide-react';

export interface UserInfo {
  email: string;
  name: string;
  avatar?: string;
  loginTime: number;
}

interface AuthPageProps {
  onLogin: (user: UserInfo) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API Call
    setTimeout(() => {
      setIsLoading(false);

      // Basic Mock Validation
      if (!email || !password) {
        setError('Please fill in all required fields.');
        return;
      }

      if (mode === 'register' && !name) {
        setError('Please enter your full name.');
        return;
      }

      // Success - 创建用户信息并回调
      const userInfo: UserInfo = {
        email,
        name: name || email.split('@')[0], // 如果没有名字，使用邮箱前缀
        loginTime: Date.now()
      };
      onLogin(userInfo);
    }, 1500);
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setError('');
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-slate-950 z-0"></div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="p-8 pb-6 text-center border-b border-slate-800/50">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
                 <Brain size={32} className="text-cyan-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1"><span className="text-white">Entropy</span><span className="text-cyan-400">OPStack</span></h1>
            <p className="text-sm text-slate-400">Hierarchical Multi-Agent System</p>
          </div>

          {/* Body */}
          <div className="p-8 pt-6">
            <h2 className="text-xl font-bold text-white mb-6">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-2 text-sm text-red-400 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-slate-500" size={18} />
                    <input 
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-slate-500" size={18} />
                  <input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
                  {mode === 'login' && (
                    <button type="button" className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors">Forgot password?</button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-slate-500" size={18} />
                  <input 
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-cyan-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px bg-slate-800 flex-1"></div>
              <span className="text-xs text-slate-500 font-mono">OR CONTINUE WITH</span>
              <div className="h-px bg-slate-800 flex-1"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 py-2 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-sm font-medium">
                <Github size={18} /> GitHub
              </button>
              <button className="flex items-center justify-center gap-2 py-2 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-sm font-medium">
                <Chrome size={18} /> Google
              </button>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-center">
             <p className="text-sm text-slate-400">
               {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
               <button 
                 onClick={toggleMode}
                 className="ml-2 text-cyan-500 hover:text-cyan-400 font-bold hover:underline transition-all"
               >
                 {mode === 'login' ? 'Sign up' : 'Log in'}
               </button>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;