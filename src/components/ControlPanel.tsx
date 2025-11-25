import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, ShieldOff, AlertTriangle } from 'lucide-react';

interface ControlPanelProps {
  currentStatus: string | undefined;
  onUpdate: () => void;
}

export default function ControlPanel({ currentStatus, onUpdate }: ControlPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateSystemState = async (newStatus: 'armed' | 'disarmed' | 'alert', eventType: string) => {
    setLoading(true);
    setError('');

    try {
      const { data: currentState, error: fetchError } = await supabase
        .from('system_state')
        .select('*')
        .maybeSingle();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('system_state')
        .update({
          status: newStatus,
          last_updated: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', currentState?.id);

      if (updateError) throw updateError;

      const { error: logError } = await supabase.from('activity_log').insert({
        event_type: eventType,
        status_before: currentState?.status,
        status_after: newStatus,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      if (logError) throw logError;

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update system state');
    } finally {
      setLoading(false);
    }
  };

  const handleArm = () => updateSystemState('armed', 'armed');
  const handleDisarm = () => updateSystemState('disarmed', 'disarmed');
  const handleBreach = () => updateSystemState('alert', 'breach');

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Control Panel</h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={handleArm}
          disabled={loading || currentStatus === 'armed'}
          className="w-full flex items-center justify-center space-x-3 py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/50"
        >
          <ShieldCheck className="w-6 h-6" />
          <span>{currentStatus === 'armed' ? 'System Armed' : 'Arm System'}</span>
        </button>

        <button
          onClick={handleDisarm}
          disabled={loading || currentStatus === 'disarmed'}
          className="w-full flex items-center justify-center space-x-3 py-4 px-6 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/50"
        >
          <ShieldOff className="w-6 h-6" />
          <span>{currentStatus === 'disarmed' ? 'System Disarmed' : 'Disarm System'}</span>
        </button>

        <div className="pt-4 border-t border-slate-700">
          <p className="text-slate-400 text-xs mb-3 text-center">Test & Development Only</p>
          <button
            onClick={handleBreach}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 py-3 px-6 bg-red-600/20 hover:bg-red-600/30 disabled:bg-slate-700 disabled:cursor-not-allowed text-red-400 border border-red-600/50 rounded-xl font-semibold transition-all duration-200"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Simulate Breach</span>
          </button>
        </div>
      </div>

      <div className="mt-6 bg-slate-900/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Current Status</h3>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              currentStatus === 'armed'
                ? 'bg-blue-500 animate-pulse'
                : currentStatus === 'alert'
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-green-500'
            }`}
          />
          <span className="text-white font-medium capitalize">{currentStatus || 'Unknown'}</span>
        </div>
      </div>
    </div>
  );
}
