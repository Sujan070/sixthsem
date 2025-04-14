import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PaymentPage = ({ user, setUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { property } = location.state || {};
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setPaymentStatus('processing');
    
    try {
      const response = await fetch('http://localhost:5000/pay-tax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: property.id
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update the user's properties in state
        setUser(prev => ({
          ...prev,
          properties: prev.properties.map(p => {
            if (p.id === property.id) {
              return {
                ...p,
                tax_paid: true,
                last_payment_date: new Date().toISOString().split('T')[0],
                next_payment_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
              };
            }
            return p;
          })
        }));
        
        setPaymentStatus('success');
        
        // Navigate back to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message);
      setPaymentStatus('pending');
    }
  };

  if (!property) {
    return (
      <div className="main-content">
        <div className="payment-container">
          <h2>Invalid Payment Request</h2>
          <p>No property information found. Please try again.</p>
          <button onClick={() => navigate('/dashboard')} className="submit-button">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="payment-container">
        <h2>Tax Payment</h2>
        
        <div className="payment-details">
          <h3>Property Details</h3>
          <div className="detail-row">
            <span>Address:</span>
            <span>{property.address}</span>
          </div>
          <div className="detail-row">
            <span>Type:</span>
            <span>{property.property_type}</span>
          </div>
          <div className="detail-row">
            <span>Area:</span>
            <span>{property.area} sq ft</span>
          </div>
          <div className="detail-row">
            <span>Tax Amount:</span>
            <span>Rs {Number(property.tax_amount || 0).toLocaleString()}</span>
          </div>
          <div className="detail-row">
            <span>Due Date:</span>
            <span>{property.next_payment_date || 'Not Set'}</span>
          </div>
        </div>

        <div className="payment-methods">
          <h3>Select Payment Method</h3>
          <div className="payment-options">
            <label className="payment-option">
              <input type="radio" name="paymentMethod" value="creditCard" defaultChecked />
              <span>Credit Card</span>
            </label>
            <label className="payment-option">
              <input type="radio" name="paymentMethod" value="debitCard" />
              <span>Debit Card</span>
            </label>
            <label className="payment-option">
              <input type="radio" name="paymentMethod" value="bankTransfer" />
              <span>Bank Transfer</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {paymentStatus === 'pending' && (
          <button onClick={handlePayment} className="submit-button">
            Pay Now
          </button>
        )}

        {paymentStatus === 'processing' && (
          <div className="payment-status processing">
            Processing payment...
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="payment-status success">
            Payment successful! Redirecting to dashboard...
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage; 