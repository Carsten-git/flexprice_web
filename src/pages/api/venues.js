import db from '../../db/db';

export default function handler(req, res) {
  switch (req.method) {
    case 'GET':
      // Get venue for the current user
      const { user_id } = req.query;
      if (!user_id) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      const venue = db.prepare('SELECT * FROM venues WHERE user_id = ?').get(user_id);
      res.status(200).json(venue || null);
      break;

    case 'POST':
      console.log('req.body', req.body);
      // Create a new venue
      const { user_id: userId, name, address } = req.body;
      console.log('userId', userId);
      console.log('name', name);
      console.log('address', address);

      if (!userId || !name || !address) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      try {
        // Check if user already has a venue
        console.log('userId', userId);
        const existingVenue = db.prepare('SELECT * FROM venues WHERE user_id = ?').get(userId);
        console.log('existingVenue', existingVenue);
        if (existingVenue) {
          return res.status(409).json({ message: 'You already have a venue' });
        }
        console.log('no existing venue');

        const userExists = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        console.log('userExists', userExists);
        if (!userExists) {
          return res.status(400).json({ message: 'User does not exist' });
        }
        console.log('user exists');

        const stmt = db.prepare('INSERT INTO venues (user_id, name, address) VALUES (?, ?, ?)');
        console.log('stmt', stmt);
        const result = stmt.run(userId, name, address);
        console.log('result', result);
        res.status(201).json({ id: result.lastInsertRowid, user_id: userId, name, address });
      } catch (error) {
        res.status(500).json({ message: 'Error creating venue' });
      }
      break;

    default:
      res.status(405).json({ message: 'Method not allowed' });
  }
} 