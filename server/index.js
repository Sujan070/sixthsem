const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, "database.db"), (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create tables
db.serialize(() => {
  // Drop existing properties table if it exists
  db.run('DROP TABLE IF EXISTS properties', (err) => {
    if (err) {
      console.error('Error dropping properties table:', err);
    } else {
      console.log('Dropped existing properties table');
    }
  });

  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      address TEXT,
      phone TEXT,
      nid TEXT UNIQUE,
      citizenship_no TEXT UNIQUE,
      password TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table created or already exists');
    }
  });

  // Create properties table with correct schema
  db.run(`
    CREATE TABLE properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      address TEXT,
      property_type TEXT,
      area REAL,
      tax_amount REAL,
      tax_paid BOOLEAN DEFAULT 0,
      last_payment_date TEXT,
      next_payment_date TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating properties table:', err);
    } else {
      console.log('Properties table created successfully');
    }
  });
});

// Property Management Section
const propertyController = {
  // Format property data consistently
  formatProperty: (property) => {
    if (!property) return null;
    return {
      id: property.id,
      user_id: property.user_id,
      address: property.address || '',
      property_type: property.property_type || 'Residential',
      area: Number(property.area) || 0,
      tax_amount: Number(property.tax_amount) || 0,
      tax_paid: Boolean(property.tax_paid),
      last_payment_date: property.last_payment_date || null,
      next_payment_date: property.next_payment_date || null
    };
  },

  // Validate property data
  validateProperty: (data) => {
    const { user_id, address, property_type, area, tax_amount } = data;
    const errors = [];

    if (!user_id) errors.push('User ID is required');
    if (!address?.trim()) errors.push('Address is required');
    if (!property_type) errors.push('Property type is required');
    if (!area || isNaN(area) || Number(area) <= 0) errors.push('Valid area is required');
    if (!tax_amount || isNaN(tax_amount) || Number(tax_amount) <= 0) errors.push('Valid tax amount is required');

    return {
      isValid: errors.length === 0,
      errors,
      data: {
        user_id: Number(user_id),
        address: address?.trim(),
        property_type,
        area: Number(area),
        tax_amount: Number(tax_amount)
      }
    };
  }
};

// Signup API
app.post("/signup", (req, res) => {
  const { name, address, phone, nid, citizenship_no, password } = req.body;
  const query = `
    INSERT INTO users (name, address, phone, nid, citizenship_no, password)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.run(query, [name, address, phone, nid, citizenship_no, password], (err) => {
    if (err) {
      return res.status(400).json({ error: "NID or Citizenship No. already exists" });
    }
    res.json({ message: "User created successfully" });
  });
});

// Login API
app.post("/login", (req, res) => {
  const { nid, password } = req.body;
  const userQuery = `SELECT * FROM users WHERE nid = ? AND password = ?`;
  db.get(userQuery, [nid, password], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    
    // Fetch user's properties
    const propertiesQuery = `SELECT * FROM properties WHERE user_id = ?`;
    db.all(propertiesQuery, [user.id], (err, properties) => {
      if (err) {
        return res.status(500).json({ error: "Error fetching properties" });
      }
      
      // Send user data with formatted properties
      res.json({
        user: {
          ...user,
          properties: (properties || []).map(propertyController.formatProperty)
        }
      });
    });
  });
});

// Add Property API
app.post("/add-property", (req, res) => {
  try {
    console.log('Received property data:', req.body);
    
    const { user_id, address, property_type, area, tax_amount } = req.body;
    
    // Validate required fields
    if (!user_id || !address || !property_type || !area || !tax_amount) {
      console.log('Missing required fields:', { user_id, address, property_type, area, tax_amount });
      return res.status(400).json({
        success: false,
        error: "All fields are required"
      });
    }

    // Convert and validate numeric values
    const numericArea = parseFloat(area);
    const numericTaxAmount = parseFloat(tax_amount);

    if (isNaN(numericArea) || isNaN(numericTaxAmount) || numericArea <= 0 || numericTaxAmount <= 0) {
      console.log('Invalid numeric values:', { area, tax_amount });
      return res.status(400).json({
        success: false,
        error: "Area and tax amount must be positive numbers"
      });
    }

    // Validate property type
    const validPropertyTypes = ['Residential', 'Commercial', 'Industrial', 'Agricultural'];
    if (!validPropertyTypes.includes(property_type)) {
      console.log('Invalid property type:', property_type);
      return res.status(400).json({
        success: false,
        error: "Invalid property type"
      });
    }

    // First verify that the user exists
    db.get('SELECT id FROM users WHERE id = ?', [user_id], (err, user) => {
      if (err) {
        console.error('Error verifying user:', err);
        return res.status(500).json({
          success: false,
          error: "Failed to verify user: " + err.message
        });
      }

      if (!user) {
        console.log('User not found:', user_id);
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      // Insert property into database
      const query = `
        INSERT INTO properties (
          user_id, address, property_type, area, tax_amount,
          tax_paid, last_payment_date, next_payment_date
        ) VALUES (?, ?, ?, ?, ?, 0, NULL, date('now', '+1 year'))
      `;

      console.log('Executing query:', query, [user_id, address, property_type, numericArea, numericTaxAmount]);

      db.run(query, [user_id, address, property_type, numericArea, numericTaxAmount], function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            error: "Failed to add property to database: " + err.message
          });
        }

        const newPropertyId = this.lastID;
        console.log('New property ID:', newPropertyId);

        // Fetch and return the newly created property
        db.get('SELECT * FROM properties WHERE id = ?', [newPropertyId], (err, property) => {
          if (err) {
            console.error('Error fetching new property:', err);
            return res.status(500).json({
              success: false,
              error: "Property added but failed to fetch details: " + err.message
            });
          }

          if (!property) {
            return res.status(500).json({
              success: false,
              error: "Property added but not found"
            });
          }

          // Format the property data
          const formattedProperty = {
            id: property.id,
            user_id: property.user_id,
            address: property.address,
            property_type: property.property_type,
            area: Number(property.area),
            tax_amount: Number(property.tax_amount),
            tax_paid: Boolean(property.tax_paid),
            last_payment_date: property.last_payment_date,
            next_payment_date: property.next_payment_date
          };

          console.log('Returning property:', formattedProperty);
          res.json({
            success: true,
            message: "Property added successfully",
            property: formattedProperty
          });
        });
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error: " + error.message
    });
  }
});

// Pay Tax API
app.post("/pay-tax", (req, res) => {
  const { property_id } = req.body;
  const today = new Date().toISOString().split("T")[0];
  const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0];

  const query = `
    UPDATE properties
    SET tax_paid = 1, last_payment_date = ?, next_payment_date = ?
    WHERE id = ?
  `;
  db.run(query, [today, nextYear, property_id], (err) => {
    if (err) {
      return res.status(400).json({ error: "Failed to pay tax" });
    }
    res.json({ message: "Tax paid successfully" });
  });
});

// Get User Properties API
app.get("/properties/:user_id", (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }

  db.all('SELECT * FROM properties WHERE user_id = ?', [user_id], (err, properties) => {
    if (err) {
      console.error('Error fetching properties:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch properties'
      });
    }

    res.json({
      success: true,
      properties: properties.map(propertyController.formatProperty).filter(Boolean)
    });
  });
});

// Delete Property API
app.delete("/properties/:property_id", (req, res) => {
  try {
    const { property_id } = req.params;
    const { user_id } = req.query;

    console.log('Delete request:', { property_id, user_id });

    if (!property_id || !user_id) {
      return res.status(400).json({
        success: false,
        error: "Property ID and User ID are required"
      });
    }

    // First verify that this property belongs to the user
    db.get('SELECT user_id FROM properties WHERE id = ?', [property_id], (err, property) => {
      if (err) {
        console.error('Error verifying property ownership:', err);
        return res.status(500).json({
          success: false,
          error: "Failed to verify property ownership"
        });
      }

      if (!property) {
        return res.status(404).json({
          success: false,
          error: "Property not found"
        });
      }

      if (property.user_id !== parseInt(user_id)) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to delete this property"
        });
      }

      // If verification passed, delete the property
      db.run('DELETE FROM properties WHERE id = ?', [property_id], function(err) {
        if (err) {
          console.error('Error deleting property:', err);
          return res.status(500).json({
            success: false,
            error: "Failed to delete property"
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            error: "Property not found"
          });
        }

        res.json({
          success: true,
          message: "Property deleted successfully"
        });
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Check User API
app.get("/check-user/:user_id", (req, res) => {
  const { user_id } = req.params;
  
  db.get('SELECT * FROM users WHERE id = ?', [user_id], (err, user) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({
        success: false,
        error: "Failed to check user: " + err.message
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.json({
      success: true,
      user: user
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: "Internal server error: " + err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found"
  });
});

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database path: ${path.join(__dirname, "database.db")}`);
});