import React, { useState } from 'react';

const categories = [
  'Internship, Grant, Job Opportunity, Graduate School',
  'Upgrade your Home',
  'At work',
  'Community Engagement',
  'Waste Reduction/ Disposal',
  'Government',
  'USF Specific (Go Bulls!)',
  'Donate/ Use your Resources',
  'Entertainment, Utility, Education, News'
];

const Recommend = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    location: '',
    description: '',
    tags: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log('Form submitted:', formData);
    // You could integrate with Google Sheets API here
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Recommend an Activity</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Activity Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-olive-700 focus:ring-olive-700"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-olive-700 focus:ring-olive-700"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
            Subcategory
          </label>
          <input
            type="text"
            id="subcategory"
            name="subcategory"
            value={formData.subcategory}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-olive-700 focus:ring-olive-700"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-olive-700 focus:ring-olive-700"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-olive-700 focus:ring-olive-700"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., outdoor, nature, exercise"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-olive-700 focus:ring-olive-700"
          />
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-olive-700 hover:bg-olive-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-olive-700"
          >
            Submit Recommendation
          </button>
        </div>
      </form>
    </div>
  );
};

export default Recommend; 