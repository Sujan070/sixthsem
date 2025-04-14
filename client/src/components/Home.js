import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ user }) => {
  return (
    <div className="main-content">
      <div className="home-container">
        <div className="home-header">
          <h1>Welcome to NID Tax Payment System</h1>
          <p>Streamline your tax payments with our secure and efficient platform. Manage your tax obligations with ease and confidence.</p>
        </div>

        {!user ? (
          <div className="auth-section">
            <div className="auth-buttons">
              <Link to="/login" className="auth-button login-button">
                Login to Your Account
              </Link>
              <Link to="/signup" className="auth-button signup-button">
                Create New Account
              </Link>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <h3>Secure Payments</h3>
                <p>Bank-grade security for all your transactions</p>
              </div>
              <div className="feature-card">
                <h3>Easy Tracking</h3>
                <p>Monitor your payment history and receipts</p>
              </div>
              <div className="feature-card">
                <h3>24/7 Access</h3>
                <p>Manage your taxes anytime, anywhere</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="welcome-back">
            <h2>Welcome back, {user.name}!</h2>
            <p>You're already logged in. Would you like to go to your dashboard?</p>
            <Link to="/dashboard" className="auth-button login-button">
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;