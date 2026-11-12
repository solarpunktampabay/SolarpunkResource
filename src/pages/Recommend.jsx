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
    <div className="mx-auto max-w-2xl">
      <header>
        <p className="byline">Recommend</p>
        <h1 className="headline-xl mt-4">Recommend an activity.</h1>
        <p className="deck mt-5">
          Know something that belongs here? Tell us about it.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="rule-t mt-10 space-y-6 pt-10">
        <div>
          <label htmlFor="name" className="field-label">Activity name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="field"
          />
        </div>

        <div>
          <label htmlFor="category" className="field-label">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="field"
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
          <label htmlFor="subcategory" className="field-label">Subcategory</label>
          <input
            type="text"
            id="subcategory"
            name="subcategory"
            value={formData.subcategory}
            onChange={handleChange}
            required
            className="field"
          />
        </div>

        <div>
          <label htmlFor="location" className="field-label">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="field"
          />
        </div>

        <div>
          <label htmlFor="description" className="field-label">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            required
            className="field"
          />
        </div>

        <div>
          <label htmlFor="tags" className="field-label">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., outdoor, nature, exercise"
            className="field"
          />
        </div>

        <button type="submit" className="btn-sprout w-full !py-3.5 !text-base">
          Submit recommendation
        </button>
      </form>
    </div>
  );
};

export default Recommend;
