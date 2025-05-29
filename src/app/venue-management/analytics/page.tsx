'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SimpleChart from './components/SimpleChart';

interface DailyData {
  date: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface AnalyticsSummary {
  total_views: number;
  total_clicks: number;
  total_conversions: number;
  total_revenue: number;
  avg_conversion_rate: number;
  avg_click_rate: number;
}

interface SpecialAnalytics {
  special_id: string;
  special_name: string;
  venue_name: string;
  day: string;
  time: string;
  dailyData: DailyData[];
  summary: AnalyticsSummary;
}

export default function Analytics() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<SpecialAnalytics[]>([]);
  const [venueName, setVenueName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    // Check if user is logged in and load venue data
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(user);
    loadVenueData(userData.id);
  }, [router]);

  const loadVenueData = async (userId: string) => {
    try {
      const venueResponse = await fetch(`/api/venues?user_id=${userId}`);
      if (venueResponse.ok) {
        const venueData = await venueResponse.json();
        if (venueData) {
          setVenueName(venueData.name);
          fetchAnalytics(venueData.name);
        }
      }
    } catch (err) {
      setError('Error loading venue data');
      setLoading(false);
    }
  };

  const fetchAnalytics = async (venueName: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?venue_name=${encodeURIComponent(venueName)}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        setError('Error fetching analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Error fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    return analytics.reduce(
      (totals, special) => ({
        views: totals.views + special.summary.total_views,
        clicks: totals.clicks + special.summary.total_clicks,
        conversions: totals.conversions + special.summary.total_conversions,
        revenue: totals.revenue + special.summary.total_revenue,
      }),
      { views: 0, clicks: 0, conversions: 0, revenue: 0 }
    );
  };

  const getAggregatedDailyData = () => {
    if (analytics.length === 0) return [];
    
    const dailyTotals: { [date: string]: DailyData } = {};
    
    analytics.forEach(special => {
      special.dailyData.forEach(day => {
        if (!dailyTotals[day.date]) {
          dailyTotals[day.date] = {
            date: day.date,
            views: 0,
            clicks: 0,
            conversions: 0,
            revenue: 0
          };
        }
        dailyTotals[day.date].views += day.views;
        dailyTotals[day.date].clicks += day.clicks;
        dailyTotals[day.date].conversions += day.conversions;
        dailyTotals[day.date].revenue += day.revenue;
      });
    });
    
    return Object.values(dailyTotals).sort((a, b) => a.date.localeCompare(b.date));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();
  const aggregatedData = getAggregatedDailyData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-semibold text-gray-900">{totals.views.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clicks</p>
              <p className="text-2xl font-semibold text-gray-900">{totals.clicks.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversions</p>
              <p className="text-2xl font-semibold text-gray-900">{totals.conversions.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totals.revenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {aggregatedData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SimpleChart
            data={aggregatedData.map(d => ({ date: d.date, value: d.views }))}
            title="Daily Views"
            color="#3B82F6"
          />
          <SimpleChart
            data={aggregatedData.map(d => ({ date: d.date, value: d.clicks }))}
            title="Daily Clicks"
            color="#10B981"
          />
          <SimpleChart
            data={aggregatedData.map(d => ({ date: d.date, value: d.conversions }))}
            title="Daily Conversions"
            color="#8B5CF6"
          />
          <SimpleChart
            data={aggregatedData.map(d => ({ date: d.date, value: d.revenue }))}
            title="Daily Revenue"
            color="#F59E0B"
          />
        </div>
      )}

      {/* Special Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Special Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Special
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Click Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conv. Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.map((special) => (
                <tr key={special.special_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{special.special_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{special.day}</div>
                    <div className="text-sm text-gray-500">{special.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {special.summary.total_views.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {special.summary.total_clicks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPercentage(special.summary.avg_click_rate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {special.summary.total_conversions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPercentage(special.summary.avg_conversion_rate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(special.summary.total_revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {analytics.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create some specials to start seeing analytics data.
          </p>
        </div>
      )}
    </div>
  );
} 