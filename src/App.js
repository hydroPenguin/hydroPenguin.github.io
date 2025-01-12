// src/App.js
import React, { useState, useEffect } from 'react';
import ReactGA from 'react-ga';
import LoanInfo from './components/LoanInfo';
import LoanInputs from './components/LoanInputs';
import LoanChart from './components/LoanChart';
import './App.css';

const App = () => {
  const [loanAmount, setLoanAmount] = useState(100000);
  const [interestRate, setInterestRate] = useState(4);
  const [payoffTime, setPayoffTime] = useState(240);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [additionalPayment, setAdditionalPayment] = useState('0');
  const [totalMonthlyPayment, setTotalMonthlyPayment] = useState(0);

  useEffect(() => {
    // Track the initial page view
    ReactGA.pageview(window.location.pathname + window.location.search);
  }, []);

  // Add validation to setLoanAmount
  const handleSetLoanAmount = (value) => {
    // Ensure value is between 0 and 1 billion
    const validValue = Math.max(0, Math.min(1000000000, value));
    setLoanAmount(validValue);
  };

  // Add validation to setPayoffTime
  const handleSetPayoffTime = (value) => {
    // Ensure value is between 1 and 600 months
    const validValue = Math.max(1, Math.min(600, value));
    setPayoffTime(validValue);
  };

  // Calculate minimum monthly payment (interest-only)
  const calculateMinPayment = () => {
    return (loanAmount * (interestRate / 100) / 12);
  };

  // Calculate initial monthly payment
  useEffect(() => {
    // Only calculate if payoffTime is a valid number
    if (payoffTime && !isNaN(payoffTime) && payoffTime > 0) {
      const monthlyRate = interestRate / 100 / 12;
      const calculatedPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, payoffTime)) / 
        (Math.pow(1 + monthlyRate, payoffTime) - 1);
      const roundedPayment = Math.round(calculatedPayment);
      setMonthlyPayment(roundedPayment);
      setTotalMonthlyPayment(roundedPayment + Number(additionalPayment));
    }
  }, [loanAmount, interestRate, payoffTime, additionalPayment]);

  // Handle additional payment changes
  const handleAdditionalPaymentChange = (value) => {
    setAdditionalPayment(value);
    if (value >= 0) {
      setTotalMonthlyPayment(monthlyPayment + Number(value));
    }
  };

  return (
    <div className="app">
      <h1>Freedom Path 🌟</h1>
      <LoanInputs
        loanAmount={loanAmount}
        interestRate={interestRate}
        payoffTime={payoffTime}
        monthlyPayment={monthlyPayment}
        additionalPayment={additionalPayment}
        setLoanAmount={handleSetLoanAmount}
        setInterestRate={setInterestRate}
        setPayoffTime={handleSetPayoffTime}
        handleAdditionalPaymentChange={handleAdditionalPaymentChange}
        minPayment={calculateMinPayment()}
      />
      <LoanInfo
        loanAmount={loanAmount}
        interestRate={interestRate}
        payoffTime={payoffTime || 0}
        monthlyPayment={monthlyPayment}
        additionalPayment={additionalPayment}
        totalMonthlyPayment={totalMonthlyPayment}
      />
      <LoanChart
        loanAmount={loanAmount}
        interestRate={interestRate}
        monthlyPayment={totalMonthlyPayment}
        payoffTime={payoffTime || 0}
      />
    </div>
  );
};

export default App;
