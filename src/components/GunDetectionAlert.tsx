import { AlertTriangle } from 'lucide-react';

interface GunDetectionAlertProps {
  show: boolean;
  confidence: number;
}

export default function GunDetectionAlert({
  show,
  confidence,
}: GunDetectionAlertProps) {
  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="relative h-20 bg-gradient-to-r from-red-600 via-red-700 to-red-600 animate-pulse flex items-center justify-center gap-4 shadow-2xl shadow-red-600/50">
        <AlertTriangle className="w-8 h-8 text-white animate-bounce" />
        <div>
          <div className="text-white text-center">
            <p className="text-2xl font-black tracking-wider">
              🚨 GUN DETECTED 🚨
            </p>
            <p className="text-sm font-semibold opacity-90 mt-1">
              Confidence: {confidence.toFixed(0)}% • System Armed
            </p>
          </div>
        </div>
        <AlertTriangle className="w-8 h-8 text-white animate-bounce" />
      </div>
    </div>
  );
}
