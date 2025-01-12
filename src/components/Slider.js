import React, { useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const LoanSlider = ({ loanAmount, interestRate, setPayoffTime }) => {
  const calculatePayoffTime = (monthlyPayment) => {
    const principal = loanAmount;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = Math.log(monthlyPayment / (monthlyPayment - principal * monthlyRate)) / Math.log(1 + monthlyRate);
    return Math.round(numberOfPayments);
  };

  // Calculate minimum monthly payment (interest-only payment)
  const minMonthlyPayment = Math.ceil((loanAmount * (interestRate / 100) / 12));
  
  // Calculate maximum monthly payment (pay in 1 year)
  const maxMonthlyPayment = Math.ceil((loanAmount * (interestRate / 100) / 12) + (loanAmount / 12));

  const handleSliderChange = (value) => {
    const newPayoffTime = calculatePayoffTime(value);
    setPayoffTime(newPayoffTime);
  };

  return (
    <div className="slider-container">
      <h3>Adjust Monthly Payment</h3>
      <Slider
        min={minMonthlyPayment}
        max={maxMonthlyPayment}
        defaultValue={minMonthlyPayment}
        onChange={handleSliderChange}
        step={50}
      />
      <div className="slider-labels">
        <span>Min: ${minMonthlyPayment}</span>
        <span>Max: ${maxMonthlyPayment}</span>
      </div>
    </div>
  );
};

export default LoanSlider;