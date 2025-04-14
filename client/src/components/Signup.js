import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup = ({ setUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    nid: '',
    citizenship_no: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!formData.name || !formData.nid || !formData.password || !formData.citizenship_no) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          nid: formData.nid,
          citizenship_no: formData.citizenship_no,
          password: formData.password
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // After successful signup, log the user in
        const loginResponse = await fetch('http://localhost:5000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nid: formData.nid,
            password: formData.password
          }),
        });
        
        const loginData = await loginResponse.json();
        
        if (loginResponse.ok) {
          setUser(loginData.user);
          navigate('/dashboard');
        } else {
          setError('Account created but login failed. Please try logging in.');
          navigate('/login');
        }
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="main-content">
      <div className="form-container">
        <h2>Create Account</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>NID Number *</label>
            <input
              type="text"
              name="nid"
              value={formData.nid}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Citizenship Number *</label>
            <input
              type="text"
              name="citizenship_no"
              value={formData.citizenship_no}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="submit-button">Sign Up</button>
        </form>
      </div>
    </div>
  );
};

export default Signup;