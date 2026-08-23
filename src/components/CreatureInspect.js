import React from 'react';
import './CreatureInspect.css';

const GENE_HELP = {
  speed: 'How fast this creature moves toward food and around the world.',
  size: 'Body radius. Larger creatures are easier to spot and cost more energy to move.',
  sense: 'How far it can detect food. Shown as the dashed ring when selected.',
  metabolism: 'Baseline energy drain. Higher metabolism burns out faster without food.',
  energy: 'Current fuel. Eating raises it; at high energy the creature splits.',
  age: 'How long this specimen has been alive in simulation time.',
  hue: 'Inherited color gene. Mutates over generations and is mostly cosmetic.',
  generation: 'How many ancestor splits separate this creature from the first generation.',
};

const HelpTip = ({ text }) => (
  <span className="inspect-help" tabIndex={0} aria-label={text}>
    <span className="inspect-help-mark" aria-hidden="true">
      ?
    </span>
    <span className="inspect-tooltip" role="tooltip">
      {text}
    </span>
  </span>
);

const GeneRow = ({ label, help, value, max, display }) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="gene-row">
      <div className="gene-meta">
        <span className="gene-label">
          {label}
          <HelpTip text={help} />
        </span>
        <strong>{display}</strong>
      </div>
      <div className="gene-track">
        <div className="gene-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const FooterStat = ({ label, value, help }) => (
  <span className="footer-stat">
    {label} {value}
    <HelpTip text={help} />
  </span>
);

const CreatureInspect = ({ creature, onClear }) => {
  if (!creature) return null;

  const { genes, energy, generation, age, id } = creature;

  return (
    <div className="inspect-panel">
      <div className="inspect-top">
        <div>
          <p className="inspect-kicker">Specimen #{id}</p>
          <h3
            className="inspect-gen"
            style={{ color: `hsl(${genes.hue}, 70%, 65%)` }}
          >
            Gen {generation}
            <HelpTip text={GENE_HELP.generation} />
          </h3>
        </div>
        <button type="button" className="inspect-close" onClick={onClear}>
          Close
        </button>
      </div>

      <GeneRow
        label="Speed"
        help={GENE_HELP.speed}
        value={genes.speed}
        max={3.2}
        display={genes.speed.toFixed(2)}
      />
      <GeneRow
        label="Size"
        help={GENE_HELP.size}
        value={genes.size}
        max={14}
        display={genes.size.toFixed(1)}
      />
      <GeneRow
        label="Sense"
        help={GENE_HELP.sense}
        value={genes.sense}
        max={120}
        display={genes.sense.toFixed(0)}
      />
      <GeneRow
        label="Metabolism"
        help={GENE_HELP.metabolism}
        value={genes.metabolism}
        max={0.055}
        display={genes.metabolism.toFixed(3)}
      />

      <div className="inspect-footer">
        <FooterStat
          label="Energy"
          value={energy.toFixed(0)}
          help={GENE_HELP.energy}
        />
        <FooterStat
          label="Age"
          value={age.toFixed(0)}
          help={GENE_HELP.age}
        />
        <FooterStat
          label="Hue"
          value={genes.hue.toFixed(0)}
          help={GENE_HELP.hue}
        />
      </div>
    </div>
  );
};

export default CreatureInspect;
