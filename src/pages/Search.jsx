import React, { useState, useEffect } from 'react';
import { fetchActivities } from '../services/googleSheets';
import { parseMMDDYYYYToUTCDate, formatUTCDateToMMDDYYYY } from '../utils/dateUtils';

const Search = () => {
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await fetchActivities();
        setActivities(data);
        // Extract unique tags and categories
        const tags = [...new Set(data.flatMap(activity => activity.tags || []))];
        const categories = [...new Set(data.flatMap(activity => activity.categories || []))];
        setAllTags(tags);
        setAllCategories(categories);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  const filteredActivities = activities.filter(activity => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = activity.name?.toLowerCase().includes(searchLower) ||
                         activity.description?.toLowerCase().includes(searchLower) ||
                         activity.location?.toLowerCase().includes(searchLower) ||
                         activity.categories?.some(cat => cat.toLowerCase().includes(searchLower)) ||
                         activity.subcategory?.toLowerCase().includes(searchLower);

    const matchesTags = selectedTags.length === 0 ||
                       selectedTags.every(tag => activity.tags?.includes(tag));

    // Expired date check (using the same logic as CategoryPage)
    let isNotExpired = true; // Assume not expired if no date
    if (activity.expiredDate) {
      const nowUTC = new Date();
      const expirationStartOfDayUTC = parseMMDDYYYYToUTCDate(activity.expiredDate);
      if (expirationStartOfDayUTC) {
        const expirationMomentUTC = new Date(expirationStartOfDayUTC.getTime());
        expirationMomentUTC.setUTCDate(expirationMomentUTC.getUTCDate() + 1);
        isNotExpired = nowUTC.getTime() < expirationMomentUTC.getTime();
      }
    }

    return matchesSearch && matchesTags && isNotExpired;
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
      <h1 className="text-4xl font-bold text-center mb-8 text-earth-dark">Search Activities</h1>
      
      {/* Search Input - Use earth tones */}
      <div className="max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="Search by name, description, location, category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-earth-olive/50 rounded-lg focus:ring-2 focus:ring-earth-peach-light focus:border-transparent shadow-sm"
        />
      </div>

      {/* Tags Filter - Use earth tones */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-earth-dark">Filter by Tags</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm transition-colors duration-150 ${
                selectedTags.includes(tag)
                  ? 'bg-earth-peach text-earth-white shadow-md'
                  : 'bg-earth-blue/10 text-earth-dark hover:bg-earth-blue/20'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        {selectedTags.length > 0 && (
          <button
            onClick={() => setSelectedTags([])}
            className="mt-4 text-sm text-earth-peach hover:underline"
          >
            Clear selected tags
          </button>
        )}
      </div>

      {/* Results - Apply CategoryPage styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActivities.map((activity) => {
          // Parse and format date for display
          const expiredDateUTC = parseMMDDYYYYToUTCDate(activity.expiredDate);
          const displayDate = expiredDateUTC ? formatUTCDateToMMDDYYYY(expiredDateUTC) : null;

          return (
            <div
              key={activity.id}
              className="bg-white/90 rounded-lg shadow-lg p-4 border border-earth-olive/20 hover:shadow-xl transition-shadow duration-200 flex flex-col h-full"
            >
              <div className="flex-grow">
                 <h3 className="text-lg font-semibold text-earth-dark">
                  {activity.name}
                 </h3>
                 {activity.location && (
                     <p className="text-earth-olive mt-1 text-sm">
                      {activity.location}
                    </p>
                 )}
                 {activity.description && (
                    <p className="text-earth-dark/80 mt-2 text-sm">
                     {activity.description}
                    </p>
                  )}
                {displayDate && (
                    <p className="text-earth-olive mt-1 italic text-sm">
                      Expires on: {displayDate}
                    </p>
                 )}
                {activity.subcategory && (
                     <p className="text-earth-dark/60 mt-2 text-sm">
                       Subcategory: {activity.subcategory}
                     </p>
                 )}
                 {activity.categories && activity.categories.length > 0 && (
                   <p className="text-earth-dark/60 mt-1 text-xs">
                       Categories: {activity.categories.join(', ')}
                    </p>
                )}
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {activity.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-earth-blue/10 text-earth-dark rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

              {activity.websiteUrl && (
                <div className="mt-4 pt-2 border-t border-earth-olive/10">
                  <a
                    href={activity.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-3 py-1.5 bg-earth-peach text-earth-white text-sm rounded-md hover:bg-earth-peach-light transition-colors duration-150"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading && (
           <div className="text-center text-earth-dark">Loading activities...</div>
      )}
      {!loading && filteredActivities.length === 0 && (
        <div className="text-center text-earth-dark/70 mt-8">
          No activities found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default Search; 