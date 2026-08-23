import React from 'react';
import './CreatureInspect.css';

const GeneRow = ({ label, value, max, display }) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="gene-row">
      <div className="gene-meta">
        <span>{label}</span>
        <strong>{display}</strong>
      </div>
      <div className="gene-track">
        <div className="gene-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const CreatureInspect = ({ creature, onClear }) => {
  if (!creature) return null;

  const { genes, energy, generation, age, id } = creature;

  return (
    <div className="inspect-panel">
      <div className="inspect-top">
        <div>
          <p className="inspect-kicker">Specimen #{id}</p>
          <h3 style={{ color: `hsl(${genes.hue}, 70%, 65%)` }}>
            Gen {generation}
          </h3>
        </div>
        <button type="button" className="inspect-close" onClick={onClear}>
          Close
        </button>
      </div>

      <GeneRow
        label="Speed"
        value={genes.speed}
        max={3.2}
        display={genes.speed.toFixed(2)}
      />
      <GeneRow
        label="Size"
        value={genes.size}
        max={14}
        display={genes.size.toFixed(1)}
      />
      <GeneRow
        label="Sense"
        value={genes.sense}
        max={120}
        display={genes.sense.toFixed(0)}
      />
      <GeneRow
        label="Metabolism"
        value={genes.metabolism}
        max={0.055}
        display={genes.metabolism.toFixed(3)}
      />

      <div className="inspect-footer">
        <span>Energy {energy.toFixed(0)}</span>
        <span>Age {age.toFixed(0)}</span>
        <span>Hue {genes.hue.toFixed(0)}</span>
      </div>
    </div>
  );
};

export default CreatureInspect;
