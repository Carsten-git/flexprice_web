import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import GoogleMap from './components/GoogleMap';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Item {
  id: number;
  name: string;
  type: string;
  price: number;
  description: string;
  category: string;
  is_available: boolean;
}

interface AddSpecialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    special_name: string;
    description: string;
    day: string;
    start_time: string;
    end_time: string;
    venue_name: string;
    venue_id: number;
    item_ids: number[];
    duration: number;
    radius: number;
    budget: number;
  }) => void;
  venueName: string;
  venueId: number;
}

// Mock venue location in Melbourne CBD
const VENUE_LOCATION = {
  lat: -37.8136,
  lng: 144.9631,
  address: "123 Collins Street, Melbourne VIC 3000"
};

export default function AddSpecialModal({ isOpen, onClose, onSave, venueName, venueId }: AddSpecialModalProps) {
  const [formData, setFormData] = useState({
    special_name: '',
    description: '',
    day: dayjs().tz('Australia/Melbourne').format('DD.MM.YYYY'),
    start_time: '',
    duration: 30, // in minutes
    radius: 500, // in meters
    budget: 25, // in dollars
    venue_name: venueName,
    venue_id: venueId,
    item_ids: [] as number[]
  });

  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [estimatedImpressions, setEstimatedImpressions] = useState(0);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && venueId) {
      // Reset form when modal opens
      setFormData({
        special_name: '',
        description: '',
        day: dayjs().tz('Australia/Melbourne').format('DD.MM.YYYY'),
        start_time: '',
        duration: 30,
        radius: 500,
        budget: 25,
        venue_name: venueName,
        venue_id: venueId,
        item_ids: []
      });
      setSelectedItems(new Set());
      setError('');
      loadItems();
    }
  }, [isOpen, venueName, venueId]);

  // Calculate estimated impressions based on budget, radius, and duration
  useEffect(() => {
    const baseImpressions = 100; // Base impressions per dollar
    const radiusMultiplier = Math.min(formData.radius / 100, 10); // More radius = more people
    const durationMultiplier = formData.duration / 30; // Longer duration = more impressions
    
    const estimated = Math.round(
      formData.budget * baseImpressions * radiusMultiplier * durationMultiplier
    );
    setEstimatedImpressions(estimated);
  }, [formData.budget, formData.radius, formData.duration]);

  const loadItems = async () => {
    setIsLoadingItems(true);
    try {
      const response = await fetch(`/api/items?venue_id=${venueId}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.filter((item: Item) => item.is_available));
      } else {
        setError('Error loading menu items');
      }
    } catch (err) {
      setError('Error loading menu items');
    } finally {
      setIsLoadingItems(false);
    }
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    if (!startTime) return '';
    const start = dayjs(`2000-01-01 ${startTime}`);
    const end = start.add(duration, 'minute');
    return end.format('HH:mm');
  };

  const handleItemToggle = (itemId: number) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(itemId)) {
      newSelectedItems.delete(itemId);
    } else {
      newSelectedItems.add(itemId);
    }
    setSelectedItems(newSelectedItems);
    setFormData({ ...formData, item_ids: Array.from(newSelectedItems) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.size === 0) {
      setError('Please select at least one menu item for this special');
      return;
    }

    const endTime = calculateEndTime(formData.start_time, formData.duration);
    
    onSave({
      special_name: formData.special_name,
      description: formData.description,
      day: formData.day,
      start_time: formData.start_time,
      end_time: endTime,
      venue_name: formData.venue_name,
      venue_id: formData.venue_id,
      item_ids: Array.from(selectedItems),
      duration: formData.duration,
      radius: formData.radius,
      budget: formData.budget
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-6">Create New Special</h2>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mt-0.5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Name</label>
              <input
                type="text"
                value={formData.special_name}
                onChange={(e) => setFormData({ ...formData, special_name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Happy Hour Special"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    const now = dayjs().tz('Australia/Melbourne').format('HH:mm');
                    setFormData({ ...formData, start_time: now });
                  }}
                  className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors whitespace-nowrap flex items-center gap-1"
                  title="Set to current time"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Now
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Describe your special offer..."
              required
            />
          </div>

          {/* Menu Items Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Menu Items *
              <span className="text-sm text-gray-500 font-normal"> (Choose which items this special applies to)</span>
            </label>
            
            {isLoadingItems ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading menu items...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-700">
                  No available menu items found. Please add some menu items first before creating specials.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemToggle(item.id)}
                      className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                        selectedItems.has(item.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {item.type}
                            </span>
                            {item.category && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {item.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedItems.has(item.id)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedItems.has(item.id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedItems.size > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>{selectedItems.size}</strong> item{selectedItems.size !== 1 ? 's' : ''} selected for this special
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Duration</label>
            <div className="flex gap-3">
              {[30, 60, 90, 120].map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setFormData({ ...formData, duration })}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    formData.duration === duration
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {duration} min
                </button>
              ))}
            </div>
            {formData.start_time && (
              <p className="mt-2 text-sm text-gray-600">
                End time: {calculateEndTime(formData.start_time, formData.duration)}
              </p>
            )}
          </div>

          {/* Location & Radius */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Target Radius</label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Google Map */}
              <GoogleMap
                center={VENUE_LOCATION}
                radius={formData.radius}
                address={VENUE_LOCATION.address}
              />

              {/* Radius Controls */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Radius</span>
                    <span className="text-lg text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full">
                      {formData.radius}m
                    </span>
                  </div>
                  <div className="px-2">
                    <input
                      type="range"
                      min="100"
                      max="2000"
                      step="50"
                      value={formData.radius}
                      onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                      className="slider w-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
                    <span>100m</span>
                    <span>1km</span>
                    <span>2km</span>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Coverage Area
                  </h4>
                  <p className="text-sm text-blue-700">
                    Your special will be visible to people within <strong>{formData.radius} meters</strong> of your venue.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Budget & Impressions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Budget & Reach</label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Budget Slider */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Budget</span>
                    <span className="text-xl text-green-600 font-bold bg-green-50 px-4 py-2 rounded-full">
                      ${formData.budget}
                    </span>
                  </div>
                  <div className="px-2">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) })}
                      className="budget-slider w-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
                    <span>$1</span>
                    <span>$50</span>
                    <span>$100</span>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Budget Allocation
                  </h4>
                  <p className="text-sm text-green-700">
                    Higher budgets increase visibility and reach more potential customers.
                  </p>
                </div>
              </div>

              {/* Impression Estimate */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Estimated Reach
                </h4>
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {estimatedImpressions.toLocaleString()}
                </div>
                <p className="text-sm text-purple-700 mb-4">potential impressions</p>
                
                <div className="space-y-2 text-xs text-purple-600">
                  <div className="flex justify-between items-center">
                    <span>Duration boost:</span>
                    <span className="font-medium">+{Math.round((formData.duration / 30 - 1) * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Radius boost:</span>
                    <span className="font-medium">+{Math.round((Math.min(formData.radius / 100, 10) - 1) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden fields for compatibility */}
          <input type="hidden" value={formData.day} />
          <input type="hidden" value={formData.venue_name} />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedItems.size === 0}
              className={`px-8 py-3 rounded-lg font-medium transition-colors shadow-md ${
                selectedItems.size === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Create Special
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 