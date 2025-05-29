import { firestore } from '../../lib/firebase';
import db from '../../db/db';

// Mock data generator for analytics
function generateMockAnalytics(specials) {
  const analytics = [];
  const last30Days = [];
  
  // Generate last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last30Days.push(date.toISOString().split('T')[0]);
  }

  specials.forEach(special => {
    let totalViews = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalRevenue = 0;

    // Generate daily data for each special
    const dailyData = last30Days.map(date => {
      const views = Math.floor(Math.random() * 100) + 20; // 20-120 views
      const clicks = Math.floor(views * (0.1 + Math.random() * 0.3)); // 10-40% click rate
      const conversions = Math.floor(clicks * (0.05 + Math.random() * 0.15)); // 5-20% conversion rate
      const revenue = conversions * (15 + Math.random() * 35); // $15-50 per conversion

      totalViews += views;
      totalClicks += clicks;
      totalConversions += conversions;
      totalRevenue += revenue;

      return {
        date,
        views,
        clicks,
        conversions,
        revenue: Math.round(revenue * 100) / 100
      };
    });

    analytics.push({
      special_id: special.id,
      special_name: special.special_name,
      venue_name: special.venue_name,
      day: special.day,
      time: `${special.start_time} - ${special.end_time}`,
      dailyData,
      summary: {
        total_views: totalViews,
        total_clicks: totalClicks,
        total_conversions: totalConversions,
        total_revenue: Math.round(totalRevenue * 100) / 100,
        avg_conversion_rate: totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 10000) / 100 : 0,
        avg_click_rate: totalViews > 0 ? Math.round((totalClicks / totalViews) * 10000) / 100 : 0
      }
    });
  });

  return analytics;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { venue_name } = req.query;
      
      if (!venue_name) {
        return res.status(400).json({ error: 'Venue name is required' });
      }

      // Fetch specials from Firebase
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

      // Generate mock analytics data
      const analytics = generateMockAnalytics(specials);

      return res.status(200).json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return res.status(500).json({ error: 'Error fetching analytics' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 