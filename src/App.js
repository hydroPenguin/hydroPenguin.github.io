import React, { useCallback, useEffect, useRef, useState } from 'react';
import ControlPanel from './components/ControlPanel';
import StatsBar from './components/StatsBar';
import CreatureInspect from './components/CreatureInspect';
import { SimulationEngine } from './evolution/engine';
import { CanvasRenderer } from './evolution/renderer';
import { DEFAULT_PARAMS } from './evolution/constants';
import './App.css';

const STATS_INTERVAL_MS = 120;
const DRAG_FOOD_MS = 50;

const App = () => {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const rendererRef = useRef(null);
  const paramsRef = useRef({ ...DEFAULT_PARAMS });
  const pointerRef = useRef({
    down: false,
    dragging: false,
    startX: 0,
    startY: 0,
    lastFoodAt: 0,
    moved: false,
  });
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const lastStatsRef = useRef(0);

  const [params, setParams] = useState({ ...DEFAULT_PARAMS });
  const [paused, setPaused] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
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

  const getLocalPoint = useCallback((event) => {
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
    };

    resize();
    syncStats();

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    const frame = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const rawDt = Math.min(32, ts - lastTsRef.current);
      lastTsRef.current = ts;

      engine.tick(rawDt * 0.06);
      const events = engine.consumeEvents();
      if (events.length) renderer.addEvents(events);
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
      engineRef.current = null;
      rendererRef.current = null;
    };
  }, [syncStats]);

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

  const handlePointerDown = useCallback(
    (event) => {
      if (event.button != null && event.button !== 0) return;
      const point = getLocalPoint(event);
      pointerRef.current = {
        down: true,
        dragging: false,
        startX: point.x,
        startY: point.y,
        lastFoodAt: 0,
        moved: false,
      };
    },
    [getLocalPoint]
  );

  const handlePointerMove = useCallback(
    (event) => {
      const engine = engineRef.current;
      if (!engine) return;
      const point = getLocalPoint(event);
      engine.hoverAt(point.x, point.y);

      const pointer = pointerRef.current;
      if (!pointer.down) return;

      const dx = point.x - pointer.startX;
      const dy = point.y - pointer.startY;
      if (!pointer.dragging && dx * dx + dy * dy > 36) {
        pointer.dragging = true;
        pointer.moved = true;
      }

      if (pointer.dragging) {
        const now = performance.now();
        if (now - pointer.lastFoodAt > DRAG_FOOD_MS) {
          pointer.lastFoodAt = now;
          engine.sprinkleFood(point.x, point.y, 2);
        }
        event.preventDefault();
      }
    },
    [getLocalPoint]
  );

  const handlePointerUp = useCallback(
    (event) => {
      const engine = engineRef.current;
      const pointer = pointerRef.current;
      if (!engine || !pointer.down) return;

      const point = getLocalPoint(event);
      if (!pointer.moved) {
        const hit = engine.selectAt(point.x, point.y);
        if (!hit) {
          engine.spawnCreature(point.x, point.y);
          engine.selectedId = null;
        }
        syncStats();
      }

      pointerRef.current.down = false;
      pointerRef.current.dragging = false;
      pointerRef.current.moved = false;
    },
    [getLocalPoint, syncStats]
  );

  const handlePointerLeave = useCallback(() => {
    pointerRef.current.down = false;
    pointerRef.current.dragging = false;
    if (engineRef.current) engineRef.current.hoverId = null;
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
      >
        <canvas ref={canvasRef} className="world-canvas" />
      </div>

      <StatsBar stats={stats} />
      <CreatureInspect creature={selected} onClear={clearSelection} />
      <ControlPanel
        params={params}
        paused={paused}
        dockOpen={dockOpen}
        onToggleDock={() => setDockOpen((open) => !open)}
        onTogglePause={() => setPaused((p) => !p)}
        onReset={handleReset}
        onParamChange={handleParamChange}
      />
    </div>
  );
};

export default App;
