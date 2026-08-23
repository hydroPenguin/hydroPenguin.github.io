import React from 'react';
import './ControlPanel.css';

const ControlPanel = ({
  params,
  paused,
  dockOpen,
  onToggleDock,
  onTogglePause,
  onReset,
  onParamChange,
}) => {
  return (
    <aside className={`control-dock ${dockOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className="dock-toggle"
        onClick={onToggleDock}
        aria-expanded={dockOpen}
      >
        {dockOpen ? 'Hide controls' : 'Controls'}
      </button>

      <div className="dock-body">
        <header className="dock-header">
          <p className="dock-kicker">Play</p>
          <h2>Evolve</h2>
        </header>

        <div className="dock-actions">
          <button type="button" className="btn primary" onClick={onTogglePause}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" className="btn" onClick={onReset}>
            Reset
          </button>
        </div>

        <label className="control-field">
          <span>Speed {params.simSpeed.toFixed(1)}x</span>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={params.simSpeed}
            onChange={(e) =>
              onParamChange({ simSpeed: Number(e.target.value) })
            }
          />
        </label>

        <label className="control-field">
          <span>Mutation {(params.mutationRate * 100).toFixed(0)}%</span>
          <input
            type="range"
            min="0"
            max="0.45"
            step="0.01"
            value={params.mutationRate}
            onChange={(e) =>
              onParamChange({ mutationRate: Number(e.target.value) })
            }
          />
        </label>

        <label className="control-field">
          <span>Food rate {params.foodSpawnRate}</span>
          <input
            type="range"
            min="2"
            max="40"
            step="1"
            value={params.foodSpawnRate}
            onChange={(e) =>
              onParamChange({ foodSpawnRate: Number(e.target.value) })
            }
          />
        </label>

        <label className="control-field">
          <span>Start pop {params.startingPopulation}</span>
          <input
            type="range"
            min="10"
            max="120"
            step="1"
            value={params.startingPopulation}
            onChange={(e) =>
              onParamChange({ startingPopulation: Number(e.target.value) })
            }
          />
        </label>

        <p className="dock-hint">
          Click to spawn. Drag to sprinkle food. Tap a creature to inspect.
        </p>
      </div>
    </aside>
  );
};

export default ControlPanel;
