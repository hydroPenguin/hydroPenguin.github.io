import React from 'react';
import './ControlPanel.css';

const SLIDER_HELP = {
  simSpeed: 'How fast the simulation runs. Higher values speed up eating, birth, and death.',
  mutationRate:
    'Chance genes change when a creature reproduces. Higher mutation explores more traits.',
  foodSpawnRate:
    'How quickly new food appears in the world. More food supports larger populations.',
  startingPopulation:
    'Number of creatures created on Reset. Does not change the live run until you reset.',
  zoom: 'Zoom the camera. Scroll wheel or pinch also works. Right-drag to pan.',
};

const ControlField = ({ label, help, children }) => (
  <label className="control-field">
    <span className="control-label">
      {label}
      <span className="control-help" tabIndex={0} aria-label={help}>
        <span className="control-help-mark" aria-hidden="true">
          ?
        </span>
        <span className="control-tooltip" role="tooltip">
          {help}
        </span>
      </span>
    </span>
    {children}
  </label>
);

const ControlPanel = ({
  params,
  paused,
  dockOpen,
  zoom = 1,
  onToggleDock,
  onTogglePause,
  onReset,
  onParamChange,
  onZoomIn,
  onZoomOut,
  onResetView,
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

        <div className="zoom-block">
          <span className="control-label">
            Zoom {(zoom * 100).toFixed(0)}%
            <span className="control-help" tabIndex={0} aria-label={SLIDER_HELP.zoom}>
              <span className="control-help-mark" aria-hidden="true">
                ?
              </span>
              <span className="control-tooltip" role="tooltip">
                {SLIDER_HELP.zoom}
              </span>
            </span>
          </span>
          <div className="zoom-actions">
            <button type="button" className="btn" onClick={onZoomOut} aria-label="Zoom out">
              −
            </button>
            <button type="button" className="btn" onClick={onResetView} aria-label="Reset view">
              1x
            </button>
            <button type="button" className="btn" onClick={onZoomIn} aria-label="Zoom in">
              +
            </button>
          </div>
        </div>

        <ControlField
          label={`Speed ${params.simSpeed.toFixed(1)}x`}
          help={SLIDER_HELP.simSpeed}
        >
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
        </ControlField>

        <ControlField
          label={`Mutation ${(params.mutationRate * 100).toFixed(0)}%`}
          help={SLIDER_HELP.mutationRate}
        >
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
        </ControlField>

        <ControlField
          label={`Food rate ${params.foodSpawnRate}`}
          help={SLIDER_HELP.foodSpawnRate}
        >
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
        </ControlField>

        <ControlField
          label={`Start pop ${params.startingPopulation}`}
          help={SLIDER_HELP.startingPopulation}
        >
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
        </ControlField>

        <p className="dock-hint">
          Click to spawn. Drag to feed. Scroll/pinch to zoom. Right-drag to pan.
        </p>
      </div>
    </aside>
  );
};

export default ControlPanel;
