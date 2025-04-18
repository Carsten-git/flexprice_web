const db = require('./db');

// Clear all entries from the tables
db.exec(`
  DELETE FROM items;
  DELETE FROM venues;
  DELETE FROM users;
`);

console.log('All entries cleared from users, venues, and items tables.');