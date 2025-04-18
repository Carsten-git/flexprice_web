'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Specials() {
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
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Specials</h2>
      <p className="text-gray-600">
        This section will be used to manage special offers and promotions.
      </p>
    </div>
  );
} 