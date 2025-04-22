'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

interface AddSpecialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (special: {
    special_name: string;
    description: string;
    day: string;
    start_time: string;
    end_time: string;
    venue_name: string;
  }) => void;
  venueName: string;
}

export default function AddSpecialModal({ isOpen, onClose, onSave, venueName }: AddSpecialModalProps) {
  const [specialName, setSpecialName] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');
  const [currentDay, setCurrentDay] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Set current day in Melbourne timezone
      const melbourneTime = dayjs().tz('Australia/Melbourne');
      setCurrentDay(melbourneTime.format('dddd'));
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!specialName || !description || !startTime || !endTime) {
      setError('Please fill in all fields');
      return;
    }

    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    onSave({
      special_name: specialName,
      description,
      day: currentDay,
      start_time: startTime,
      end_time: endTime,
      venue_name: venueName,
    });

    // Reset form
    setSpecialName('');
    setDescription('');
    setStartTime('');
    setEndTime('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Special</h2>
        
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Special Name
              </label>
              <input
                type="text"
                value={specialName}
                onChange={(e) => setSpecialName(e.target.value)}
                className="input"
                placeholder="Enter special name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input h-24"
                placeholder="Enter special description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Day
              </label>
              <input
                type="text"
                value={currentDay}
                disabled
                className="input bg-gray-100 dark:bg-gray-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Venue
              </label>
              <input
                type="text"
                value={venueName}
                disabled
                className="input bg-gray-100 dark:bg-gray-700"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Add Special
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 