import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PropertyManagement = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [newProperty, setNewProperty] = useState({
    address: '',
    property_type: 'Residential',
    area: '',
    tax_amount: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProperty(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form data
      if (!newProperty.address || !newProperty.property_type || !newProperty.area || !newProperty.tax_amount) {
        throw new Error('All fields are required');
      }

      const numericArea = parseFloat(newProperty.area);
      const numericTaxAmount = parseFloat(newProperty.tax_amount);

      if (isNaN(numericArea) || isNaN(numericTaxAmount) || numericArea <= 0 || numericTaxAmount <= 0) {
        throw new Error('Area and tax amount must be positive numbers');
      }

      const propertyData = {
        user_id: user.id,
        address: newProperty.address.trim(),
        property_type: newProperty.property_type,
        area: numericArea,
        tax_amount: numericTaxAmount
      };

      console.log('Sending property data:', propertyData);

      const response = await fetch('http://localhost:5000/add-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(propertyData)
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add property');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to add property');
      }

      // Update the user's properties
      setUser(prev => ({
        ...prev,
        properties: [...(prev.properties || []), data.property]
      }));

      // Reset form
      setNewProperty({
        address: '',
        property_type: 'Residential',
        area: '',
        tax_amount: ''
      });

    } catch (error) {
      console.error('Error adding property:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    setDeletingId(propertyId);
    setError('');

    try {
      const response = await fetch(
        `http://localhost:5000/properties/${propertyId}?user_id=${user.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete property');
      }

      // Update the user's properties
      setUser(prev => ({
        ...prev,
        properties: prev.properties.filter(p => p.id !== propertyId)
      }));

    } catch (error) {
      console.error('Error deleting property:', error);
      setError(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePayTax = (property) => {
    navigate('/payment', { state: { property } });
  };

  return (
    <div className="property-management">
      <div className="add-property-form">
        <h3>Add New Property</h3>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleAddProperty}>
          <div className="form-group">
            <label>Address *</label>
            <input
              type="text"
              name="address"
              value={newProperty.address}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Property Type *</label>
            <select
              name="property_type"
              value={newProperty.property_type}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Industrial">Industrial</option>
            </select>
          </div>
          <div className="form-group">
            <label>Area (sq ft) *</label>
            <input
              type="number"
              name="area"
              min="0"
              step="0.01"
              value={newProperty.area}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Annual Tax Amount *</label>
            <input
              type="number"
              name="tax_amount"
              min="0"
              step="0.01"
              value={newProperty.tax_amount}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Enter amount in Rs"
            />
          </div>
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Adding Property...' : 'Add Property'}
          </button>
        </form>
      </div>

      <div className="properties-list">
        <h3>Your Properties</h3>
        {!user.properties || user.properties.length === 0 ? (
          <p className="no-properties">No properties added yet. Add your first property above.</p>
        ) : (
          user.properties
            .filter(property => property && typeof property === 'object')
            .map(property => (
              <div key={property.id || 'temp-' + Math.random()} className="property-card">
                <div className="property-info">
                  <div className="property-header">
                    <h3>{property.address || 'No Address'}</h3>
                    <span className={`status-badge ${property.tax_paid ? 'paid' : 'pending'}`}>
                      {property.tax_paid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  <div className="property-details">
                    <div className="detail-item">
                      <span className="label">Type:</span>
                      <span className="value">{property.property_type || 'Not Specified'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Area:</span>
                      <span className="value">
                        {(property.area ? Number(property.area) : 0).toLocaleString()} sq ft
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Annual Tax:</span>
                      <span className="value">
                        Rs {(property.tax_amount ? Number(property.tax_amount) : 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Last Payment:</span>
                      <span className="value">{property.last_payment_date || 'Never'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Next Due:</span>
                      <span className="value">{property.next_payment_date || 'Not Set'}</span>
                    </div>
                  </div>
                </div>
                <div className="property-actions">
                  {!property.tax_paid && (
                    <button
                      className="pay-button"
                      onClick={() => handlePayTax(property)}
                    >
                      Pay Tax
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteProperty(property.id)}
                    className="delete-btn"
                    disabled={deletingId === property.id}
                  >
                    {deletingId === property.id ? 'Deleting...' : 'Delete Property'}
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default PropertyManagement; 