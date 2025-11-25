import { useState, useEffect } from 'react';
import { Moon, Sun, Plus, LogOut } from 'lucide-react';
import { arrayMove } from '@dnd-kit/sortable';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import { useDetectionContext, Detection } from '../hooks/useDetectionContext';
import CameraGrid from './CameraGrid';
import AddCameraModal from './AddCameraModal';
import ArmDisarmTab from './ArmDisarmTab';
import DetectionLogPanel from './DetectionLogPanel';
import GunDetectionAlert from './GunDetectionAlert';

interface Camera {
  id: string;
  name: string;
  source_type: string;
  is_active: boolean;
  position: number;
}

interface SystemSettings {
  id: string;
  is_armed: boolean;
  alert_threshold: number;
  dark_mode: boolean;
}

export default function LumoraDashboard() {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { detections, addDetection, clearDetection, hasActiveAlert, highestConfidence } =
    useDetectionContext();

  const [cameras, setCameras] = useState<Camera[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'control'>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCameras();
    loadSettings();
  }, []);

  const loadCameras = async () => {
    try {
      // Try fetching with sort (requires 'position' column)
      const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .eq('user_id', user?.id)
        .order('position', { ascending: true });

      if (error) throw error;
      setCameras(data || []);
    } catch (error) {
      // Fallback: Fetch without sort if 'position' column is missing
      console.warn('Failed to load sorted cameras, falling back to unsorted:', error);
      try {
        const { data, error: fallbackError } = await supabase
          .from('cameras')
          .select('*')
          .eq('user_id', user?.id);

        if (fallbackError) throw fallbackError;
        setCameras(data || []);
      } catch (finalError) {
        console.error('Error loading cameras:', finalError);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data && user?.id) {
        const { data: newSettings, error: insertError } = await supabase
          .from('system_settings')
          .insert({
            user_id: user.id,
            is_armed: false,
            alert_threshold: 70,
            dark_mode: isDark,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleAddCamera = async (camera: {
    name: string;
    source_type: 'webcam' | 'rtsp' | 'ip_camera' | 'video_upload';
    stream_url?: string;
    username?: string;
    password?: string;
  }) => {
    try {
      const { error } = await supabase.from('cameras').insert({
        user_id: user?.id,
        ...camera,
        is_active: true,
      });

      if (error) throw error;
      loadCameras();
    } catch (error) {
      console.error('Error adding camera:', error);
    }
  };

  const handleArmedChange = async (armed: boolean) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ is_armed: armed })
        .eq('user_id', user?.id);

      if (error) throw error;
      setSettings((prev) => prev ? { ...prev, is_armed: armed } : null);
    } catch (error) {
      console.error('Error updating armed status:', error);
    }
  };

  const handleThresholdChange = async (threshold: number) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ alert_threshold: threshold })
        .eq('user_id', user?.id);

      if (error) throw error;
      setSettings((prev) =>
        prev ? { ...prev, alert_threshold: threshold } : null
      );
    } catch (error) {
      console.error('Error updating threshold:', error);
    }
  };

  const handleDeleteCamera = async (cameraId: string) => {
    try {
      const { error } = await supabase
        .from('cameras')
        .delete()
        .eq('id', cameraId);

      if (error) throw error;
      setCameras((prev) => prev.filter((c) => c.id !== cameraId));
    } catch (error) {
      console.error('Error deleting camera:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteDetection = (detectionId: string) => {
    clearDetection(detectionId);
  };

  const handleExportDetection = (detectionId: string) => {
    const detection = detections.find((d) => d.id === detectionId);
    if (detection?.frame_data) {
      const link = document.createElement('a');
      link.href = detection.frame_data;
      link.download = `detection-${new Date(detection.created_at).getTime()}.png`;
      link.click();
    }
  };

  const handleReorderCameras = async (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return;

    // Optimistic update
    const newCameras = arrayMove(cameras, oldIndex, newIndex);
    setCameras(newCameras);

    // Update positions in database
    try {
      const updates = newCameras.map((camera, index) => ({
        id: camera.id,
        position: index,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('cameras')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating camera order:', error);
      // Don't revert immediately to prevent "snap back" if it's just a transient issue
      // The next page load will sync with DB anyway
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'
          }`}
      >
        <div className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Loading Lumora...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-slate-950' : 'bg-white'
        }`}
    >
      {/* Alert Banner */}
      {hasActiveAlert && (
        <GunDetectionAlert show={hasActiveAlert} confidence={highestConfidence} />
      )}

      {/* Header */}
      <header
        className={`sticky top-0 z-40 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'
          } backdrop-blur-xl border-b transition-colors`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-lg">L</span>
              </div>
              <div>
                <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  LUMORA
                </h1>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Enterprise Security • v1.0 • 99.7% Accuracy
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition ${isDark
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleSignOut}
                className={`p-2 rounded-lg transition ${isDark
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 border-t border-slate-800 pt-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white'
                : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('control')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'control'
                ? 'bg-indigo-600 text-white'
                : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Arm/Disarm
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Camera Feed
              </h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/50"
              >
                <Plus className="w-5 h-5" />
                Add Camera
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Camera Grid */}
              <div className="lg:col-span-3">
                <CameraGrid
                  cameras={cameras}
                  detections={detections}
                  onAddCamera={() => setIsModalOpen(true)}
                  onDeleteCamera={handleDeleteCamera}
                  onReorder={handleReorderCameras}
                  isDark={isDark}
                />
              </div>

              {/* Detection Log */}
              <div className="lg:col-span-1">
                <DetectionLogPanel
                  detections={detections}
                  onExport={handleExportDetection}
                  onDelete={handleDeleteDetection}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>
        ) : (
          <ArmDisarmTab
            isArmed={settings?.is_armed ?? false}
            alertThreshold={settings?.alert_threshold ?? 70}
            onArmedChange={handleArmedChange}
            onThresholdChange={handleThresholdChange}
            isDark={isDark}
          />
        )}
      </main>

      {/* Modal */}
      <AddCameraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddCamera}
        isDark={isDark}
      />
    </div>
  );
}
