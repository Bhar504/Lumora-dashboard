import React, { useState, useRef } from 'react';
import { Upload, Camera, Loader2 } from 'lucide-react';

interface Detection {
  class: string;
  confidence: number;
  bbox: number[];
}

interface DetectionResult {
  detections: Detection[];
  image: string;
}

export function ObjectDetection() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload and detect
    await detectObjects(file);
  };

  const detectObjects = async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">YOLO11 Object Detection</h2>
        <p className="text-gray-600">Upload an image to detect objects using YOLO11 and OpenCV</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Original/Preview Image */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Original Image</h3>
            <div className="aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative">
              {image ? (
                <img src={image} alt="Original" className="w-full h-full object-contain" />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <Camera className="w-12 h-12 mb-2" />
                  <span>No image selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Result Image */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Detection Result</h3>
            <div className="aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative">
              {loading ? (
                <div className="flex flex-col items-center text-blue-600">
                  <Loader2 className="w-12 h-12 animate-spin mb-2" />
                  <span>Processing...</span>
                </div>
              ) : result ? (
                <img src={result.image} alt="Detection Result" className="w-full h-full object-contain" />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <div className="w-12 h-12 mb-2 border-2 border-gray-300 rounded-lg" />
                  <span>Waiting for result...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detections List */}
        {result && result.detections.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-gray-700 mb-4">Detected Objects ({result.detections.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {result.detections.map((det, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
                  <div className="font-medium text-gray-900 capitalize">{det.class}</div>
                  <div className="text-gray-500">Conf: {(det.confidence * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
