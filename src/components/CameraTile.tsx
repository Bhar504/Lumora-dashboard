import { useEffect, useRef, useState } from 'react';
import { Video, Circle, AlertTriangle, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Camera {
  id: string;
  name: string;
  source_type: string;
  is_active: boolean;
  stream_url?: string;
}

interface CameraTileProps {
  camera: Camera;
  onDelete: () => void;
  isDark: boolean;
  isOverlay?: boolean;
}

interface LocalDetection {
  class: string;
  confidence: number;
  bbox: number[];
}

export function CameraTileContent({
  camera,
  onDelete,
  isDark,
  isOverlay = false,
  dragAttributes,
  dragListeners,
  style,
  setNodeRef,
}: CameraTileProps & {
  dragAttributes?: any;
  dragListeners?: any;
  style?: React.CSSProperties;
  setNodeRef?: (node: HTMLElement | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localDetections, setLocalDetections] = useState<LocalDetection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Start webcam if source is 'webcam'
  useEffect(() => {
    if (camera.source_type !== 'webcam' || !camera.is_active) return;

    let stream: MediaStream | null = null;

    const startWebcam = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: camera.stream_url
            ? { deviceId: { exact: camera.stream_url } }
            : true
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError('Failed to access webcam');
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [camera.source_type, camera.is_active, camera.stream_url]);

  // Inference loop
  useEffect(() => {
    if (!isStreaming || !videoRef.current || !canvasRef.current) return;

    const intervalId = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context || video.readyState !== 4) return;

      // Draw video frame to canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');

        try {
          const response = await fetch('http://localhost:8000/detect', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            // Update local detections instead of replacing the image
            setLocalDetections(data.detections);
          }
        } catch (err) {
          console.error('Inference error:', err);
        }
      }, 'image/jpeg', 0.8);

    }, 500); // Run every 500ms

    return () => clearInterval(intervalId);
  }, [isStreaming]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragAttributes}
      {...dragListeners}
      className={`relative rounded-xl overflow-hidden aspect-video transition-all duration-300 ${isDark
        ? 'bg-slate-900 border border-slate-700'
        : 'bg-slate-100 border border-slate-300'
        } ${isOverlay ? 'shadow-2xl scale-105 border-indigo-500 cursor-grabbing' : 'hover:border-indigo-500 hover:shadow-xl cursor-grab'} group`}
    >
      {/* Video Feed (Visible) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${!isStreaming || isOverlay ? 'hidden' : ''}`}
      />

      {/* Canvas for Capture (Hidden) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Placeholder / Error State */}
      {(!isStreaming || isOverlay) && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-200 to-slate-300'
            }`}
        >
          <div className="text-center">
            {error && !isOverlay ? (
              <>
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-500" />
                <p className="text-sm font-medium text-red-500">{error}</p>
              </>
            ) : (
              <>
                <Video className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-500'}`} />
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {camera.name}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Detection Overlays */}
      {localDetections.map((det, idx) => (
        <div key={idx} className="absolute inset-0 pointer-events-none">
          {/* Bounding Box */}
          <div
            style={{
              position: 'absolute',
              left: `${(det.bbox[0] / (videoRef.current?.videoWidth || 1)) * 100}%`,
              top: `${(det.bbox[1] / (videoRef.current?.videoHeight || 1)) * 100}%`,
              width: `${((det.bbox[2] - det.bbox[0]) / (videoRef.current?.videoWidth || 1)) * 100}%`,
              height: `${((det.bbox[3] - det.bbox[1]) / (videoRef.current?.videoHeight || 1)) * 100}%`,
              border: '2px solid #EF4444',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
            }}
          />
          {/* Label */}
          <div
            style={{
              position: 'absolute',
              left: `${(det.bbox[0] / (videoRef.current?.videoWidth || 1)) * 100}%`,
              top: `${(det.bbox[1] / (videoRef.current?.videoHeight || 1)) * 100}%`,
              transform: 'translateY(-100%)',
            }}
            className="bg-red-600 text-white text-xs px-1 rounded-t"
          >
            {det.class} {(det.confidence * 100).toFixed(0)}%
          </div>
        </div>
      ))}

      {/* Overlays (Status, etc) */}
      <div className="absolute top-3 left-3 flex items-center space-x-2 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm z-10">
        <Circle
          className={`w-3 h-3 fill-current ${camera.is_active ? 'text-green-400' : 'text-slate-400'
            }`}
        />
        <span className="text-xs font-semibold text-white">
          {camera.is_active ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Camera Name Badge */}
      <div className="absolute bottom-3 left-3 bg-black/50 px-2 py-1 rounded text-xs font-medium text-white backdrop-blur-sm z-10">
        {camera.name}
      </div>

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('Are you sure you want to remove this camera?')) {
            onDelete();
          }
        }}
        className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-red-600 text-white rounded-lg transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100 z-20"
        title="Remove Camera"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function CameraTile(props: CameraTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.camera.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <CameraTileContent
      {...props}
      dragAttributes={attributes}
      dragListeners={listeners}
      setNodeRef={setNodeRef}
      style={style}
    />
  );
}
