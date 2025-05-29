import db from '../../db/db';

// Mock data generator for analytics with special pricing
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

    // Calculate potential savings from special pricing
    let totalSavings = 0;
    let hasDiscounts = false;

    if (special.item_names && special.original_prices && special.special_prices) {
      for (let i = 0; i < special.item_names.length; i++) {
        const originalPrice = special.original_prices[i];
        const specialPrice = special.special_prices[i];
        if (specialPrice && specialPrice < originalPrice) {
          totalSavings += (originalPrice - specialPrice);
          hasDiscounts = true;
        }
      }
    }

    // Generate daily data for each special
    const dailyData = last30Days.map(date => {
      // More views for specials with discounts
      const baseViews = hasDiscounts ? 150 : 80;
      const views = Math.floor(Math.random() * baseViews) + 30;
      
      // Better click rates for discounted specials
      const baseClickRate = hasDiscounts ? 0.25 : 0.15;
      const clickRate = baseClickRate + Math.random() * 0.15;
      const clicks = Math.floor(views * clickRate);
      
      // Better conversion rates for discounted specials
      const baseConversionRate = hasDiscounts ? 0.12 : 0.08;
      const conversionRate = baseConversionRate + Math.random() * 0.08;
      const conversions = Math.floor(clicks * conversionRate);
      
      // Calculate revenue based on special prices
      let revenue = 0;
      if (conversions > 0 && special.special_prices && special.special_prices.length > 0) {
        // Distribute conversions across items
        for (let i = 0; i < conversions; i++) {
          const randomItemIndex = Math.floor(Math.random() * special.special_prices.length);
          const itemPrice = special.special_prices[randomItemIndex] || special.original_prices[randomItemIndex];
          revenue += itemPrice;
        }
      } else if (conversions > 0) {
        // Fallback to average revenue
        revenue = conversions * (20 + Math.random() * 30);
      }

      totalViews += views;
      totalClicks += clicks;
      totalConversions += conversions;
      totalRevenue += revenue;

      return {
        date,
        views,
        clicks,
        conversions,
        revenue: Math.round(revenue * 100) / 100,
        savings: conversions > 0 ? Math.round((totalSavings * conversions / special.item_names.length) * 100) / 100 : 0
      };
    });

    analytics.push({
      special_id: special.id.toString(),
      special_name: special.special_name,
      venue_name: special.venue_name,
      day: special.day,
      time: `${special.start_time} - ${special.end_time}`,
      items: special.item_names || [],
      original_prices: special.original_prices || [],
      special_prices: special.special_prices || [],
      total_savings_per_order: Math.round(totalSavings * 100) / 100,
      has_discounts: hasDiscounts,
      dailyData,
      summary: {
        total_views: totalViews,
        total_clicks: totalClicks,
        total_conversions: totalConversions,
        total_revenue: Math.round(totalRevenue * 100) / 100,
        total_customer_savings: Math.round((totalSavings * totalConversions / (special.item_names?.length || 1)) * 100) / 100,
        avg_conversion_rate: totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 10000) / 100 : 0,
        avg_click_rate: totalViews > 0 ? Math.round((totalClicks / totalViews) * 10000) / 100 : 0,
        avg_order_value: totalConversions > 0 ? Math.round((totalRevenue / totalConversions) * 100) / 100 : 0
      }
    });
  });

  return analytics;
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { venue_name, venue_id } = req.query;
      
      if (!venue_name && !venue_id) {
        return res.status(400).json({ error: 'Venue name or venue ID is required' });
      }

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

      // Format the specials data
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

      // Generate mock analytics data
      const analytics = generateMockAnalytics(formattedSpecials);

      return res.status(200).json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return res.status(500).json({ error: 'Error fetching analytics' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 