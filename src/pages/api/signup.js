import db from '../../db/db';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body;
  console.log('username', username);
  console.log('password', password);

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  // Check if username already exists
  const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  console.log('existingUser', existingUser);

  if (existingUser) {
    return res.status(409).json({ message: 'Username already exists' });
  }

  try {
    // Insert new user into the database
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const result = stmt.run(username, password);
    console.log('User created with ID:', result.lastInsertRowid); // Log the user ID

    // Query all users to print the current state of the database
    const allUsers = db.prepare('SELECT * FROM users').all();
    console.log('Current users in the database:', allUsers); // Log all users

    // Return success response with user ID
    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        id: result.lastInsertRowid,
        username
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
} 