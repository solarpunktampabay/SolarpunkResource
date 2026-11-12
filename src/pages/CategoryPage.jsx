import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchActivities } from '../services/googleSheets';
import { parseMMDDYYYYToUTCDate } from '../utils/dateUtils';
import { categories, categoryMapping } from '../data/categories';
import ActivityCard from '../components/ActivityCard';

const CategoryPage = () => {
  const { categoryId } = useParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubcategory, setExpandedSubcategory] = useState(null);

  // Get the display name for the category
  const displayCategoryName = categoryMapping[categoryId] || categoryId;
  const categoryMeta = categories.find((c) => c.id === categoryId);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await fetchActivities();
        console.log('Fetched activities:', data);

        // Filter activities by category
        let filteredActivities = data.filter(activity => {
          const match = activity.categories?.includes(displayCategoryName);
          console.log(`Activity "${activity.name}" has categories [${activity.categories?.join(', ')}] - Exact match: ${match}`);
          return match;
        });

        // If no exact matches, try flexible matching
        if (filteredActivities.length === 0) {
          console.log("No exact matches found. Trying flexible matching:");
          filteredActivities = data.filter(activity => {
            return activity.categories?.some(cat =>
              cat.toLowerCase().includes(categoryId.toLowerCase()) ||
              categoryId.toLowerCase().includes(cat.toLowerCase().split(',')[0].trim())
            );
          });
        }

        // Filter out expired activities. Treat expiration date "MM-DD-YYYY" as the end of that day.
        const nowUTC = new Date(); // Current instant in time (UTC)

        filteredActivities = filteredActivities.filter(activity => {
          if (activity.expiredDate) {
            // Parse the date string to the START of that day in UTC
            const expirationStartOfDayUTC = parseMMDDYYYYToUTCDate(activity.expiredDate);

            if (!expirationStartOfDayUTC) {
              console.warn(`Invalid or unparseable expiredDate for activity "${activity.name}":`, activity.expiredDate);
              return true; // Keep items with invalid dates
            }

            // Calculate the expiration moment: START of the *next* day in UTC
            // This represents the very end of the expiration day.
            const expirationMomentUTC = new Date(expirationStartOfDayUTC.getTime());
            expirationMomentUTC.setUTCDate(expirationMomentUTC.getUTCDate() + 1);

            // Keep the item if the current time is strictly *before* the expiration moment
            return nowUTC.getTime() < expirationMomentUTC.getTime();
          }
          return true; // Keep items without an expiredDate
        });

        console.log('Filtered activities:', filteredActivities);
        setActivities(filteredActivities);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [categoryId, displayCategoryName]);

  // Group activities by subcategory
  const activitiesBySubcategory = activities.reduce((acc, activity) => {
    const subcategory = activity.subcategory || 'Uncategorized';
    if (!acc[subcategory]) {
      acc[subcategory] = [];
    }
    acc[subcategory].push(activity);
    return acc;
  }, {});


  // Loading state
  if (loading) {
    return (
      <div className="byline py-24 text-center" role="status">
        Loading resources…
      </div>
    );
  }

  const subcategoryEntries = Object.entries(activitiesBySubcategory);

  return (
    <div>
      {/* Page header */}
      <header>
        {categoryMeta && (
          <div className="overflow-hidden bg-forest">
            <img
              src={categoryMeta.bgImg}
              alt=""
              className="aspect-[4/3] max-h-[640px] w-full object-cover sm:aspect-[16/9] lg:aspect-[2/1]"
            />
          </div>
        )}

        <div className="mt-8 sm:mt-10">
          <p className="byline dots flex flex-wrap">
            <span>Topic</span>
            <span>
              {activities.length} {activities.length === 1 ? 'resource' : 'resources'}
              {subcategoryEntries.length > 0 &&
                ` in ${subcategoryEntries.length} ${subcategoryEntries.length === 1 ? 'section' : 'sections'}`}
            </span>
          </p>
          <h1 className="headline-xl mt-4">{displayCategoryName}</h1>
          {categoryMeta?.blurb && <p className="deck mt-5 max-w-2xl">{categoryMeta.blurb}</p>}
        </div>
      </header>

      {activities.length === 0 && (
        <p className="title-serif mt-12 border-y border-dotted border-ink py-8 text-muted">
          No activities found for this category. Please check your data in Google Sheets.
        </p>
      )}

      {/* Subcategory sections */}
      <div className="mt-14">
        {subcategoryEntries.map(([subcategory, subcategoryActivities]) => {
          const isOpen = expandedSubcategory === subcategory;
          return (
            <section key={subcategory} className="rule-b first:border-t first:border-dotted first:border-ink">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setExpandedSubcategory(isOpen ? null : subcategory)}
                className="group flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <h2 className="font-display text-2xl font-medium tracking-[-0.003em] group-hover:underline underline-offset-4 decoration-1 sm:text-[28px]">
                  {subcategory}
                </h2>
                <span className="flex shrink-0 items-center gap-3 font-sans text-sm font-bold">
                  <span>{subcategoryActivities.length}</span>
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-8 w-8 items-center justify-center border border-forest text-lg leading-none transition-colors ${
                      isOpen ? 'bg-forest text-white' : 'bg-white text-forest group-hover:bg-forest group-hover:text-white'
                    }`}
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </span>
              </button>

              {isOpen && (
                <div className="grid gap-x-8 gap-y-10 pb-10 pt-3 sm:grid-cols-2 lg:grid-cols-3">
                  {subcategoryActivities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryPage;
