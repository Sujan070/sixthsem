const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database("./database.db");

// Create tables
db.serialize(() => {
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
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      tax_paid BOOLEAN DEFAULT 0,
      last_payment_date TEXT,
      next_payment_date TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

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
  const query = `SELECT * FROM users WHERE nid = ? AND password = ?`;
  db.get(query, [nid, password], (err, row) => {
    if (err || !row) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    res.json({ user: row });
  });
});

// Add Property API
app.post("/add-property", (req, res) => {
  const { user_id, name } = req.body;
  const query = `
    INSERT INTO properties (user_id, name, tax_paid, last_payment_date, next_payment_date)
    VALUES (?, ?, 0, NULL, NULL)
  `;
  db.run(query, [user_id, name], (err) => {
    if (err) {
      return res.status(400).json({ error: "Failed to add property" });
    }
    res.json({ message: "Property added successfully" });
  });
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
  const query = `SELECT * FROM properties WHERE user_id = ?`;
  db.all(query, [user_id], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: "Failed to fetch properties" });
    }
    res.json({ properties: rows });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});``