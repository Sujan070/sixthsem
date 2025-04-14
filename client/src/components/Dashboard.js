import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import PropertyManagement from './PropertyManagement';

const Dashboard = ({ user, setUser }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`http://localhost:5000/properties/${user.id}`);
        const data = await response.json();

        if (response.ok) {
          setUser(prev => ({
            ...prev,
            properties: data.properties || []
          }));
        } else {
          setError('Failed to fetch properties');
        }
      } catch (err) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [user?.id, setUser]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Initialize properties array if it doesn't exist
  const properties = user.properties || [];
  
  // Filter out any undefined or invalid properties
  const validProperties = properties.filter(p => p && typeof p === 'object');

  const totalProperties = validProperties.length;
  const pendingPayments = validProperties.filter(p => !p.is_paid).length;
  const totalTaxAmount = validProperties.reduce((sum, p) => sum + (p.tax_paid ? 0 : Number(p.tax_amount || 0)), 0);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user.name}!</h1>
        <p>Your Tax Payment Dashboard</p>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      )}
      
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Total Properties</h3>
          <p className="summary-number">{totalProperties}</p>
        </div>
        <div className="summary-card">
          <h3>Pending Payments</h3>
          <p className="summary-number">{pendingPayments}</p>
        </div>
        <div className="summary-card">
          <h3>Total Due</h3>
          <p className="summary-number">Rs {totalTaxAmount.toLocaleString()}</p>
        </div>
      </div>

      <PropertyManagement user={user} setUser={setUser} />
    </div>
  );
};

export default Dashboard; 