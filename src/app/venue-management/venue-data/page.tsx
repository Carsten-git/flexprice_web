"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

// Constants for form options
const AUSTRALIAN_STATES = [
  'NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'
];

const CUISINE_TYPES = [
  'Asian', 'Italian', 'Mexican', 'Indian', 'Thai', 'Chinese', 'Japanese', 'Mediterranean', 
  'American', 'French', 'Greek', 'Lebanese', 'Vietnamese', 'Korean', 'Modern Australian', 
  'Pub Food', 'Seafood', 'Steakhouse', 'Vegetarian', 'Vegan', 'Fusion', 'Other'
];

const PRICE_RANGES = [
  '$ (Under $30)', '$$ ($30-60)', '$$$ ($60-100)', '$$$$ ($100+)'
];

const VENUE_FEATURES = [
  'WiFi', 'Outdoor Seating', 'Live Music', 'Parking Available', 'Wheelchair Accessible',
  'Pet Friendly', 'Kid Friendly', 'Private Dining', 'Bar', 'Happy Hour', 'Delivery',
  'Takeaway', 'BYO', 'Licensed', 'Group Bookings', 'Functions', 'Sports TV',
  'Pool/Billiards', 'Gaming', 'Air Conditioning', 'Heating', 'Dance Floor'
];

const DEFAULT_HOURS = {
  Monday: { open: '09:00', close: '17:00', closed: false },
  Tuesday: { open: '09:00', close: '17:00', closed: false },
  Wednesday: { open: '09:00', close: '17:00', closed: false },
  Thursday: { open: '09:00', close: '17:00', closed: false },
  Friday: { open: '09:00', close: '22:00', closed: false },
  Saturday: { open: '09:00', close: '22:00', closed: false },
  Sunday: { open: '10:00', close: '17:00', closed: false }
};

interface VenueData {
  id?: number;
  user_id?: number;
  name: string;
  description: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  phone: string;
  email: string;
  website: string;
  cuisine_type: string;
  price_range: string;
  opening_hours: any;
  features: string[];
  image_url: string;
  capacity: number;
  established_year: string;
}

export default function VenueDataPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isNewVenue, setIsNewVenue] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editStep, setEditStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [venueData, setVenueData] = useState<VenueData>({
    name: '',
    description: '',
    address: '',
    suburb: '',
    state: '',
    postcode: '',
    phone: '',
    email: '',
    website: '',
    cuisine_type: '',
    price_range: '',
    opening_hours: DEFAULT_HOURS,
    features: [],
    image_url: '',
    capacity: 0,
    established_year: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Fetch existing venue data
    fetchVenueData(parsedUser.id);
  }, [router]);

  const fetchVenueData = async (userId: number) => {
    try {
      const response = await fetch(`/api/venues?user_id=${userId}`);
      if (response.ok) {
        const venue = await response.json();
        if (venue) {
          setVenueData({
            ...venue,
            opening_hours: venue.opening_hours || DEFAULT_HOURS,
            features: venue.features || []
          });
          setIsNewVenue(false);
        }
      }
    } catch (error) {
      console.error('Error fetching venue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof VenueData, value: any) => {
    setVenueData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureToggle = (feature: string) => {
    setVenueData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleHourChange = (day: string, type: 'open' | 'close' | 'closed', value: any) => {
    setVenueData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          [type]: value
        }
      }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        handleInputChange('image_url', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const method = isNewVenue ? 'POST' : 'PUT';
      const response = await fetch('/api/venues', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...venueData,
          user_id: user.id
        }),
      });

      if (response.ok) {
        setShowSuccessMessage(true);
        if (isNewVenue) {
          setIsNewVenue(false);
        }
        setIsEditing(false);
        setEditStep(1);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving venue:', error);
      alert('An error occurred while saving the venue data');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditStep(1);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditStep(1);
    // Reset form to original data
    fetchVenueData(user.id);
  };

  const nextStep = () => {
    console.log('Current step:', editStep, 'Moving to step:', editStep + 1);
    setEditStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    console.log('Current step:', editStep, 'Moving to step:', editStep - 1);
    setEditStep(prev => Math.max(prev - 1, 1));
  };

  const formatFullAddress = () => {
    const parts = [venueData.address, venueData.suburb, venueData.state, venueData.postcode].filter(Boolean);
    return parts.join(', ');
  };

  const formatOpeningHours = () => {
    return Object.entries(venueData.opening_hours).map(([day, hours]: [string, any]) => {
      if (hours.closed) {
        return `${day}: Closed`;
      }
      return `${day}: ${hours.open} - ${hours.close}`;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Profile View Mode
  if (!isEditing && !isNewVenue) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Venue Profile</h1>
            <p className="text-gray-600">
              This is how your venue appears to customers. Keep it updated to attract more visitors.
            </p>
          </div>
          <button
            onClick={startEditing}
            className="btn-primary flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Venue profile updated successfully!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Display */}
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="card">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                {venueData.image_url ? (
                  <img
                    src={venueData.image_url}
                    alt={venueData.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="md:w-2/3">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{venueData.name}</h2>
                {venueData.cuisine_type && (
                  <p className="text-blue-600 font-medium mb-2">{venueData.cuisine_type}</p>
                )}
                {venueData.price_range && (
                  <p className="text-gray-600 mb-4">{venueData.price_range}</p>
                )}
                <p className="text-gray-700 leading-relaxed">
                  {venueData.description || "No description available."}
                </p>
              </div>
            </div>
          </div>

          {/* Contact & Location */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location & Contact
              </h3>
              <div className="space-y-3">
                {formatFullAddress() && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-gray-900">{formatFullAddress()}</p>
                  </div>
                )}
                {venueData.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-gray-900">{venueData.phone}</p>
                  </div>
                )}
                {venueData.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{venueData.email}</p>
                  </div>
                )}
                {venueData.website && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Website</p>
                    <a href={venueData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {venueData.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Venue Details
              </h3>
              <div className="space-y-3">
                {venueData.capacity > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Capacity</p>
                    <p className="text-gray-900">{venueData.capacity} people</p>
                  </div>
                )}
                {venueData.established_year && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Established</p>
                    <p className="text-gray-900">{venueData.established_year}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Opening Hours
            </h3>
            <div className="grid md:grid-cols-2 gap-2">
              {formatOpeningHours().map((dayInfo, index) => (
                <p key={index} className="text-gray-700">{dayInfo}</p>
              ))}
            </div>
          </div>

          {/* Features */}
          {venueData.features.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Features & Amenities
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {venueData.features.map(feature => (
                  <div key={feature} className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Create New Venue or Edit Mode
  const renderEditForm = () => {
    switch (editStep) {
      case 1:
        return (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={venueData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your venue name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine Type
                </label>
                <select
                  className="input"
                  value={venueData.cuisine_type}
                  onChange={(e) => handleInputChange('cuisine_type', e.target.value)}
                >
                  <option value="">Select cuisine type</option>
                  {CUISINE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="input resize-none"
                  value={venueData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your venue, atmosphere, specialties, and what makes it unique..."
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Location & Contact</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={venueData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter street address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suburb
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={venueData.suburb}
                    onChange={(e) => handleInputChange('suburb', e.target.value)}
                    placeholder="Suburb"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <select
                    className="input"
                    value={venueData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                  >
                    <option value="">Select state</option>
                    {AUSTRALIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postcode
                  </label>
                  <input
                    type="text"
                    pattern="[0-9]{4}"
                    className="input"
                    value={venueData.postcode}
                    onChange={(e) => handleInputChange('postcode', e.target.value)}
                    placeholder="0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="input"
                    value={venueData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(02) 0000 0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={venueData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="venue@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  className="input"
                  value={venueData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.example.com"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Venue Image</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Venue Image
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    {imagePreview || venueData.image_url ? (
                      <div className="mb-4">
                        <img
                          src={imagePreview || venueData.image_url}
                          alt="Venue preview"
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter image URL
                </label>
                <input
                  type="url"
                  className="input"
                  value={venueData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Venue Details & Opening Hours</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <select
                    className="input"
                    value={venueData.price_range}
                    onChange={(e) => handleInputChange('price_range', e.target.value)}
                  >
                    <option value="">Select price range</option>
                    {PRICE_RANGES.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={venueData.capacity || ''}
                    onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                    placeholder="Maximum capacity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Established Year
                  </label>
                  <input
                    type="text"
                    pattern="[0-9]{4}"
                    className="input"
                    value={venueData.established_year}
                    onChange={(e) => handleInputChange('established_year', e.target.value)}
                    placeholder="e.g., 2010"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Opening Hours</h3>
                <div className="space-y-4">
                  {Object.entries(venueData.opening_hours).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-24 font-medium text-gray-700">
                        {day}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={!hours.closed}
                          onChange={(e) => handleHourChange(day, 'closed', !e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">Open</span>
                      </div>
                      {!hours.closed && (
                        <>
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) => handleHourChange(day, 'open', e.target.value)}
                            className="input w-32"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleHourChange(day, 'close', e.target.value)}
                            className="input w-32"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Features & Amenities</h2>
            <div className="space-y-6">
              <p className="text-gray-600">Select all the features and amenities available at your venue:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {VENUE_FEATURES.map(feature => (
                  <label key={feature} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={venueData.features.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // New Venue Creation Mode
  if (isNewVenue || isEditing) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isNewVenue ? 'Create Your Venue Profile' : 'Edit Your Venue Profile'}
          </h1>
          <p className="text-gray-600">
            {isNewVenue 
              ? 'Set up your venue profile to attract customers and showcase what makes your venue special.'
              : 'Update your venue information to keep customers informed and engaged.'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          {/* Debug info */}
          <div className="mb-4 p-2 bg-gray-100 rounded text-sm text-gray-600">
            Current Step: {editStep} / 5
          </div>
          
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= editStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 5 && (
                  <div className={`h-1 w-12 mx-2 ${
                    step < editStep ? 'bg-blue-500' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Basic Info</span>
            <span>Location</span>
            <span>Image</span>
            <span>Details</span>
            <span>Features</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {renderEditForm()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <div>
              {editStep > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    prevStep();
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  cancelEditing();
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>

              {editStep < 5 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Next button clicked. Current step:', editStep);
                    nextStep();
                  }}
                  className="btn-primary px-6 py-3 flex items-center"
                >
                  Next
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSaving}
                  onClick={() => console.log('Submit button clicked. Current step:', editStep)}
                  className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {isNewVenue ? 'Create Venue Profile' : 'Save Changes'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Empty state for new venues
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <div className="card">
        <svg className="mx-auto h-24 w-24 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Your Venue Profile</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Welcome! Let's set up your venue profile to attract customers and showcase what makes your venue special. 
          This information will be visible to potential customers browsing venues.
        </p>
        <button
          onClick={startEditing}
          className="btn-primary text-lg px-8 py-4 flex items-center mx-auto"
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Get Started
        </button>
      </div>
    </div>
  );
}