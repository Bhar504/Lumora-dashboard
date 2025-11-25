import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, SystemState, ActivityLog } from '../lib/supabase';
import { Shield, ShieldAlert, ShieldCheck, LogOut, Activity, AlertTriangle } from 'lucide-react';
import ControlPanel from './ControlPanel';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemState();
    loadActivityLog();

    const channel = supabase
      .channel('system-state-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_state',
        },
        (payload) => {
          setSystemState(payload.new as SystemState);
        }
      )
      .subscribe();

    const activityChannel = supabase
      .channel('activity-log-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
        },
        () => {
          loadActivityLog();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(activityChannel);
    };
  }, []);

  const loadSystemState = async () => {
    try {
      const { data, error } = await supabase
        .from('system_state')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      setSystemState(data);
    } catch (error) {
      console.error('Error loading system state:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLog = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivityLog(data || []);
    } catch (error) {
      console.error('Error loading activity log:', error);
    }
  };

  const getStatusConfig = (status: string | undefined) => {
    switch (status) {
      case 'armed':
        return {
          color: 'bg-blue-600',
          text: 'ARMED',
          icon: ShieldCheck,
          bgGradient: 'from-blue-900 via-blue-800 to-slate-900',
          glow: 'shadow-blue-500/50',
        };
      case 'alert':
        return {
          color: 'bg-red-600',
          text: 'ALERT',
          icon: ShieldAlert,
          bgGradient: 'from-red-900 via-red-800 to-slate-900',
          glow: 'shadow-red-500/50',
        };
      default:
        return {
          color: 'bg-green-600',
          text: 'DISARMED',
          icon: Shield,
          bgGradient: 'from-green-900 via-green-800 to-slate-900',
          glow: 'shadow-green-500/50',
        };
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(systemState?.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${statusConfig.bgGradient} transition-all duration-1000`}>
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className={`${statusConfig.color} p-3 rounded-full ${statusConfig.glow} shadow-2xl`}>
              <StatusIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Security System</h1>
              <p className="text-slate-400 text-sm">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className={`${statusConfig.color} ${statusConfig.glow} rounded-2xl shadow-2xl p-12 text-center`}>
            <StatusIcon className="w-24 h-24 text-white mx-auto mb-6 animate-pulse" />
            <h2 className="text-5xl font-bold text-white mb-2">{statusConfig.text}</h2>
            <p className="text-white/80 text-lg">
              {systemState?.last_updated
                ? new Date(systemState.last_updated).toLocaleString()
                : 'Unknown'}
            </p>
          </div>

          <ControlPanel currentStatus={systemState?.status} onUpdate={loadSystemState} />
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Activity className="w-6 h-6 text-white" />
            <h3 className="text-2xl font-bold text-white">Activity Log</h3>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activityLog.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No activity recorded yet</p>
            ) : (
              activityLog.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-700/50 rounded-lg p-4 flex items-start space-x-3 hover:bg-slate-700 transition"
                >
                  <div className="flex-shrink-0 mt-1">
                    {log.event_type === 'breach' ? (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    ) : (
                      <Activity className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium capitalize">{log.event_type}</p>
                    <p className="text-slate-400 text-sm">
                      {log.status_before && log.status_after
                        ? `${log.status_before} → ${log.status_after}`
                        : log.event_type}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
