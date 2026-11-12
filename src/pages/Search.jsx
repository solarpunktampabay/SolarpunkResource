import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchActivities } from '../services/googleSheets';
import { parseMMDDYYYYToUTCDate } from '../utils/dateUtils';
import ActivityCard from '../components/ActivityCard';

const Search = () => {
  const [activities, setActivities] = useState([]);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  // Keep the box in sync when arriving from the menu's search form
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);
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
    return (
      <div className="byline py-24 text-center" role="status">
        Loading resources…
      </div>
    );
  }

  return (
    <div>
      <header className="max-w-3xl">
        <p className="byline">Search</p>
        <h1 className="headline-xl mt-4">Search all resources.</h1>
      </header>

      {/* Search input */}
      <div className="mt-8 max-w-3xl">
        <label htmlFor="search" className="sr-only">
          Search resources
        </label>
        <input
          id="search"
          type="search"
          placeholder="Search by name, description, location, category…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="field !px-5 !py-4 !text-lg"
        />
      </div>

      {/* Tag filter */}
      <div className="mt-12">
        <div className="section-title flex items-baseline justify-between gap-4">
          <h2>Filter by tag</h2>
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="font-sans text-sm font-bold underline underline-offset-4"
            >
              Clear ({selectedTags.length})
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-pressed={selectedTags.includes(tag)}
              onClick={() => toggleTag(tag)}
              className={`chip ${selectedTags.includes(tag) ? 'chip-active' : ''}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="mt-14">
        <div className="section-title flex items-baseline justify-between gap-4">
          <h2>Results</h2>
          <span className="font-sans text-sm font-bold">
            {filteredActivities.length} {filteredActivities.length === 1 ? 'resource' : 'resources'}
          </span>
        </div>

        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {filteredActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} showMeta />
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="title-serif py-12 text-muted">
            No activities found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
