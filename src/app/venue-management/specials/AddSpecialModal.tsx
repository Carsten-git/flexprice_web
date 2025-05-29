import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import GoogleMap from './components/GoogleMap';

dayjs.extend(utc);
dayjs.extend(timezone);

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
    duration: number;
    radius: number;
    budget: number;
  }) => void;
  venueName: string;
}

// Mock venue location in Melbourne CBD
const VENUE_LOCATION = {
  lat: -37.8136,
  lng: 144.9631,
  address: "123 Collins Street, Melbourne VIC 3000"
};

export default function AddSpecialModal({ isOpen, onClose, onSave, venueName }: AddSpecialModalProps) {
  const [formData, setFormData] = useState({
    special_name: '',
    description: '',
    day: dayjs().tz('Australia/Melbourne').format('DD.MM.YYYY'),
    start_time: '',
    duration: 30, // in minutes
    radius: 500, // in meters
    budget: 25, // in dollars
    venue_name: venueName
  });

  const [estimatedImpressions, setEstimatedImpressions] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        special_name: '',
        description: '',
        day: dayjs().tz('Australia/Melbourne').format('DD.MM.YYYY'),
        start_time: '',
        duration: 30,
        radius: 500,
        budget: 25,
        venue_name: venueName
      });
    }
  }, [isOpen, venueName]);

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

  const calculateEndTime = (startTime: string, duration: number) => {
    if (!startTime) return '';
    const start = dayjs(`2000-01-01 ${startTime}`);
    const end = start.add(duration, 'minute');
    return end.format('HH:mm');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const endTime = calculateEndTime(formData.start_time, formData.duration);
    
    onSave({
      special_name: formData.special_name,
      description: formData.description,
      day: formData.day,
      start_time: formData.start_time,
      end_time: endTime,
      venue_name: formData.venue_name,
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

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Duration</label>
            <div className="flex gap-3">
              {[30, 60, 90].map((duration) => (
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
              className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors shadow-md"
            >
              Create Special
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 