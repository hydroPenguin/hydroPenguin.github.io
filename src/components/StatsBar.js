import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from 'recharts';
import './StatsBar.css';

const StatsBar = ({ stats }) => {
  const history = stats?.history || [];
  const population = stats?.population ?? 0;
  const food = stats?.food ?? 0;
  const avgGeneration = stats?.avgGeneration ?? 0;
  const maxGeneration = stats?.maxGeneration ?? 0;

  return (
    <div className="stats-bar">
      <div className="stats-brand">
        <span className="brand-mark">HydroPenguin</span>
        <h1>Evolution Lab</h1>
      </div>

      <div className="stats-metrics">
        <div className="metric">
          <span className="metric-label">Creatures</span>
          <strong>{population}</strong>
        </div>
        <div className="metric">
          <span className="metric-label">Food</span>
          <strong>{food}</strong>
        </div>
        <div className="metric">
          <span className="metric-label">Avg gen</span>
          <strong>{avgGeneration.toFixed(1)}</strong>
        </div>
        <div className="metric">
          <span className="metric-label">Max gen</span>
          <strong>{maxGeneration}</strong>
        </div>
      </div>

      <div className="stats-chart" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <defs>
              <linearGradient id="popFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5eead4" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#5eead4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{
                background: 'rgba(11,18,32,0.92)',
                border: '1px solid rgba(148,163,184,0.25)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={() => ''}
              formatter={(value, name) => [
                value,
                name === 'population' ? 'Creatures' : name,
              ]}
            />
            <Area
              type="monotone"
              dataKey="population"
              stroke="#5eead4"
              fill="url(#popFill)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsBar;
