'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Item {
  id: number;
  name: string;
  type: string;
  price: number;
  description: string;
  image_url: string;
  category: string;
  is_available: boolean;
  venue_id: number;
}

interface Venue {
  id: number;
  name: string;
  address: string;
}

// Category definitions
const ITEM_CATEGORIES = {
  drink: {
    name: 'Drinks',
    icon: '🥤',
    subcategories: ['Coffee', 'Tea', 'Soft Drinks', 'Juices', 'Alcoholic', 'Other Drinks']
  },
  food: {
    name: 'Food',
    icon: '🍽️',
    subcategories: ['Appetizers', 'Main Course', 'Desserts', 'Snacks', 'Breakfast', 'Other Food']
  }
};

const ITEM_TYPES = ['food', 'drink'];

export default function MenuManagement() {
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'food',
    price: '',
    description: '',
    image_url: '',
    category: '',
    is_available: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(user);
    loadVenueData(userData.id);
  }, [router]);

  useEffect(() => {
    filterItems();
  }, [items, activeCategory, activeSubcategory]);

  const loadVenueData = async (userId: string) => {
    try {
      const venueResponse = await fetch(`/api/venues?user_id=${userId}`);
      if (venueResponse.ok) {
        const venueData = await venueResponse.json();
        if (venueData) {
          setVenue(venueData);
          await fetchItems(venueData.id);
        }
      }
    } catch (err) {
      setError('Error loading venue data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchItems = async (venueId: number) => {
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

  const filterItems = () => {
    let filtered = items;

    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.type === activeCategory);
    }

    if (activeSubcategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeSubcategory);
    }

    setFilteredItems(filtered);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image_url: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        type: item.type,
        price: item.price.toString(),
        description: item.description || '',
        image_url: item.image_url || '',
        category: item.category || '',
        is_available: item.is_available
      });
      setImagePreview(item.image_url || '');
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        type: 'food',
        price: '',
        description: '',
        image_url: '',
        category: '',
        is_available: true
      });
      setImagePreview('');
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      name: '',
      type: 'food',
      price: '',
      description: '',
      image_url: '',
      category: '',
      is_available: true
    });
    setImagePreview('');
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!venue) return;

    const itemData = {
      ...formData,
      price: parseFloat(formData.price),
      venue_id: venue.id
    };

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem 
        ? { ...itemData, id: editingItem.id }
        : itemData;

      const response = await fetch('/api/items', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (editingItem) {
          setItems(items.map(item => item.id === editingItem.id ? data : item));
          setSuccess('Item updated successfully');
        } else {
          setItems([...items, data]);
          setSuccess('Item added successfully');
        }
        closeModal();
      } else {
        setError(data.message || 'Error saving item');
      }
    } catch (err) {
      setError('Error saving item');
    }
  };

  const handleDelete = async (item: Item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const response = await fetch('/api/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, venue_id: venue?.id }),
      });

      if (response.ok) {
        setItems(items.filter(i => i.id !== item.id));
        setSuccess('Item deleted successfully');
      } else {
        const data = await response.json();
        setError(data.message || 'Error deleting item');
      }
    } catch (err) {
      setError('Error deleting item');
    }
  };

  const toggleAvailability = async (item: Item) => {
    try {
      const response = await fetch('/api/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          is_available: !item.is_available
        }),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setItems(items.map(i => i.id === item.id ? updatedItem : i));
        setSuccess(`Item ${updatedItem.is_available ? 'enabled' : 'disabled'} successfully`);
      } else {
        setError('Error updating item availability');
      }
    } catch (err) {
      setError('Error updating item availability');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="card text-center py-12">
        <svg className="mx-auto h-24 w-24 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Set Up Your Venue First</h2>
        <p className="text-gray-600 mb-8">
          You need to complete your venue profile before you can manage your menu items.
        </p>
        <button
          onClick={() => router.push('/venue-management/venue-data')}
          className="btn-primary"
        >
          Go to Venue Setup
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
          <p className="text-gray-600">
            Manage your menu items, organize by categories, and keep your offerings up to date.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Menu Item
        </button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mt-0.5 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400 mt-0.5 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
            </svg>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Category</h3>
        
        {/* Main Categories */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => {
              setActiveCategory('all');
              setActiveSubcategory('all');
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Items ({items.length})
          </button>
          
          {Object.entries(ITEM_CATEGORIES).map(([key, category]) => {
            const count = items.filter(item => item.type === key).length;
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveCategory(key);
                  setActiveSubcategory('all');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                  activeCategory === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Subcategories */}
        {activeCategory !== 'all' && ITEM_CATEGORIES[activeCategory as keyof typeof ITEM_CATEGORIES] && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSubcategory('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeSubcategory === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              All {ITEM_CATEGORIES[activeCategory as keyof typeof ITEM_CATEGORIES].name}
            </button>
            
            {ITEM_CATEGORIES[activeCategory as keyof typeof ITEM_CATEGORIES].subcategories.map(subcategory => {
              const count = items.filter(item => item.type === activeCategory && item.category === subcategory).length;
              if (count === 0) return null;
              
              return (
                <button
                  key={subcategory}
                  onClick={() => setActiveSubcategory(subcategory)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    activeSubcategory === subcategory
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {subcategory} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className={`card relative transition-opacity ${!item.is_available ? 'opacity-60' : ''}`}>
            {/* Item Image */}
            <div className="aspect-w-16 aspect-h-9 mb-4">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
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

            {/* Availability Toggle */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => toggleAvailability(item)}
                className={`p-2 rounded-full ${
                  item.is_available 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
                title={item.is_available ? 'Available' : 'Unavailable'}
              >
                {item.is_available ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>

            {/* Item Details */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {item.type}
                  </span>
                  {item.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.category}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xl font-bold text-green-600">${item.price.toFixed(2)}</p>
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => openModal(item)}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="card text-center py-12">
          <svg className="mx-auto h-24 w-24 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeCategory === 'all' ? 'No menu items yet' : `No ${activeCategory} items found`}
          </h3>
          <p className="text-gray-600 mb-6">
            {activeCategory === 'all' 
              ? 'Start building your menu by adding your first item.' 
              : `Add some ${activeCategory} items to get started.`}
          </p>
          <button
            onClick={() => openModal()}
            className="btn-primary"
          >
            Add Your First Item
          </button>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Flat White"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      className="input"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      required
                      className="input"
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, category: '' }))}
                    >
                      <option value="food">Food</option>
                      <option value="drink">Drink</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      className="input"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="">Select a category</option>
                      {ITEM_CATEGORIES[formData.type as keyof typeof ITEM_CATEGORIES]?.subcategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="input resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your item, ingredients, or special features..."
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Image
                  </label>
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        {imagePreview ? (
                          <div className="mb-4">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="mx-auto h-32 w-32 object-cover rounded-lg"
                            />
                          </div>
                        ) : (
                          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
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

                    {/* URL Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Or enter image URL
                      </label>
                      <input
                        type="url"
                        className="input"
                        value={formData.image_url}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, image_url: e.target.value }));
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_available"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.is_available}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                  />
                  <label htmlFor="is_available" className="ml-2 text-sm text-gray-700">
                    Item is available for ordering
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary px-4 py-3"
                  >
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 