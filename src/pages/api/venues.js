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
      
      // Parse JSON fields if they exist
      if (venue && venue.opening_hours) {
        try {
          venue.opening_hours = JSON.parse(venue.opening_hours);
        } catch (e) {
          venue.opening_hours = null;
        }
      }
      if (venue && venue.features) {
        try {
          venue.features = JSON.parse(venue.features);
        } catch (e) {
          venue.features = [];
        }
      }
      
      res.status(200).json(venue || null);
      break;

    case 'POST':
      // Create a new venue
      const { 
        user_id: userId, 
        name, 
        address, 
        suburb, 
        state, 
        postcode, 
        phone, 
        email, 
        website, 
        description, 
        cuisine_type, 
        price_range, 
        opening_hours, 
        features, 
        image_url, 
        capacity, 
        established_year 
      } = req.body;

      if (!userId || !name || !address) {
        return res.status(400).json({ message: 'User ID, name, and address are required' });
      }

      try {
        // Check if user already has a venue
        const existingVenue = db.prepare('SELECT * FROM venues WHERE user_id = ?').get(userId);
        if (existingVenue) {
          return res.status(409).json({ message: 'You already have a venue. Use PUT to update.' });
        }

        const userExists = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!userExists) {
          return res.status(400).json({ message: 'User does not exist' });
        }

        const stmt = db.prepare(`
          INSERT INTO venues (
            user_id, name, address, suburb, state, postcode, phone, email, website, 
            description, cuisine_type, price_range, opening_hours, features, 
            image_url, capacity, established_year
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
          userId, name, address, suburb || '', state || '', postcode || '', 
          phone || '', email || '', website || '', description || '', 
          cuisine_type || '', price_range || '', 
          JSON.stringify(opening_hours || {}), 
          JSON.stringify(features || []), 
          image_url || '', capacity || 0, established_year || ''
        );
        
        const newVenue = {
          id: result.lastInsertRowid,
          user_id: userId,
          name,
          address,
          suburb: suburb || '',
          state: state || '',
          postcode: postcode || '',
          phone: phone || '',
          email: email || '',
          website: website || '',
          description: description || '',
          cuisine_type: cuisine_type || '',
          price_range: price_range || '',
          opening_hours: opening_hours || {},
          features: features || [],
          image_url: image_url || '',
          capacity: capacity || 0,
          established_year: established_year || ''
        };
        
        res.status(201).json(newVenue);
      } catch (error) {
        console.error('Error creating venue:', error);
        res.status(500).json({ message: 'Error creating venue' });
      }
      break;

    case 'PUT':
      // Update existing venue
      const { 
        user_id: updateUserId, 
        name: updateName, 
        address: updateAddress, 
        suburb: updateSuburb, 
        state: updateState, 
        postcode: updatePostcode, 
        phone: updatePhone, 
        email: updateEmail, 
        website: updateWebsite, 
        description: updateDescription, 
        cuisine_type: updateCuisineType, 
        price_range: updatePriceRange, 
        opening_hours: updateOpeningHours, 
        features: updateFeatures, 
        image_url: updateImageUrl, 
        capacity: updateCapacity, 
        established_year: updateEstablishedYear 
      } = req.body;

      if (!updateUserId || !updateName || !updateAddress) {
        return res.status(400).json({ message: 'User ID, name, and address are required' });
      }

      try {
        // Check if venue exists for this user
        const existingVenue = db.prepare('SELECT * FROM venues WHERE user_id = ?').get(updateUserId);
        if (!existingVenue) {
          return res.status(404).json({ message: 'Venue not found for this user' });
        }

        const stmt = db.prepare(`
          UPDATE venues SET 
            name = ?, address = ?, suburb = ?, state = ?, postcode = ?, 
            phone = ?, email = ?, website = ?, description = ?, 
            cuisine_type = ?, price_range = ?, opening_hours = ?, 
            features = ?, image_url = ?, capacity = ?, established_year = ?
          WHERE user_id = ?
        `);
        
        stmt.run(
          updateName, updateAddress, updateSuburb || '', updateState || '', updatePostcode || '', 
          updatePhone || '', updateEmail || '', updateWebsite || '', updateDescription || '', 
          updateCuisineType || '', updatePriceRange || '', 
          JSON.stringify(updateOpeningHours || {}), 
          JSON.stringify(updateFeatures || []), 
          updateImageUrl || '', updateCapacity || 0, updateEstablishedYear || '',
          updateUserId
        );
        
        const updatedVenue = {
          id: existingVenue.id,
          user_id: updateUserId,
          name: updateName,
          address: updateAddress,
          suburb: updateSuburb || '',
          state: updateState || '',
          postcode: updatePostcode || '',
          phone: updatePhone || '',
          email: updateEmail || '',
          website: updateWebsite || '',
          description: updateDescription || '',
          cuisine_type: updateCuisineType || '',
          price_range: updatePriceRange || '',
          opening_hours: updateOpeningHours || {},
          features: updateFeatures || [],
          image_url: updateImageUrl || '',
          capacity: updateCapacity || 0,
          established_year: updateEstablishedYear || ''
        };
        
        res.status(200).json(updatedVenue);
      } catch (error) {
        console.error('Error updating venue:', error);
        res.status(500).json({ message: 'Error updating venue' });
      }
      break;

    default:
      res.status(405).json({ message: 'Method not allowed' });
  }
} 