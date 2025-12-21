
import React from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Shield, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  AlertOctagon, 
  Play,
  Clock,
  ArrowRight,
  LayoutGrid
} from 'lucide-react';
import { TopologyNode, Team, DiagnosisSession } from '../types';

interface DashboardProps {
  nodes: TopologyNode[];
  teams: Team[];
  recentSessions: DiagnosisSession[];
  isSimulating: boolean;
  onNavigateToDiagnosis: () => void;
  onLoadSession: (session: DiagnosisSession) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  nodes, 
  teams, 
  recentSessions, 
  isSimulating, 
  onNavigateToDiagnosis,
  onLoadSession
}) => {
  // Aggregate Stats
  const totalNodes = nodes.length;
  const totalTeams = teams.length;
  
  const stats = teams.reduce((acc, team) => {
    // Sum findings from supervisor and members
    // Using Number casting to ensure operands are recognized as numbers for arithmetic safety.
    // Fix: Explicitly cast accumulator as number to prevent TS2362 error.
    const teamWarnings = (Number(team.supervisor.findings?.warnings) || 0) + team.members.reduce((s: number, m) => s + (Number(m.findings?.warnings) || 0), 0);
    const teamCritical = (Number(team.supervisor.findings?.critical) || 0) + team.members.reduce((s: number, m) => s + (Number(m.findings?.critical) || 0), 0);
    
    if (teamCritical > 0) acc.critical++;
    else if (teamWarnings > 0) acc.warning++;
    else acc.healthy++;
    
    return acc;
  }, { healthy: 0, warning: 0, critical: 0 });

  const typeDistribution = nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-y-auto custom-scrollbar">
      {/* Welcome / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <LayoutGrid className="text-cyan-400" /> System Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time infrastructure monitoring and agent operations center.</p>
        </div>
        <button 
          onClick={onNavigateToDiagnosis}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-lg shadow-lg shadow-cyan-900/20 font-bold transition-all transform hover:scale-105"
        >
          {isSimulating ? <Zap className="animate-pulse" /> : <Play />}
          <span>{isSimulating ? 'View Active Mission' : 'Open Command Center'}</span>
        </button>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Server size={64} />
          </div>
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Resources</div>
          <div className="text-3xl font-bold text-white">{totalNodes}</div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
             <Activity size={12} /> {totalTeams} Active Agent Teams
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-green-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-green-500">
            <CheckCircle2 size={64} />
          </div>
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Operational</div>
          <div className="text-3xl font-bold text-green-400">{stats.healthy}</div>
          <div className="text-xs text-green-500/70 mt-2">Systems Nominal</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-yellow-500">
            <AlertTriangle size={64} />
          </div>
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Warnings</div>
          <div className="text-3xl font-bold text-yellow-400">{stats.warning}</div>
          <div className="text-xs text-yellow-500/70 mt-2">Potential optimizations</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-red-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-red-500">
            <AlertOctagon size={64} />
          </div>
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Critical Issues</div>
          <div className="text-3xl font-bold text-red-500">{stats.critical}</div>
          <div className="text-xs text-red-500/70 mt-2">Immediate attention required</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left Col: Resource Status & Distribution */}
        <div className="space-y-6">
           {/* Distribution */}
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                 <Database size={16} className="text-cyan-500" /> Infrastructure Breakdown
              </h3>
              <div className="space-y-3">
                 {Object.entries(typeDistribution).map(([type, count]) => (
                   <div key={type} className="group">
                      <div className="flex justify-between text-xs mb-1">
                         <span className="text-slate-400">{type}</span>
                         <span className="text-slate-200 font-mono">{count}</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                         <div 
                           className={`h-full rounded-full transition-all duration-1000 ${
                              type === 'Database' ? 'bg-purple-500' :
                              type === 'Gateway' ? 'bg-pink-500' :
                              type === 'Cache' ? 'bg-orange-500' : 'bg-blue-500'
                           }`}
                           style={{ width: `${totalNodes > 0 ? (count / totalNodes) * 100 : 0}%` }}
                         ></div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Live Health List */}
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1 flex flex-col">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                 <Activity size={16} className="text-cyan-500" /> Monitoring Status
              </h3>
              <div className="space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                {teams.map(team => {
                   // Calculate total issues for this team by summing supervisor and member findings.
                   // Ensure all values are treated as numbers for arithmetic safety.
                   const supervisorIssues = (Number(team.supervisor.findings?.warnings) || 0) + (Number(team.supervisor.findings?.critical) || 0);
                   const workerIssues = team.members.reduce((sum: number, member) => {
                     const w = Number(member.findings?.warnings) || 0;
                     const c = Number(member.findings?.critical) || 0;
                     return sum + w + c;
                   }, 0);
                   
                   // Summing supervisor and worker issues with explicit type conversion check.
                   const totalIssues = supervisorIssues + workerIssues;
                   const isCrit = (team.supervisor.findings?.critical ?? 0) > 0 || team.members.some(m => (m.findings?.critical ?? 0) > 0);
                   const isWarn = !isCrit && totalIssues > 0;
                   
                   return (
                      <div key={team.id} className="flex items-center justify-between p-2 rounded bg-slate-950/50 border border-slate-800">
                         <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isCrit ? 'bg-red-500 animate-pulse' : isWarn ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                            <span className="text-xs font-medium text-slate-300">{team.name}</span>
                         </div>
                         {totalIssues > 0 ? (
                           <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                             isCrit ? 'border-red-500/30 bg-red-950 text-red-400' : 'border-yellow-500/30 bg-yellow-950 text-yellow-400'
                           }`}>
                             {totalIssues} Issues
                           </span>
                         ) : (
                           <span className="text-[10px] text-slate-600">OK</span>
                         )}
                      </div>
                   );
                })}
              </div>
           </div>
        </div>

        {/* Right Col: Recent Activity / Diagnosis History */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
           <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-cyan-500" /> Recent Operations
           </h3>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar">
              {recentSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                   <Activity size={32} className="opacity-20 mb-2" />
                   <p className="text-sm">No recent diagnosis tasks recorded.</p>
                   <button onClick={onNavigateToDiagnosis} className="mt-4 text-cyan-500 hover:text-cyan-400 text-xs font-bold">
                      Start First Diagnosis
                   </button>
                </div>
              ) : (
                <div className="space-y-3">
                   {recentSessions.slice().reverse().map(session => (
                      <div 
                        key={session.id} 
                        onClick={() => onLoadSession(session)}
                        className="p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/30 hover:bg-slate-900 transition-all cursor-pointer group"
                        title="Load this session in Command Center"
                      >
                         <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                               <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                 session.status === 'Running' ? 'bg-cyan-900/50 text-cyan-400 animate-pulse' : 'bg-slate-800 text-slate-400'
                               }`}>
                                 {session.status}
                               </span>
                               <span className="text-xs text-slate-500 font-mono">
                                  {new Date(session.timestamp).toLocaleTimeString()}
                               </span>
                            </div>
                            <div className="flex gap-2">
                               {session.findings.critical > 0 && (
                                 <span className="flex items-center gap-1 text-[10px] text-red-500 bg-red-950/30 px-1.5 rounded border border-red-900/30">
                                   <AlertOctagon size={10} /> {session.findings.critical}
                                 </span>
                               )}
                               {session.findings.warnings > 0 && (
                                 <span className="flex items-center gap-1 text-[10px] text-yellow-500 bg-yellow-950/30 px-1.5 rounded border border-yellow-900/30">
                                   <AlertTriangle size={10} /> {session.findings.warnings}
                                 </span>
                               )}
                               <ArrowRight size={14} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                            </div>
                         </div>
                         <p className="text-sm text-slate-200 font-medium mb-1 group-hover:text-cyan-200 transition-colors">"{session.query}"</p>
                         <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Shield size={12} /> Scope: <span className="text-slate-400">{session.scope}</span>
                         </div>
                      </div>
                   ))}
                </div>
              )}
           </div>
           
           <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
              <button 
                onClick={onNavigateToDiagnosis}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                 View Full Logs <ArrowRight size={12} />
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
