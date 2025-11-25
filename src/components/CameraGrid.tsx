import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import CameraTile, { CameraTileContent } from './CameraTile';
import { Detection } from '../hooks/useDetectionContext';

interface Camera {
  id: string;
  name: string;
  source_type: string;
  is_active: boolean;
  position?: number;
}

interface CameraGridProps {
  cameras: Camera[];
  detections: Detection[];
  onAddCamera: () => void;
  onDeleteCamera: (id: string) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  isDark: boolean;
}

export default function CameraGrid({
  cameras,
  detections,
  onAddCamera,
  onDeleteCamera,
  onReorder,
  isDark,
}: CameraGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const gridLayout = useMemo(() => {
    const count = cameras.length;
    if (count === 0) return 'grid-cols-1';
    if (count === 1) return 'grid-cols-1 lg:grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
    if (count <= 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3';
  }, [cameras.length]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = cameras.findIndex((c) => c.id === active.id);
      const newIndex = cameras.findIndex((c) => c.id === over.id);
      onReorder(oldIndex, newIndex);
    }
    setActiveId(null);
  }

  const activeCamera = useMemo(() =>
    cameras.find((c) => c.id === activeId),
    [activeId, cameras]
  );

  if (cameras.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center min-h-[400px] rounded-xl border-2 border-dashed ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-300 bg-slate-100'
          }`}
      >
        <div className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <h3 className="text-xl font-semibold mb-2">No Cameras Connected</h3>
          <p className="mb-4">Add your first camera to get started</p>
        </div>
        <button
          onClick={onAddCamera}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/50"
        >
          Add First Camera
        </button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={cameras.map((c) => c.id)}
        strategy={rectSortingStrategy}
      >
        <div className={`grid ${gridLayout} gap-4 auto-rows-max`}>
          {cameras.map((camera) => (
            <CameraTile
              key={camera.id}
              camera={camera}
              onDelete={() => onDeleteCamera(camera.id)}
              isDark={isDark}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeCamera ? (
          <CameraTileContent
            camera={activeCamera}
            onDelete={() => { }}
            isDark={isDark}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
