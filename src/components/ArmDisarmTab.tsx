import { useState } from 'react';
import { ShieldAlert, Shield } from 'lucide-react';

interface ArmDisarmTabProps {
  isArmed: boolean;
  alertThreshold: number;
  onArmedChange: (armed: boolean) => void;
  onThresholdChange: (threshold: number) => void;
  isDark: boolean;
}

export default function ArmDisarmTab({
  isArmed,
  alertThreshold,
  onArmedChange,
  onThresholdChange,
  isDark,
}: ArmDisarmTabProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    onArmedChange(!isArmed);
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <div className="space-y-8">
      {/* Main Toggle */}
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-8">
          {/* Status Display */}
          <div>
            <h2 className={`text-5xl font-black mb-2 ${isArmed ? 'text-red-500' : 'text-green-500'}`}>
              {isArmed ? 'SYSTEM ARMED' : 'SYSTEM DISARMED'}
            </h2>
            <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isArmed ? 'All detections will trigger alerts' : 'Detections will be logged but no alerts sent'}
            </p>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggle}
            className={`relative mx-auto w-32 h-32 rounded-full transition-all duration-300 ${
              isAnimating ? 'scale-95' : 'scale-100'
            } ${isArmed ? 'bg-gradient-to-br from-red-600 to-red-700' : 'bg-gradient-to-br from-green-600 to-green-700'} shadow-2xl hover:shadow-3xl group cursor-pointer`}
          >
            <div className="absolute inset-0 rounded-full flex items-center justify-center">
              {isArmed ? (
                <ShieldAlert className="w-16 h-16 text-white animate-pulse" />
              ) : (
                <Shield className="w-16 h-16 text-white" />
              )}
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-white/20 group-hover:border-white/40 transition" />
          </button>

          {/* Status Description */}
          <div className={`rounded-lg p-6 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {isArmed
                ? 'Your security system is actively monitoring. Any detections above the confidence threshold will trigger immediate alerts.'
                : 'Your system is in test mode. Detections are logged but alerts are disabled. Perfect for calibration and testing.'}
            </p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className={`rounded-2xl p-8 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Detection Settings
        </h3>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Alert Threshold: <span className="text-indigo-500">{alertThreshold}%</span>
              </label>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Only detections above this confidence will trigger alerts
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={alertThreshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className={`flex justify-between text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>Low (High Sensitivity)</span>
              <span>High (Low Sensitivity)</span>
            </div>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-700">
            <div className={`rounded-lg p-4 ${isDark ? 'bg-slate-900/50' : 'bg-white'}`}>
              <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'} uppercase`}>
                Detection Status
              </p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                All systems operational
              </p>
            </div>
            <div className={`rounded-lg p-4 ${isDark ? 'bg-slate-900/50' : 'bg-white'}`}>
              <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'} uppercase`}>
                Model Accuracy
              </p>
              <p className={`text-lg font-bold text-green-500`}>99.7%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
