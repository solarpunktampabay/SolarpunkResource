import React, { useState, useEffect } from 'react';
import { fetchActivities } from '../services/googleSheets';

const Search = () => {
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await fetchActivities();
        setActivities(data);
        // Extract unique tags
        const tags = [...new Set(data.flatMap(activity => activity.tags))];
        setAllTags(tags);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 ||
                       selectedTags.every(tag => activity.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-center mb-8 text-practical-green-dark">Search Activities</h1>
      
      {/* Search Input */}
      <div className="max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="Search by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-practical-tan/30 rounded-lg focus:ring-2 focus:ring-practical-green-light focus:border-transparent"
        />
      </div>

      {/* Tags Filter */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-practical-green-dark">Filter by Tags</h2>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedTags.includes(tag)
                  ? 'bg-practical-green-light text-practical-cream'
                  : 'bg-practical-tan/20 text-practical-green-dark hover:bg-practical-tan/30'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActivities.map((activity) => (
          <div
            key={activity.id}
            className="bg-white rounded-lg shadow-md p-6 border border-practical-tan/10"
          >
            <h3 className="text-xl font-semibold text-practical-green-dark">{activity.name}</h3>
            <p className="text-practical-green-light mt-1">{activity.location}</p>
            <p className="text-practical-green-dark/70 mt-2">{activity.description}</p>
            <div className="mt-4">
              <span className="text-sm font-medium text-practical-green-dark">
                Categories: {activity.categories.join(', ')}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {activity.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-practical-green-light/10 text-practical-green-dark rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
            {activity.websiteUrl && (
              <a 
                href={activity.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block px-4 py-2 bg-practical-green-light text-practical-cream rounded-md hover:bg-practical-green-dark transition-colors"
              >
                Visit Website
              </a>
            )}
          </div>
        ))}
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center text-practical-green-dark/70 mt-8">
          No activities found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default Search; 