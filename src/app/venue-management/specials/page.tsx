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
  id: string;
  special_name: string;
  description: string;
  day: string;
  start_time: string;
  end_time: string;
  venue_name: string;
}

export default function Specials() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [specials, setSpecials] = useState<Special[]>([]);
  const [venueName, setVenueName] = useState('');
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
          fetchSpecials(venueData.name);
        }
      }
    } catch (err) {
      setError('Error loading venue data');
    }
  };

  const fetchSpecials = async (venueName: string) => {
    try {
      const response = await fetch(`/api/specials?venue_name=${encodeURIComponent(venueName)}`);
      if (response.ok) {
        const data = await response.json();
        setSpecials(data);
      }
    } catch (error) {
      console.error('Error fetching specials:', error);
      setError('Error fetching specials');
    }
  };

  const handleAddSpecial = async (specialData: Omit<Special, 'id'>) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/specials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...specialData,
          venue_name: venueName,
        }),
      });

      if (response.ok) {
        setSuccess('Special added successfully');
        setIsModalOpen(false);
        fetchSpecials(venueName);
      } else {
        const data = await response.json();
        setError(data.error || 'Error adding special');
      }
    } catch (error) {
      console.error('Error adding special:', error);
      setError('Error adding special');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Specials</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Special
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {specials.map((special) => (
          <div key={special.id} className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">{special.special_name}</h2>
            <p className="text-gray-600 mb-2">{special.description}</p>
            <div className="text-sm text-gray-500">
              <p>Day: {special.day}</p>
              <p>Time: {special.start_time} - {special.end_time}</p>
              <p>Venue: {special.venue_name}</p>
            </div>
          </div>
        ))}
      </div>

      <AddSpecialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddSpecial}
        venueName={venueName}
      />
    </div>
  );
} 