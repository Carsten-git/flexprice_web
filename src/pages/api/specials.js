import { firestore } from '../../lib/firebase';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { venue_name } = req.query;
      
      if (!venue_name) {
        return res.status(400).json({ error: 'Venue name is required' });
      }

      const snapshot = await firestore.collection('advert_list')
        .where('VenueName', '==', venue_name)
        .get();
      
      const specials = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        specials.push({
          id: doc.id,
          special_name: data.SpecialName,
          description: data.Details,
          day: data.Day,
          start_time: data.From,
          end_time: data.To,
          venue_name: data.VenueName
        });
      });

      return res.status(200).json(specials);
    } catch (error) {
      console.error('Error fetching specials:', error);
      return res.status(500).json({ error: 'Error fetching specials' });
    }
  }

  if (req.method === 'POST') {
    const { special_name, description, day, start_time, end_time, venue_name } = req.body;

    if (!special_name || !description || !day || !start_time || !end_time || !venue_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {
      // Save to Firebase with the correct field names
      const firebaseData = {
        Day: day,
        Details: description,
        From: start_time,
        SpecialName: special_name,
        To: end_time,
        VenueName: venue_name
      };

      const docRef = await firestore.collection('advert_list').add(firebaseData);

      return res.status(201).json({ 
        id: docRef.id,
        ...firebaseData
      });
    } catch (error) {
      console.error('Error creating special:', error);
      return res.status(500).json({ error: 'Error creating special' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 