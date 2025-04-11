import React, { useEffect, useState } from "react";

const Home = ({ user }) => {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    if (user) {
      fetch(`/properties/${user.id}`)
        .then((response) => response.json())
        .then((data) => setProperties(data.properties));
    }
  }, [user]);

  const handlePayTax = (propertyId) => {
    fetch("/pay-tax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property_id: propertyId }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          alert(data.message);
          // Refresh properties after paying tax
          fetch(`/properties/${user.id}`)
            .then((response) => response.json())
            .then((data) => setProperties(data.properties));
        }
      });
  };

  return (
    <div className="home">
      <h2>Welcome, {user ? user.name : "Guest"}</h2>
      <div className="properties">
        <h3>My Properties</h3>
        {properties.map((property) => (
          <div key={property.id} className="property">
            <p>Name: {property.name}</p>
            <p>Tax Paid: {property.tax_paid ? "Yes" : "No"}</p>
            {!property.tax_paid && (
              <button onClick={() => handlePayTax(property.id)}>
                Pay Tax
              </button>
            )}
            {property.next_payment_date && (
              <p>Next Payment Due: {property.next_payment_date}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;