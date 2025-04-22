import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

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
  }) => void;
  venueName: string;
}

export default function AddSpecialModal({ isOpen, onClose, onSave, venueName }: AddSpecialModalProps) {
  const [formData, setFormData] = useState({
    special_name: '',
    description: '',
    day: dayjs().tz('Australia/Melbourne').format('DD.MM.YYYY'),
    start_time: '',
    end_time: '',
    venue_name: venueName
  });

  useEffect(() => {
    if (isOpen) {
      // Reset form with current date when modal opens
      setFormData({
        special_name: '',
        description: '',
        day: dayjs().tz('Australia/Melbourne').format('DD.MM.YYYY'),
        start_time: '',
        end_time: '',
        venue_name: venueName
      });
    }
  }, [isOpen, venueName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Add Special</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Special Name</label>
            <input
              type="text"
              value={formData.special_name}
              onChange={(e) => setFormData({ ...formData, special_name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Day</label>
            <input
              type="text"
              value={formData.day}
              readOnly
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Start Time</label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">End Time</label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Venue Name</label>
            <input
              type="text"
              value={formData.venue_name}
              readOnly
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 