'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VenueManagementHome() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to Venue Management</h2>
      <p className="text-gray-600">
        Use the navigation menu above to manage your venue data, items, and specials.
      </p>
    </div>
  );
} 