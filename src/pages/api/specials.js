import db from '../../db/db';

export default function handler(req, res) {
  switch (req.method) {
    case 'GET': {
      // Get all specials for a specific venue with associated items
      const { venue_name, venue_id } = req.query;
      
      if (!venue_name && !venue_id) {
        return res.status(400).json({ error: 'Venue name or venue ID is required' });
      }

      try {
        let specials;
        if (venue_id) {
          // Get specials by venue ID
          specials = db.prepare(`
            SELECT s.*, 
                   GROUP_CONCAT(i.name) as item_names, 
                   GROUP_CONCAT(i.id) as item_ids,
                   GROUP_CONCAT(i.price) as original_prices,
                   GROUP_CONCAT(si.special_price) as special_prices
            FROM specials s
            LEFT JOIN special_items si ON s.id = si.special_id
            LEFT JOIN items i ON si.item_id = i.id
            WHERE s.venue_id = ?
            GROUP BY s.id
            ORDER BY s.created_at DESC
          `).all(venue_id);
        } else {
          // Get specials by venue name
          specials = db.prepare(`
            SELECT s.*, v.name as venue_name, 
                   GROUP_CONCAT(i.name) as item_names, 
                   GROUP_CONCAT(i.id) as item_ids,
                   GROUP_CONCAT(i.price) as original_prices,
                   GROUP_CONCAT(si.special_price) as special_prices
            FROM specials s
            JOIN venues v ON s.venue_id = v.id
            LEFT JOIN special_items si ON s.id = si.special_id
            LEFT JOIN items i ON si.item_id = i.id
            WHERE v.name = ?
            GROUP BY s.id
            ORDER BY s.created_at DESC
          `).all(venue_name);
        }

        // Format the response to include item arrays
        const formattedSpecials = specials.map(special => ({
          id: special.id,
          special_name: special.special_name,
          description: special.description,
          day: special.day,
          start_time: special.start_time,
          end_time: special.end_time,
          venue_name: special.venue_name || venue_name,
          venue_id: special.venue_id,
          item_names: special.item_names ? special.item_names.split(',') : [],
          item_ids: special.item_ids ? special.item_ids.split(',').map(id => parseInt(id)) : [],
          original_prices: special.original_prices ? special.original_prices.split(',').map(price => parseFloat(price)) : [],
          special_prices: special.special_prices ? special.special_prices.split(',').map(price => price === 'null' ? null : parseFloat(price)) : [],
          created_at: special.created_at
        }));

        return res.status(200).json(formattedSpecials);
      } catch (error) {
        console.error('Error fetching specials:', error);
        return res.status(500).json({ error: 'Error fetching specials' });
      }
    }

    case 'POST': {
      // Create a new special with associated items
      const { 
        special_name, 
        description, 
        day, 
        start_time, 
        end_time, 
        venue_name: postVenueName,
        venue_id: postVenueId,
        special_items = [] 
      } = req.body;

      if (!special_name || !description || !day || !start_time || !end_time) {
        return res.status(400).json({ error: 'Special name, description, day, start time, and end time are required' });
      }

      if (!postVenueId && !postVenueName) {
        return res.status(400).json({ error: 'Venue ID or venue name is required' });
      }

      if (!special_items || special_items.length === 0) {
        return res.status(400).json({ error: 'At least one menu item must be selected for this special' });
      }

      try {
        let finalVenueId = postVenueId;

        // If venue_name is provided but not venue_id, get the venue_id
        if (!postVenueId && postVenueName) {
          const venue = db.prepare('SELECT id FROM venues WHERE name = ?').get(postVenueName);
          if (!venue) {
            return res.status(404).json({ error: 'Venue not found' });
          }
          finalVenueId = venue.id;
        }

        // Begin transaction
        const transaction = db.transaction(() => {
          // Insert the special
          const insertSpecial = db.prepare(`
            INSERT INTO specials (venue_id, special_name, description, day, start_time, end_time)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          
          const result = insertSpecial.run(finalVenueId, special_name, description, day, start_time, end_time);
          const specialId = result.lastInsertRowid;

          // Insert the special-item associations with special prices
          const insertSpecialItem = db.prepare(`
            INSERT INTO special_items (special_id, item_id, special_price)
            VALUES (?, ?, ?)
          `);

          for (const specialItem of special_items) {
            insertSpecialItem.run(specialId, specialItem.item_id, specialItem.special_price);
          }

          return specialId;
        });

        const specialId = transaction();

        // Get the created special with item information
        const createdSpecial = db.prepare(`
          SELECT s.*, 
                 GROUP_CONCAT(i.name) as item_names, 
                 GROUP_CONCAT(i.id) as item_ids,
                 GROUP_CONCAT(i.price) as original_prices,
                 GROUP_CONCAT(si.special_price) as special_prices
          FROM specials s
          LEFT JOIN special_items si ON s.id = si.special_id
          LEFT JOIN items i ON si.item_id = i.id
          WHERE s.id = ?
          GROUP BY s.id
        `).get(specialId);

        const responseData = {
          id: createdSpecial.id,
          special_name: createdSpecial.special_name,
          description: createdSpecial.description,
          day: createdSpecial.day,
          start_time: createdSpecial.start_time,
          end_time: createdSpecial.end_time,
          venue_id: createdSpecial.venue_id,
          item_names: createdSpecial.item_names ? createdSpecial.item_names.split(',') : [],
          item_ids: createdSpecial.item_ids ? createdSpecial.item_ids.split(',').map(id => parseInt(id)) : [],
          original_prices: createdSpecial.original_prices ? createdSpecial.original_prices.split(',').map(price => parseFloat(price)) : [],
          special_prices: createdSpecial.special_prices ? createdSpecial.special_prices.split(',').map(price => price === 'null' ? null : parseFloat(price)) : [],
          created_at: createdSpecial.created_at
        };

        return res.status(201).json(responseData);
      } catch (error) {
        console.error('Error creating special:', error);
        return res.status(500).json({ error: 'Error creating special' });
      }
    }

    case 'DELETE': {
      // Delete a special and its associations
      const { id: deleteId } = req.body;
      
      if (!deleteId) {
        return res.status(400).json({ error: 'Special ID is required' });
      }

      try {
        // The special_items will be deleted automatically due to CASCADE
        const deleteResult = db.prepare('DELETE FROM specials WHERE id = ?').run(deleteId);
        
        if (deleteResult.changes === 0) {
          return res.status(404).json({ error: 'Special not found' });
        }

        return res.status(200).json({ message: 'Special deleted successfully' });
      } catch (error) {
        console.error('Error deleting special:', error);
        return res.status(500).json({ error: 'Error deleting special' });
      }
    }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
} 