import React, { useEffect, useState } from 'react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import './LoanChart.css';

const LoanChart = ({ loanAmount, interestRate, monthlyPayment, payoffTime }) => {
  const [chartWidth, setChartWidth] = useState(800);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Calculate data
  const generateChartData = () => {
    const monthlyRate = interestRate / 100 / 12;
    let balance = loanAmount;
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    let last_month_zero = false;
    const data = [];
    const useMonthlyScale = payoffTime <= 12;

    // Add initial point
    data.push({
      name: useMonthlyScale ? 'Month 0' : 'Year 0',
      balance: balance,
      principalPaid: 0,
      totalInterest: 0
    });

    for (let month = 1; month <= payoffTime; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      
      balance = Math.max(0, balance - principalPayment);
      if (balance !== 0) {
        totalPrincipalPaid += principalPayment;
        totalInterestPaid += interestPayment;
      } else {
        if (last_month_zero) {
          totalPrincipalPaid = 0;
          totalInterestPaid = 0;
        } else {
          last_month_zero = true;
          totalPrincipalPaid += principalPayment;
          totalInterestPaid += interestPayment;
        }
      }

      // Add data point based on scale
      if (useMonthlyScale || month % 12 === 0 || month === payoffTime) {
        data.push({
          name: useMonthlyScale ? `Month ${month}` : `Year ${Math.floor(month / 12)}`,
          balance: Math.round(balance),
          principalPaid: Math.round(totalPrincipalPaid),
          totalInterest: Math.round(totalInterestPaid)
        });
      }
    }

    return data;
  };

  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('.chart-grid');
      if (container) {
        const newWidth = Math.max(container.clientWidth - 40, 400);
        setChartWidth(newWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const data = generateChartData();
  const useMonthlyScale = payoffTime <= 12;

  const chartTheme = {
    background: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#e2e8f0' : '#1e293b',
    grid: isDarkMode ? '#334155' : '#e2e8f0',
    tooltip: {
      background: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      border: isDarkMode ? '#475569' : '#e2e8f0',
      text: isDarkMode ? '#e2e8f0' : '#1e293b'
    }
  };

  return (
    <div className="chart-container" style={{ background: chartTheme.background }}>
      <h3 style={{ color: chartTheme.text }}>Loan Analysis Charts</h3>
      <div className="chart-grid">
        <div className="chart-item">
          <h4 style={{ color: chartTheme.text }}>Principal & Interest</h4>
          <AreaChart
            width={chartWidth}
            height={300}
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis 
              dataKey="name" 
              stroke={chartTheme.text}
              angle={useMonthlyScale ? -45 : 0}
              textAnchor={useMonthlyScale ? "end" : "middle"}
              height={60}
            />
            <YAxis stroke={chartTheme.text} />
            <Tooltip 
              content={<CustomTooltip theme={chartTheme.tooltip} />}
              cursor={{ stroke: chartTheme.grid }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="principalPaid" 
              stackId="1"
              stroke="#4ECDC4"
              fill="#4ECDC4"
              fillOpacity={0.6}
              name="Principal Paid"
            />
            <Area 
              type="monotone" 
              dataKey="totalInterest" 
              stackId="1"
              stroke="#FFD384"
              fill="#FFD384"
              fillOpacity={0.6}
              name="Total Interest"
            />
          </AreaChart>
        </div>
        <div className="chart-item">
          <h4 style={{ color: chartTheme.text }}>Balance Over Time</h4>
          <AreaChart
            width={chartWidth}
            height={300}
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis 
              dataKey="name" 
              stroke={chartTheme.text}
              angle={useMonthlyScale ? -45 : 0}
              textAnchor={useMonthlyScale ? "end" : "middle"}
              height={60}
            />
            <YAxis stroke={chartTheme.text} />
            <Tooltip 
              content={<CustomTooltip theme={chartTheme.tooltip} />}
              cursor={{ stroke: chartTheme.grid }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
              name="Remaining Balance"
            />
          </AreaChart>
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, theme }) => {
  if (!active || !payload) return null;

  return (
    <div className="custom-tooltip" style={{
      background: theme.background,
      border: `1px solid ${theme.border}`,
      color: theme.text
    }}>
      <p className="tooltip-label">{label}</p>
      {payload.map((item, index) => (
        <p key={index} style={{ color: item.color }}>
          {`${item.name}: $${item.value.toLocaleString()}`}
        </p>
      ))}
    </div>
  );
};

export default LoanChart; 