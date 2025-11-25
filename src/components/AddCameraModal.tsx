import { useState, useEffect } from 'react';
import { X, Webcam, Wifi, Upload, Zap } from 'lucide-react';

interface AddCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (camera: {
    name: string;
    source_type: 'webcam' | 'rtsp' | 'ip_camera' | 'video_upload';
    stream_url?: string;
    username?: string;
    password?: string;
  }) => void;
  isDark: boolean;
}

type SourceType = 'webcam' | 'rtsp' | 'ip_camera' | 'video_upload';

export default function AddCameraModal({
  isOpen,
  onClose,
  onAdd,
  isDark,
}: AddCameraModalProps) {
  const [step, setStep] = useState<'source' | 'config'>('source');
  const [selectedSource, setSelectedSource] = useState<SourceType | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    stream_url: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    if (isOpen && step === 'config' && selectedSource === 'webcam') {
      loadVideoDevices();
    }
  }, [isOpen, step, selectedSource]);

  const loadVideoDevices = async () => {
    try {
      // Request permission first to get labels
      await navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(videoInputs);

      // Default to first device if none selected
      if (videoInputs.length > 0 && !formData.stream_url) {
        setFormData(prev => ({ ...prev, stream_url: videoInputs[0].deviceId }));
      }
    } catch (error) {
      console.error('Error loading video devices:', error);
    }
  };

  const sourceOptions = [
    {
      id: 'webcam',
      label: 'Webcam',
      description: 'Built-in or USB webcam',
      icon: Webcam,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'rtsp',
      label: 'RTSP/RTMP Stream',
      description: 'Network camera or capture card',
      icon: Zap,
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'ip_camera',
      label: 'IP Camera',
      description: 'ONVIF compatible camera',
      icon: Wifi,
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'video_upload',
      label: 'Video File',
      description: 'Upload pre-recorded video',
      icon: Upload,
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const handleSelectSource = (source: SourceType) => {
    setSelectedSource(source);
    setStep('config');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSource || !formData.name.trim()) return;

    onAdd({
      ...formData,
      source_type: selectedSource,
    });

    setStep('source');
    setSelectedSource(null);
    setFormData({
      name: '',
      stream_url: '',
      username: '',
      password: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div
        className={`rounded-2xl max-w-2xl w-full ${isDark ? 'bg-slate-900' : 'bg-white'
          } shadow-2xl max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
        >
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Add New Camera
          </h2>
          <button
            onClick={onClose}
            className={`p-2 hover:bg-slate-700 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'source' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sourceOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectSource(option.id as SourceType)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 ${isDark
                        ? 'border-slate-700 hover:border-indigo-500 hover:bg-slate-800'
                        : 'border-slate-200 hover:border-indigo-500 hover:bg-slate-50'
                      } group`}
                  >
                    <div className={`bg-gradient-to-br ${option.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {option.label}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Camera Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Front Entrance"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition ${isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                    } focus:outline-none`}
                />
              </div>

              {selectedSource === 'webcam' && (
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Select Device
                  </label>
                  <select
                    value={formData.stream_url}
                    onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition ${isDark
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                      } focus:outline-none`}
                  >
                    {videoDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(selectedSource === 'rtsp' || selectedSource === 'ip_camera') && (
                <>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Stream URL
                    </label>
                    <input
                      type="text"
                      value={formData.stream_url}
                      onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                      placeholder="rtsp://192.168.1.100:554/stream"
                      className={`w-full px-4 py-3 rounded-lg border-2 transition ${isDark
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500'
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                        } focus:outline-none`}
                    />
                  </div>

                  {selectedSource === 'ip_camera' && (
                    <>
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Username
                        </label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="admin"
                          className={`w-full px-4 py-3 rounded-lg border-2 transition ${isDark
                              ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500'
                              : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                            } focus:outline-none`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Password
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••"
                          className={`w-full px-4 py-3 rounded-lg border-2 transition ${isDark
                              ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500'
                              : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                            } focus:outline-none`}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('source')}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                    }`}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/50"
                >
                  Add Camera
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
