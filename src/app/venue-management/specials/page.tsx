'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddSpecialModal from './AddSpecialModal';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Special {
  id: number;
  special_name: string;
  description: string;
  day: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  venue_id: number;
  item_names: string[];
  item_ids: number[];
  original_prices: number[];
  special_prices: (number | null)[];
  created_at: string;
  duration?: number;
  radius?: number;
  budget?: number;
}

export default function Specials() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [specials, setSpecials] = useState<Special[]>([]);
  const [venueName, setVenueName] = useState('');
  const [venueId, setVenueId] = useState<number | null>(null);
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
          setVenueName(venueData.name);
          setVenueId(venueData.id);
          fetchSpecials(venueData.id);
        }
      }
    } catch (err) {
      setError('Error loading venue data');
    }
  };

  const fetchSpecials = async (venueId: number) => {
    try {
      const response = await fetch(`/api/specials?venue_id=${venueId}`);
      if (response.ok) {
        const data = await response.json();
        setSpecials(data);
      }
    } catch (error) {
      console.error('Error fetching specials:', error);
      setError('Error fetching specials');
    }
  };

  const handleAddSpecial = async (specialData: {
    special_name: string;
    description: string;
    day: string;
    start_time: string;
    end_time: string;
    venue_name: string;
    venue_id: number;
    special_items: { item_id: number; special_price: number | null }[];
    duration: number;
    radius: number;
    budget: number;
  }) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/specials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          special_name: specialData.special_name,
          description: specialData.description,
          day: specialData.day,
          start_time: specialData.start_time,
          end_time: specialData.end_time,
          venue_id: specialData.venue_id,
          special_items: specialData.special_items,
        }),
      });

      if (response.ok) {
        setSuccess('Special added successfully');
        setIsModalOpen(false);
        if (venueId) {
          fetchSpecials(venueId);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Error adding special');
      }
    } catch (error) {
      console.error('Error adding special:', error);
      setError('Error adding special');
    }
  };

  const handleDeleteSpecial = async (specialId: number) => {
    if (!window.confirm('Are you sure you want to delete this special?')) {
      return;
    }

    try {
      const response = await fetch('/api/specials', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: specialId }),
      });

      if (response.ok) {
        setSuccess('Special deleted successfully');
        if (venueId) {
          fetchSpecials(venueId);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Error deleting special');
      }
    } catch (error) {
      console.error('Error deleting special:', error);
      setError('Error deleting special');
    }
  };

  const formatDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return '';
    const start = dayjs(`2000-01-01 ${startTime}`);
    const end = dayjs(`2000-01-01 ${endTime}`);
    const duration = end.diff(start, 'minute');
    return `${duration} min`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Specials</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Special
        </button>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {specials.map((special) => (
          <div key={special.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-semibold text-gray-900">{special.special_name}</h2>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {formatDuration(special.start_time, special.end_time)}
                </span>
                <button
                  onClick={() => handleDeleteSpecial(special.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Delete special"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4 line-clamp-2">{special.description}</p>

            {/* Associated Menu Items */}
            {special.item_names && special.item_names.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Special Applies to:</h4>
                <div className="space-y-2">
                  {special.item_names.map((itemName, index) => {
                    const originalPrice = special.original_prices[index];
                    const specialPrice = special.special_prices[index];
                    const hasDiscount = specialPrice && specialPrice < originalPrice;
                    
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded"
                      >
                        <span className="text-sm font-medium text-green-800">{itemName}</span>
                        <div className="flex items-center gap-2">
                          {hasDiscount ? (
                            <>
                              <span className="text-lg font-bold text-green-600">
                                ${specialPrice.toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                ${originalPrice.toFixed(2)}
                              </span>
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                {(((originalPrice - specialPrice) / originalPrice) * 100).toFixed(0)}% off
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-600">
                              ${originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {special.day}
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {special.start_time} - {special.end_time}
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {special.venue_name}
              </div>
            </div>
          </div>
        ))}
      </div>

      {specials.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No specials</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first special.</p>
          <div className="mt-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Special
            </button>
          </div>
        </div>
      )}

      {venueId && (
        <AddSpecialModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddSpecial}
          venueName={venueName}
          venueId={venueId}
        />
      )}
    </div>
  );
} 