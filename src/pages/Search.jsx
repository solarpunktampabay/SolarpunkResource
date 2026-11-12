import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchActivities } from '../services/googleSheets';
import { parseMMDDYYYYToUTCDate } from '../utils/dateUtils';
import { buildTagIndex } from '../utils/tags';
import ActivityCard from '../components/ActivityCard';

// How many of the most-used tags are shown before "Show all tags"
const VISIBLE_TAGS = 15;

// True unless the listing's expiration date (end of that day) has passed
const isNotExpired = (activity) => {
  if (!activity.expiredDate) return true; // no date: assume still open
  const start = parseMMDDYYYYToUTCDate(activity.expiredDate);
  if (!start) return true;
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + 1);
  return Date.now() < end.getTime();
};

const Search = () => {
  const [activities, setActivities] = useState([]);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  // Keep the box in sync when arriving from the menu's search form
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);
  const [selectedKeys, setSelectedKeys] = useState([]); // tag-group keys
  const [loading, setLoading] = useState(true);
  const [showAllTags, setShowAllTags] = useState(false);
  const [tagQuery, setTagQuery] = useState('');

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await fetchActivities();
        setActivities(data);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  // Only listings that are still open, so tag counts match what the results show
  const openActivities = useMemo(() => activities.filter(isNotExpired), [activities]);

  // Smart tag groups ("USF Specific" + "USF" + "usf" are one chip) and which groups
  // each listing belongs to. See src/utils/tags.js.
  const { groups, keysByActivity } = useMemo(() => buildTagIndex(openActivities), [openActivities]);

  const filteredActivities = openActivities.filter((activity) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      activity.name?.toLowerCase().includes(searchLower) ||
      activity.description?.toLowerCase().includes(searchLower) ||
      activity.location?.toLowerCase().includes(searchLower) ||
      activity.categories?.some((cat) => cat.toLowerCase().includes(searchLower)) ||
      activity.subcategory?.toLowerCase().includes(searchLower);

    const activityKeys = keysByActivity.get(activity.id);
    const matchesTags =
      selectedKeys.length === 0 || selectedKeys.every((key) => activityKeys?.has(key));

    return matchesSearch && matchesTags;
  });

  const toggleTag = (key) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Tags to draw. Collapsed: the most-used few, plus anything already selected so the
  // active filters never disappear. Expanded: everything (optionally narrowed by the box).
  const tagQueryLower = tagQuery.trim().toLowerCase();
  const visibleGroups = (() => {
    if (!showAllTags) {
      const top = groups.slice(0, VISIBLE_TAGS);
      const extraSelected = groups.filter(
        (g) => selectedKeys.includes(g.key) && !top.includes(g)
      );
      return [...top, ...extraSelected];
    }
    if (!tagQueryLower) return groups;
    return groups.filter((g) => g.variants.some((v) => v.toLowerCase().includes(tagQueryLower)));
  })();
  const hiddenCount = Math.max(0, groups.length - VISIBLE_TAGS);

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
          {selectedKeys.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedKeys([])}
              className="font-sans text-sm font-bold underline underline-offset-4"
            >
              Clear ({selectedKeys.length})
            </button>
          )}
        </div>

        {showAllTags && (
          <div className="mb-4 max-w-md">
            <label htmlFor="tag-find" className="sr-only">
              Find a tag
            </label>
            <input
              id="tag-find"
              type="search"
              placeholder="Find a tag…"
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              className="field !py-2.5 !text-base"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {visibleGroups.map((group) => {
            const active = selectedKeys.includes(group.key);
            return (
              <button
                key={group.key}
                type="button"
                aria-pressed={active}
                onClick={() => toggleTag(group.key)}
                title={
                  group.variants.length > 1
                    ? `Also matches: ${group.variants.filter((v) => v !== group.label).join(', ')}`
                    : undefined
                }
                className={`chip ${active ? 'chip-active' : ''}`}
              >
                {group.label}
                <span className="ml-1.5 font-normal opacity-70">{group.count}</span>
              </button>
            );
          })}
          {showAllTags && visibleGroups.length === 0 && (
            <p className="font-serif text-lg text-muted">No tags match “{tagQuery}”.</p>
          )}
        </div>

        {hiddenCount > 0 && (
          <button
            type="button"
            aria-expanded={showAllTags}
            onClick={() => {
              setShowAllTags((v) => !v);
              setTagQuery('');
            }}
            className="mt-4 font-sans text-sm font-bold underline underline-offset-4 hover:decoration-2"
          >
            {showAllTags ? 'Show fewer tags' : `Show all tags (${groups.length})`}
          </button>
        )}
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
