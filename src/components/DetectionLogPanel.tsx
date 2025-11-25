import { Download, Trash2, Clock } from 'lucide-react';
import { Detection } from '../hooks/useDetectionContext';

interface DetectionLogPanelProps {
  detections: Detection[];
  onExport: (detectionId: string) => void;
  onDelete: (detectionId: string) => void;
  isDark: boolean;
}

export default function DetectionLogPanel({
  detections,
  onExport,
  onDelete,
  isDark,
}: DetectionLogPanelProps) {
  return (
    <div
      className={`rounded-2xl p-6 h-full flex flex-col ${
        isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'
      }`}
    >
      <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        Recent Detections
      </h3>

      <div className="flex-1 overflow-y-auto space-y-3">
        {detections.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-40 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <Clock className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No detections yet</p>
          </div>
        ) : (
          detections.map((detection) => (
            <div
              key={detection.id}
              className={`rounded-lg p-4 transition ${
                isDark
                  ? 'bg-slate-900/50 hover:bg-slate-900'
                  : 'bg-white hover:bg-slate-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {detection.camera_name}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {new Date(detection.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded mb-2">
                    {detection.confidence.toFixed(0)}%
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    confidence
                  </p>
                </div>
              </div>

              {/* Thumbnail Preview */}
              {detection.frame_data && (
                <div className={`mt-3 rounded overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'} h-24`}>
                  <img
                    src={detection.frame_data}
                    alt="Detection"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onExport(detection.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded transition"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
                <button
                  onClick={() => onDelete(detection.id)}
                  className={`px-3 py-2 rounded transition ${
                    isDark
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
