import React, { useCallback, useEffect, useRef, useState } from 'react';
import ControlPanel from './components/ControlPanel';
import StatsBar from './components/StatsBar';
import CreatureInspect from './components/CreatureInspect';
import { SimulationEngine } from './evolution/engine';
import { CanvasRenderer } from './evolution/renderer';
import {
  DEFAULT_PARAMS,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
} from './evolution/constants';
import './App.css';

const STATS_INTERVAL_MS = 120;
const DRAG_FOOD_MS = 50;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const App = () => {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const rendererRef = useRef(null);
  const paramsRef = useRef({ ...DEFAULT_PARAMS });
  const cameraRef = useRef({ zoom: 1, panX: 0, panY: 0 });
  const pointerRef = useRef({
    down: false,
    dragging: false,
    panning: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastFoodAt: 0,
    moved: false,
    button: 0,
  });
  const pinchRef = useRef({ active: false, distance: 0 });
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const lastStatsRef = useRef(0);

  const [params, setParams] = useState({ ...DEFAULT_PARAMS });
  const [paused, setPaused] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [stats, setStats] = useState({
    population: 0,
    food: 0,
    avgGeneration: 0,
    maxGeneration: 0,
    history: [],
  });
  const [selected, setSelected] = useState(null);

  const syncStats = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const snapshot = engine.getStatsSnapshot();
    setStats({
      population: snapshot.population,
      food: snapshot.food,
      avgGeneration: snapshot.avgGeneration,
      maxGeneration: snapshot.maxGeneration,
      history: snapshot.history,
    });
    setSelected(snapshot.selected);
  }, []);

  const getScreenPoint = useCallback((event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch =
      event.touches?.[0] ||
      event.changedTouches?.[0] ||
      null;
    const clientX = event.clientX ?? touch?.clientX ?? 0;
    const clientY = event.clientY ?? touch?.clientY ?? 0;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const screenToWorld = useCallback((screenX, screenY) => {
    const { zoom: z, panX, panY } = cameraRef.current;
    return {
      x: (screenX - panX) / z,
      y: (screenY - panY) / z,
    };
  }, []);

  const clampCamera = useCallback((cam) => {
    const stage = stageRef.current;
    if (!stage) return cam;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const z = cam.zoom;
    const minPanX = width - width * z - width * 0.25;
    const maxPanX = width * 0.25;
    const minPanY = height - height * z - height * 0.25;
    const maxPanY = height * 0.25;
    return {
      zoom: z,
      panX: clamp(cam.panX, Math.min(minPanX, maxPanX), Math.max(minPanX, maxPanX)),
      panY: clamp(cam.panY, Math.min(minPanY, maxPanY), Math.max(minPanY, maxPanY)),
    };
  }, []);

  const commitCamera = useCallback(
    (next) => {
      const clamped = clampCamera(next);
      cameraRef.current = clamped;
      setZoom(clamped.zoom);
      return clamped;
    },
    [clampCamera]
  );

  const zoomAt = useCallback(
    (screenX, screenY, factor) => {
      const cam = cameraRef.current;
      const worldX = (screenX - cam.panX) / cam.zoom;
      const worldY = (screenY - cam.panY) / cam.zoom;
      const nextZoom = clamp(cam.zoom * factor, ZOOM_MIN, ZOOM_MAX);
      commitCamera({
        zoom: nextZoom,
        panX: screenX - worldX * nextZoom,
        panY: screenY - worldY * nextZoom,
      });
    },
    [commitCamera]
  );

  const resetCamera = useCallback(() => {
    commitCamera({ zoom: 1, panX: 0, panY: 0 });
  }, [commitCamera]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return undefined;

    const engine = new SimulationEngine(
      stage.clientWidth,
      stage.clientHeight,
      paramsRef.current
    );
    const renderer = new CanvasRenderer(canvas);
    engineRef.current = engine;
    rendererRef.current = renderer;

    const resize = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      renderer.resize(width, height);
      engine.setSize(width, height);
      commitCamera(cameraRef.current);
    };

    resize();
    syncStats();

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    const onWheel = (event) => {
      event.preventDefault();
      const point = getScreenPoint(event);
      const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      zoomAt(point.x, point.y, factor);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });

    const frame = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const rawDt = Math.min(32, ts - lastTsRef.current);
      lastTsRef.current = ts;

      engine.tick(rawDt * 0.06);
      const events = engine.consumeEvents();
      if (events.length) renderer.addEvents(events);
      renderer.setCamera(cameraRef.current);
      renderer.render(engine);

      if (ts - lastStatsRef.current > STATS_INTERVAL_MS) {
        lastStatsRef.current = ts;
        syncStats();
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      stage.removeEventListener('wheel', onWheel);
      engineRef.current = null;
      rendererRef.current = null;
    };
  }, [syncStats, commitCamera, getScreenPoint, zoomAt]);

  useEffect(() => {
    paramsRef.current = params;
    engineRef.current?.setParams(params);
  }, [params]);

  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  const handleParamChange = useCallback((partial) => {
    setParams((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleReset = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setParams(paramsRef.current);
    engine.reset(paramsRef.current.startingPopulation);
    setSelected(null);
    syncStats();
  }, [syncStats]);

  const handleZoomIn = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    zoomAt(stage.clientWidth / 2, stage.clientHeight / 2, ZOOM_STEP);
  }, [zoomAt]);

  const handleZoomOut = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    zoomAt(stage.clientWidth / 2, stage.clientHeight / 2, 1 / ZOOM_STEP);
  }, [zoomAt]);

  const touchDistance = (event) => {
    if (!event.touches || event.touches.length < 2) return 0;
    const a = event.touches[0];
    const b = event.touches[1];
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  };

  const touchCenter = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const a = event.touches[0];
    const b = event.touches[1];
    return {
      x: (a.clientX + b.clientX) / 2 - rect.left,
      y: (a.clientY + b.clientY) / 2 - rect.top,
    };
  };

  const handlePointerDown = useCallback(
    (event) => {
      if (event.touches && event.touches.length >= 2) {
        pinchRef.current = {
          active: true,
          distance: touchDistance(event),
        };
        pointerRef.current.down = false;
        return;
      }

      const button = event.button != null ? event.button : 0;
      if (button !== 0 && button !== 1 && button !== 2) return;

      const point = getScreenPoint(event);
      const panning = button === 1 || button === 2;
      pointerRef.current = {
        down: true,
        dragging: false,
        panning,
        startX: point.x,
        startY: point.y,
        lastX: point.x,
        lastY: point.y,
        lastFoodAt: 0,
        moved: false,
        button,
      };
    },
    [getScreenPoint]
  );

  const handlePointerMove = useCallback(
    (event) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (event.touches && event.touches.length >= 2) {
        const distance = touchDistance(event);
        const pinch = pinchRef.current;
        if (pinch.active && pinch.distance > 0) {
          const center = touchCenter(event);
          zoomAt(center.x, center.y, distance / pinch.distance);
          pinchRef.current.distance = distance;
        } else {
          pinchRef.current = { active: true, distance };
        }
        event.preventDefault();
        return;
      }

      const screen = getScreenPoint(event);
      const world = screenToWorld(screen.x, screen.y);
      engine.hoverAt(world.x, world.y);

      const pointer = pointerRef.current;
      if (!pointer.down) return;

      const dx = screen.x - pointer.startX;
      const dy = screen.y - pointer.startY;
      if (!pointer.dragging && dx * dx + dy * dy > 36) {
        pointer.dragging = true;
        pointer.moved = true;
      }

      if (pointer.panning && pointer.dragging) {
        const cam = cameraRef.current;
        commitCamera({
          zoom: cam.zoom,
          panX: cam.panX + (screen.x - pointer.lastX),
          panY: cam.panY + (screen.y - pointer.lastY),
        });
        pointer.lastX = screen.x;
        pointer.lastY = screen.y;
        event.preventDefault();
        return;
      }

      if (pointer.dragging && !pointer.panning) {
        const now = performance.now();
        if (now - pointer.lastFoodAt > DRAG_FOOD_MS) {
          pointer.lastFoodAt = now;
          engine.sprinkleFood(world.x, world.y, 2);
        }
        event.preventDefault();
      }

      pointer.lastX = screen.x;
      pointer.lastY = screen.y;
    },
    [getScreenPoint, screenToWorld, zoomAt, commitCamera]
  );

  const handlePointerUp = useCallback(
    (event) => {
      if (event.touches && event.touches.length >= 2) return;
      pinchRef.current.active = false;

      const engine = engineRef.current;
      const pointer = pointerRef.current;
      if (!engine || !pointer.down) return;

      const screen = getScreenPoint(event);
      const world = screenToWorld(screen.x, screen.y);
      if (!pointer.moved && !pointer.panning) {
        const hit = engine.selectAt(world.x, world.y);
        if (!hit) {
          engine.spawnCreature(world.x, world.y);
          engine.selectedId = null;
        }
        syncStats();
      }

      pointerRef.current.down = false;
      pointerRef.current.dragging = false;
      pointerRef.current.panning = false;
      pointerRef.current.moved = false;
    },
    [getScreenPoint, screenToWorld, syncStats]
  );

  const handlePointerLeave = useCallback(() => {
    pointerRef.current.down = false;
    pointerRef.current.dragging = false;
    pointerRef.current.panning = false;
    pinchRef.current.active = false;
    if (engineRef.current) engineRef.current.hoverId = null;
  }, []);

  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
  }, []);

  const clearSelection = useCallback(() => {
    if (engineRef.current) engineRef.current.selectedId = null;
    setSelected(null);
  }, []);

  return (
    <div className="app-shell">
      <div className="world-glow" aria-hidden="true" />
      <div
        className="stage"
        ref={stageRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerLeave}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onContextMenu={handleContextMenu}
      >
        <canvas ref={canvasRef} className="world-canvas" />
      </div>

      <StatsBar stats={stats} />
      <CreatureInspect creature={selected} onClear={clearSelection} />
      <ControlPanel
        params={params}
        paused={paused}
        dockOpen={dockOpen}
        zoom={zoom}
        onToggleDock={() => setDockOpen((open) => !open)}
        onTogglePause={() => setPaused((p) => !p)}
        onReset={handleReset}
        onParamChange={handleParamChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={resetCamera}
      />
    </div>
  );
};

export default App;
