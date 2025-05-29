import db from '../../db/db';

export default function handler(req, res) {
  switch (req.method) {
    case 'GET':
      // Get all items for a specific venue
      const { venue_id } = req.query;
      if (!venue_id) {
        return res.status(400).json({ message: 'Venue ID is required' });
      }
      const items = db.prepare('SELECT * FROM items WHERE venue_id = ? ORDER BY category, type, name').all(venue_id);
      res.status(200).json(items);
      break;

    case 'POST':
      // Create a new item
      const { 
        venue_id: newVenueId, 
        name, 
        type, 
        price, 
        description = '', 
        image_url = '', 
        category = '', 
        is_available = true 
      } = req.body;
      
      if (!newVenueId || !name || !type || !price) {
        return res.status(400).json({ message: 'Venue ID, name, type, and price are required' });
      }

      try {
        // Check if item with same name already exists for this venue
        const existingItem = db.prepare('SELECT * FROM items WHERE venue_id = ? AND name = ?').get(newVenueId, name);
        if (existingItem) {
          return res.status(409).json({ message: 'An item with this name already exists for this venue' });
        }

        // Convert boolean to integer for SQLite3
        const isAvailableInt = is_available ? 1 : 0;

        const stmt = db.prepare(`
          INSERT INTO items (venue_id, name, type, price, description, image_url, category, is_available) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(newVenueId, name, type, price, description, image_url, category, isAvailableInt);
        
        const newItem = {
          id: result.lastInsertRowid, 
          venue_id: newVenueId, 
          name, 
          type, 
          price,
          description,
          image_url,
          category,
          is_available: Boolean(isAvailableInt)
        };
        
        res.status(201).json(newItem);
      } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ message: 'Error creating item' });
      }
      break;

    case 'PUT':
      // Update an existing item
      const { 
        id: updateId,
        venue_id: updateVenueId, 
        name: updateName, 
        type: updateType, 
        price: updatePrice, 
        description: updateDescription = '', 
        image_url: updateImageUrl = '', 
        category: updateCategory = '', 
        is_available: updateIsAvailable = true 
      } = req.body;
      
      if (!updateId || !updateVenueId || !updateName || !updateType || updatePrice === undefined) {
        return res.status(400).json({ message: 'ID, venue ID, name, type, and price are required' });
      }

      try {
        // Check if item exists
        const existingItem = db.prepare('SELECT * FROM items WHERE id = ? AND venue_id = ?').get(updateId, updateVenueId);
        if (!existingItem) {
          return res.status(404).json({ message: 'Item not found' });
        }

        // Check if name is being changed and conflicts with another item
        if (existingItem.name !== updateName) {
          const conflictingItem = db.prepare('SELECT * FROM items WHERE venue_id = ? AND name = ? AND id != ?').get(updateVenueId, updateName, updateId);
          if (conflictingItem) {
            return res.status(409).json({ message: 'An item with this name already exists for this venue' });
          }
        }

        // Convert boolean to integer for SQLite3
        const isAvailableInt = updateIsAvailable ? 1 : 0;

        const stmt = db.prepare(`
          UPDATE items 
          SET name = ?, type = ?, price = ?, description = ?, image_url = ?, category = ?, is_available = ?
          WHERE id = ? AND venue_id = ?
        `);
        
        stmt.run(updateName, updateType, updatePrice, updateDescription, updateImageUrl, updateCategory, isAvailableInt, updateId, updateVenueId);
        
        const updatedItem = {
          id: updateId,
          venue_id: updateVenueId,
          name: updateName,
          type: updateType,
          price: updatePrice,
          description: updateDescription,
          image_url: updateImageUrl,
          category: updateCategory,
          is_available: Boolean(isAvailableInt)
        };
        
        res.status(200).json(updatedItem);
      } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ message: 'Error updating item' });
      }
      break;

    case 'DELETE':
      // Delete an item
      const { id: deleteId, venue_id: deleteVenueId } = req.body;
      
      if (!deleteId || !deleteVenueId) {
        return res.status(400).json({ message: 'Item ID and venue ID are required' });
      }

      try {
        // Check if item exists
        const existingItem = db.prepare('SELECT * FROM items WHERE id = ? AND venue_id = ?').get(deleteId, deleteVenueId);
        if (!existingItem) {
          return res.status(404).json({ message: 'Item not found' });
        }

        const stmt = db.prepare('DELETE FROM items WHERE id = ? AND venue_id = ?');
        stmt.run(deleteId, deleteVenueId);
        
        res.status(200).json({ message: 'Item deleted successfully' });
      } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ message: 'Error deleting item' });
      }
      break;

    default:
      res.status(405).json({ message: 'Method not allowed' });
  }
} 