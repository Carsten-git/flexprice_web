const sqlite3 = require('better-sqlite3');
const path = require('path');

// Initialize the database
const db = new sqlite3(path.join(process.cwd(), 'users.db'));

// Create the tables with the correct schema if they do not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS venues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    suburb TEXT DEFAULT '',
    state TEXT DEFAULT '',
    postcode TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    website TEXT DEFAULT '',
    description TEXT DEFAULT '',
    cuisine_type TEXT DEFAULT '',
    price_range TEXT DEFAULT '',
    opening_hours TEXT DEFAULT '{}',
    features TEXT DEFAULT '[]',
    image_url TEXT DEFAULT '',
    capacity INTEGER DEFAULT 0,
    established_year TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id)
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(id),
    UNIQUE(venue_id, name)
  );

  CREATE TABLE IF NOT EXISTS specials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_id INTEGER NOT NULL,
    special_name TEXT NOT NULL,
    description TEXT NOT NULL,
    day TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(id)
  );

  CREATE TABLE IF NOT EXISTS special_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    special_id TEXT NOT NULL,
    venue_name TEXT NOT NULL,
    special_name TEXT NOT NULL,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS special_performance_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    special_id TEXT NOT NULL,
    venue_name TEXT NOT NULL,
    special_name TEXT NOT NULL,
    total_views INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_revenue REAL DEFAULT 0.0,
    avg_conversion_rate REAL DEFAULT 0.0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(special_id)
  );

  CREATE TABLE IF NOT EXISTS special_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    special_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    special_price REAL DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (special_id) REFERENCES specials(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    UNIQUE(special_id, item_id)
  )
`);

// Migration: Add new columns to venues table if they don't exist
const addColumnIfNotExists = (tableName, columnName, columnDefinition) => {
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const columnExists = tableInfo.some(column => column.name === columnName);
    
    if (!columnExists) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
      console.log(`Added column ${columnName} to ${tableName}`);
    }
  } catch (error) {
    console.log(`Column ${columnName} might already exist in ${tableName}`);
  }
};

// Add new venue columns if they don't exist
addColumnIfNotExists('venues', 'suburb', 'TEXT DEFAULT ""');
addColumnIfNotExists('venues', 'state', 'TEXT DEFAULT ""');
addColumnIfNotExists('venues', 'postcode', 'TEXT DEFAULT ""');
addColumnIfNotExists('venues', 'phone', 'TEXT DEFAULT ""');
addColumnIfNotExists('venues', 'email', 'TEXT DEFAULT ""');
addColumnIfNotExists('venues', 'website', 'TEXT DEFAULT ""');
addColumnIfNotExists('venues', 'description', 'TEXT DEFAULT ""');
addColumnIfNotExists('venues', 'cuisine_type', 'TEXT DEFAULT ""');
addColumnIfNotExists('venues', 'price_range', 'TEXT DEFAULT ""');
addColumnIfNotExists('venues', 'opening_hours', 'TEXT DEFAULT "{}"');
addColumnIfNotExists('venues', 'features', 'TEXT DEFAULT "[]"');
addColumnIfNotExists('venues', 'image_url', 'TEXT DEFAULT ""');
addColumnIfNotExists('venues', 'capacity', 'INTEGER DEFAULT 0');
addColumnIfNotExists('venues', 'established_year', 'TEXT DEFAULT ""');

// Add new item columns if they don't exist
addColumnIfNotExists('items', 'description', 'TEXT DEFAULT ""');
addColumnIfNotExists('items', 'image_url', 'TEXT DEFAULT ""');
addColumnIfNotExists('items', 'category', 'TEXT DEFAULT ""');
addColumnIfNotExists('items', 'is_available', 'BOOLEAN DEFAULT 1');

// Add new special_items columns if they don't exist
addColumnIfNotExists('special_items', 'special_price', 'REAL DEFAULT NULL');

module.exports = db; 