import React, { useState } from 'react';
import './LoanInputs.css';

const LoanInputs = (props) => {
  const [termInputValue, setTermInputValue] = useState('');
  const [pendingTerm, setPendingTerm] = useState('');
  const [showUpdateButton, setShowUpdateButton] = useState(false);

  const { 
    loanAmount, 
    interestRate,
    payoffTime,
    monthlyPayment,
    additionalPayment,
    setLoanAmount, 
    setInterestRate,
    setPayoffTime, 
    handleAdditionalPaymentChange,
    minPayment
  } = props;

  const evaluateExpression = (expr) => {
    try {
      // Replace x with * for multiplication
      expr = expr.replace(/[xX]/g, '*');
      // Safely evaluate the expression
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + expr)();
      return isFinite(result) ? Math.round(result) : null;
    } catch (e) {
      return null;
    }
  };

  const handlePayoffTimeChange = (e) => {
    const value = e.target.value;
    setTermInputValue(value);
    setPendingTerm(value);
    setShowUpdateButton(true);
  };

  const handleUpdateTerm = () => {
    if (pendingTerm === '') {
      setShowUpdateButton(false);
      return;
    }

    let finalValue = pendingTerm;
    
    if (pendingTerm.includes('+') || pendingTerm.includes('-') || 
        pendingTerm.includes('*') || pendingTerm.includes('x') || 
        pendingTerm.includes('X') || pendingTerm.includes('/')) {
      finalValue = evaluateExpression(pendingTerm) || 1;
    } else {
      finalValue = parseInt(pendingTerm) || 1;
    }

    finalValue = Math.max(1, Math.min(600, finalValue));
    setPayoffTime(finalValue);
    setTermInputValue(finalValue.toString());
    setPendingTerm(finalValue.toString());
    setShowUpdateButton(false);
  };

  const handlePaymentChange = (e) => {
    if (typeof handleAdditionalPaymentChange === 'function') {
      handleAdditionalPaymentChange(e.target.value);
    }
  };

  return (
    <div className="loan-inputs">
      <div className="input-groups-container">
        <div className="input-group">
          <label>Loan Amount:</label>
          <input
            type="number"
            value={loanAmount}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 0 && value <= 1000000000) {
                setLoanAmount(value);
              }
            }}
            min="0"
            max="1000000000"
            step="1000"
          />
        </div>
        <div className="input-group">
          <label>Interest Rate (%):</label>
          <input
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            min="0"
            step="0.1"
          />
        </div>
        <div className="input-group">
          <label>Loan Term (months):</label>
          <div className="term-input-container">
            <input
              type="text"
              value={termInputValue || payoffTime}
              onChange={handlePayoffTimeChange}
              placeholder="Enter months or calculation"
            />
            {showUpdateButton && (
              <button 
                className="update-term-btn"
                onClick={handleUpdateTerm}
              >
                Update Term 🔄
              </button>
            )}
          </div>
          <span className="input-hint">
            Enter 1-360 months or calculation (e.g., 12*5)
          </span>
        </div>
        <div className="input-group">
          <label>Required Monthly Payment:</label>
          <input
            type="number"
            value={monthlyPayment}
            readOnly
            disabled
            className="readonly-input"
          />
        </div>
        <div className="input-group">
          <label>Additional Monthly Payment:</label>
          <input
            type="number"
            value={additionalPayment}
            onChange={handlePaymentChange}
            min="0"
            step="10"
            placeholder="Enter additional payment"
          />
          <span className="input-hint">
            Pro tip: Extra payments = Speed run to debt freedom 🏃‍♂️💨
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoanInputs; 