import { useState, useCallback, useEffect } from 'react';

export interface Detection {
  id: string;
  camera_id: string;
  confidence: number;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  frame_data: string;
  created_at: string;
  camera_name: string;
}

interface DetectionAlert {
  camera_id: string;
  confidence: number;
  timestamp: number;
}

export function useDetectionContext() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<DetectionAlert[]>([]);

  const addDetection = useCallback((detection: Detection, threshold: number) => {
    setDetections((prev) => [detection, ...prev].slice(0, 100));

    if (detection.confidence >= threshold) {
      setActiveAlerts((prev) => [
        {
          camera_id: detection.camera_id,
          confidence: detection.confidence,
          timestamp: Date.now(),
        },
        ...prev,
      ]);

      const audio = new Audio(
        'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='
      );
      audio.play().catch(() => {});

      setTimeout(() => {
        setActiveAlerts((prev) =>
          prev.filter((a) => Date.now() - a.timestamp < 5000)
        );
      }, 5000);
    }
  }, []);

  const clearDetection = useCallback((detectionId: string) => {
    setDetections((prev) => prev.filter((d) => d.id !== detectionId));
  }, []);

  const hasActiveAlert = activeAlerts.length > 0;
  const highestConfidence = activeAlerts.length > 0 ? Math.max(...activeAlerts.map((a) => a.confidence)) : 0;

  return {
    detections,
    activeAlerts,
    addDetection,
    clearDetection,
    hasActiveAlert,
    highestConfidence,
  };
}
