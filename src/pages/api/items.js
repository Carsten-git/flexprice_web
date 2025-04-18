import db from '../../db/db';

export default function handler(req, res) {
  switch (req.method) {
    case 'GET':
      // Get all items for a specific venue
      const { venue_id } = req.query;
      if (!venue_id) {
        return res.status(400).json({ message: 'Venue ID is required' });
      }
      const items = db.prepare('SELECT * FROM items WHERE venue_id = ?').all(venue_id);
      res.status(200).json(items);
      break;

    case 'POST':
      // Create a new item
      const { venue_id: newVenueId, name, type, price } = req.body;
      
      if (!newVenueId || !name || !type || !price) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      try {
        // Check if item with same name already exists for this venue
        const existingItem = db.prepare('SELECT * FROM items WHERE venue_id = ? AND name = ?').get(newVenueId, name);
        if (existingItem) {
          return res.status(409).json({ message: 'An item with this name already exists for this venue' });
        }

        const stmt = db.prepare('INSERT INTO items (venue_id, name, type, price) VALUES (?, ?, ?, ?)');
        const result = stmt.run(newVenueId, name, type, price);
        res.status(201).json({ 
          id: result.lastInsertRowid, 
          venue_id: newVenueId, 
          name, 
          type, 
          price 
        });
      } catch (error) {
        res.status(500).json({ message: 'Error creating item' });
      }
      break;

    default:
      res.status(405).json({ message: 'Method not allowed' });
  }
} 