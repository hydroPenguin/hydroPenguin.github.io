// src/components/LoanInfo.js
import React from 'react';
import './LoanInfo.css';

const LoanInfo = ({ 
  loanAmount, 
  interestRate, 
  payoffTime, 
  monthlyPayment,
  additionalPayment,
  totalMonthlyPayment 
}) => {
  // Calculate total interest
  const calculateTotalInterest = () => {
    const totalPayments = totalMonthlyPayment * payoffTime;
    return totalPayments - loanAmount;
  };

  // Calculate time saved with additional payments
  const calculateTimeSaved = () => {
    if (!additionalPayment || additionalPayment <= 0) return 0;
    
    const monthlyRate = interestRate / 100 / 12;
    let balance = loanAmount;
    let monthsWithExtra = 0;
    
    while (balance > 0 && monthsWithExtra < payoffTime) {
      const interest = balance * monthlyRate;
      balance = balance + interest - totalMonthlyPayment;
      monthsWithExtra++;
    }
    
    return Math.max(0, payoffTime - monthsWithExtra);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const timeSaved = calculateTimeSaved();
  const totalInterest = calculateTotalInterest();

  return (
    <div className="loan-info">
      <h2>Loan Summary 📊</h2>
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">Principal:</span>
          <span className="info-value">{formatCurrency(loanAmount)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Interest Rate:</span>
          <span className="info-value">{interestRate}% APR</span>
        </div>
        <div className="info-item">
          <span className="info-label">Loan Term:</span>
          <span className="info-value">
            {payoffTime} months ({Math.floor(payoffTime/12)} years {payoffTime%12} months)
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Base Monthly Payment:</span>
          <span className="info-value">{formatCurrency(monthlyPayment)}</span>
        </div>
        {additionalPayment > 0 && (
          <>
            <div className="info-item highlight">
              <span className="info-label">Extra Monthly Payment:</span>
              <span className="info-value">+{formatCurrency(Number(additionalPayment))}</span>
            </div>
            <div className="info-item highlight">
              <span className="info-label">Total Monthly Payment:</span>
              <span className="info-value">{formatCurrency(totalMonthlyPayment)}</span>
            </div>
            <div className="info-item achievement">
              <span className="info-label">Time Saved:</span>
              <span className="info-value">
                {Math.floor(timeSaved/12) > 0 ? `${Math.floor(timeSaved/12)} years ` : ''}
                {timeSaved%12} months! 🎉
              </span>
            </div>
          </>
        )}
        <div className="info-item total">
          <span className="info-label">Total Interest:</span>
          <span className="info-value">{formatCurrency(totalInterest)}</span>
        </div>
        <div className="info-item total">
          <span className="info-label">Total Cost:</span>
          <span className="info-value">{formatCurrency(loanAmount + totalInterest)}</span>
        </div>
      </div>
    </div>
  );
};

export default LoanInfo;
