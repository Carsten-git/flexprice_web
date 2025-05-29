'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

interface Order {
  id: string;
  qrCode: string;
  customerName: string;
  specialId: string;
  specialName: string;
  orderTime: string;
  status: 'pending' | 'preparing' | 'ready' | 'collected' | 'cancelled';
  price: number;
  items: number;
}

interface Special {
  id: string;
  special_name: string;
  description: string;
  day: string;
  start_time: string;
  end_time: string;
  venue_name: string;
}

// Customer names for mock data
const customerNames = [
  'Sarah M.', 'Mike T.', 'Emma L.', 'David R.', 'Lisa K.', 'James W.',
  'Anna S.', 'Tom B.', 'Sophie C.', 'Ryan P.', 'Maya H.', 'Alex F.',
  'Grace L.', 'Ben M.', 'Chloe R.', 'Jake D.', 'Zoe K.', 'Luke W.'
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  preparing: 'bg-blue-100 text-blue-800 border-blue-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  collected: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
};

const statusIcons = {
  pending: '⏳',
  preparing: '👨‍🍳',
  ready: '✅',
  collected: '📦',
  cancelled: '❌'
};

// Generate mock orders based on real specials
const generateMockOrders = (specials: Special[]): Order[] => {
  if (specials.length === 0) return [];

  const orders: Order[] = [];
  const statuses: Order['status'][] = ['pending', 'preparing', 'ready', 'collected', 'cancelled'];
  
  // Generate 8-12 orders
  const orderCount = Math.floor(Math.random() * 5) + 8;
  
  for (let i = 0; i < orderCount; i++) {
    const special = specials[Math.floor(Math.random() * specials.length)];
    const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const items = Math.floor(Math.random() * 3) + 1; // 1-3 items
    
    // Generate realistic prices based on special type
    let basePrice = 15; // Default price
    if (special.special_name.toLowerCase().includes('coffee')) basePrice = 8;
    else if (special.special_name.toLowerCase().includes('beer') || special.special_name.toLowerCase().includes('drink')) basePrice = 12;
    else if (special.special_name.toLowerCase().includes('lunch') || special.special_name.toLowerCase().includes('meal')) basePrice = 18;
    else if (special.special_name.toLowerCase().includes('brunch')) basePrice = 22;
    
    const price = (basePrice + Math.random() * 10) * items; // Add some variation
    
    // Generate order time (last 2 hours)
    const now = new Date();
    const orderTime = new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000);
    
    orders.push({
      id: `ORD-${String(i + 1).padStart(3, '0')}`,
      qrCode: `QR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      customerName,
      specialId: special.id,
      specialName: special.special_name,
      orderTime: orderTime.toISOString(),
      status,
      price: Math.round(price * 100) / 100, // Round to 2 decimal places
      items
    });
  }
  
  // Sort by order time (newest first)
  return orders.sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime());
};

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [specials, setSpecials] = useState<Special[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadSpecialsAndOrders();
  }, [router]);

  const loadSpecialsAndOrders = async () => {
    try {
      setLoading(true);
      
      // Get user and venue information
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setOrders([]);
        return;
      }
      
      const user = JSON.parse(userStr);
      
      // Fetch venue data to get venue name
      const venueResponse = await fetch(`/api/venues?user_id=${user.id}`);
      let venueName = '';
      
      if (venueResponse.ok) {
        const venueData = await venueResponse.json();
        if (venueData && venueData.name) {
          venueName = venueData.name;
        }
      }
      
      let specialsData = [];
      
      if (venueName) {
        // Fetch specials from Firebase using venue name
        const specialsResponse = await fetch(`/api/specials?venue_name=${encodeURIComponent(venueName)}`);
        if (specialsResponse.ok) {
          specialsData = await specialsResponse.json();
        }
      }
      
      // If no specials found, create some mock specials for demo purposes
      if (specialsData.length === 0) {
        specialsData = [
          {
            id: 'mock-1',
            special_name: 'Happy Hour Beer Special',
            description: '50% off all beers from 4-6 PM',
            day: dayjs().format('DD.MM.YYYY'),
            start_time: '16:00',
            end_time: '18:00',
            venue_name: venueName || 'Demo Venue'
          },
          {
            id: 'mock-2',
            special_name: 'Lunch Combo Deal',
            description: 'Main + drink + dessert for $18.90',
            day: dayjs().format('DD.MM.YYYY'),
            start_time: '12:00',
            end_time: '14:00',
            venue_name: venueName || 'Demo Venue'
          },
          {
            id: 'mock-3',
            special_name: 'Coffee & Pastry Special',
            description: 'Any coffee + pastry for $8.50',
            day: dayjs().format('DD.MM.YYYY'),
            start_time: '07:00',
            end_time: '10:00',
            venue_name: venueName || 'Demo Venue'
          },
          {
            id: 'mock-4',
            special_name: 'Weekend Brunch Special',
            description: 'Full brunch menu with bottomless mimosas',
            day: dayjs().format('DD.MM.YYYY'),
            start_time: '09:00',
            end_time: '14:00',
            venue_name: venueName || 'Demo Venue'
          },
          {
            id: 'mock-5',
            special_name: 'Late Night Snacks',
            description: 'Half price appetizers after 9 PM',
            day: dayjs().format('DD.MM.YYYY'),
            start_time: '21:00',
            end_time: '23:00',
            venue_name: venueName || 'Demo Venue'
          }
        ];
      }
      
      setSpecials(specialsData);
      
      // Generate mock orders based on specials (real or mock)
      const mockOrders = generateMockOrders(specialsData);
      setOrders(mockOrders);
      
    } catch (error) {
      console.error('Error loading specials:', error);
      
      // Fallback to mock data if there's an error
      const fallbackSpecials = [
        {
          id: 'fallback-1',
          special_name: 'Happy Hour Beer Special',
          description: '50% off all beers from 4-6 PM',
          day: dayjs().format('DD.MM.YYYY'),
          start_time: '16:00',
          end_time: '18:00',
          venue_name: 'Demo Venue'
        },
        {
          id: 'fallback-2',
          special_name: 'Lunch Combo Deal',
          description: 'Main + drink + dessert for $18.90',
          day: dayjs().format('DD.MM.YYYY'),
          start_time: '12:00',
          end_time: '14:00',
          venue_name: 'Demo Venue'
        }
      ];
      
      setSpecials(fallbackSpecials);
      setOrders(generateMockOrders(fallbackSpecials));
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.specialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.qrCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const getStatusCounts = () => {
    return {
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      collected: orders.filter(o => o.status === 'collected').length,
      total: orders.length
    };
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-AU', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTimeAgo = (timeString: string) => {
    const now = new Date();
    const orderTime = new Date(timeString);
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Manage customer orders and track special purchases</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">Manage customer orders and track special purchases</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
            </div>
            <div className="text-2xl">⏳</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Preparing</p>
              <p className="text-2xl font-bold text-blue-600">{statusCounts.preparing}</p>
            </div>
            <div className="text-2xl">👨‍🍳</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ready</p>
              <p className="text-2xl font-bold text-green-600">{statusCounts.ready}</p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Collected</p>
              <p className="text-2xl font-bold text-gray-600">{statusCounts.collected}</p>
            </div>
            <div className="text-2xl">📦</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Today</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search orders, customers, or QR codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="collected">Collected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Special</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.id}</div>
                      <div className="text-sm text-gray-500">{order.qrCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                    <div className="text-sm text-gray-500">{order.items} item{order.items > 1 ? 's' : ''}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.specialName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatTime(order.orderTime)}</div>
                    <div className="text-sm text-gray-500">{getTimeAgo(order.orderTime)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                      <span className="mr-1">{statusIcons[order.status]}</span>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">${order.price.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100"
                        >
                          Start
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="text-green-600 hover:text-green-900 px-2 py-1 rounded bg-green-50 hover:bg-green-100"
                        >
                          Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'collected')}
                          className="text-gray-600 hover:text-gray-900 px-2 py-1 rounded bg-gray-50 hover:bg-gray-100"
                        >
                          Collected
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'preparing') && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="text-red-600 hover:text-red-900 px-2 py-1 rounded bg-red-50 hover:bg-red-100"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : specials.length === 0 
                  ? 'Create some specials first to see orders here.'
                  : 'Orders will appear here when customers make purchases.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 