'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AddItemModal from '../../../components/AddItemModal';

interface Item {
  id: string;
  name: string;
  type: string;
  price: number;
  venue_id: string;
}

interface Venue {
  id: string;
  name: string;
  address: string;
}

export default function ItemData() {
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
          setVenue(venueData);
          fetchItems(venueData.id);
        }
      }
    } catch (err) {
      setError('Error loading venue data');
    }
  };

  const fetchItems = async (venueId: string) => {
    try {
      const response = await fetch(`/api/items?venue_id=${venueId}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (err) {
      setError('Error fetching items');
    }
  };

  const handleAddItem = async (newItem: Omit<Item, 'id'>) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      const data = await response.json();

      if (response.ok) {
        setItems([...items, data]);
        setSuccess('Item added successfully');
        setIsModalOpen(false);
      } else {
        setError(data.message || 'Error adding item');
      }
    } catch (err) {
      setError('Error adding item');
    }
  };

  if (!venue) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-600">Please set up your venue details first.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Menu Items</h2>
      
      {/* Alert Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
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
      )}

      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Menu Items</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-2">
                  {item.type}
                </span>
              </div>
              <p className="text-xl font-bold text-green-600">${item.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddItem}
        venueId={venue.id}
      />
    </div>
  );
} 