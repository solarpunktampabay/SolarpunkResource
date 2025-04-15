import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchActivities } from '../services/googleSheets';

// Helper function to parse MM-DD-YYYY string into a Date object (UTC start of day)
// Returns null if the format is invalid or the date doesn't exist
const parseMMDDYYYYToUTCDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  const parts = dateString.split('-'); // Expects MM-DD-YYYY
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Basic validation for numeric parts
    if (isNaN(month) || isNaN(day) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31) {
      console.warn(`Invalid date components in: ${dateString}`);
      return null;
    }

    // Use Date.UTC to create the date timestamp (milliseconds since epoch)
    // Note: month is 0-indexed in Date.UTC (0 for January, 11 for December)
    const utcTimestamp = Date.UTC(year, month - 1, day);

    // Create a Date object from the UTC timestamp
    const date = new Date(utcTimestamp);

    // Final validation: Check if the components of the created Date object match the input
    // This catches invalid dates like 02-30-2024, as Date.UTC might adjust them (e.g., to March 1st)
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
       console.warn(`Invalid date (e.g., Feb 30) detected after UTC conversion: ${dateString}`);
       return null; // Return null for dates that don't actually exist
    }

    return date; // Return the valid Date object representing UTC start of day

  }
  console.warn(`Invalid date format encountered (expected MM-DD-YYYY): ${dateString}`);
  return null; // Return null for invalid format
};

const CategoryPage = () => {
  const { categoryId } = useParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubcategory, setExpandedSubcategory] = useState(null);

  // Category mapping for display --> try to automate it
  const categoryMapping = {
    'Internship': 'Internship, Grant, Job Opportunity, Graduate School',
    'Home': 'Upgrade your Home',
    'Work': 'At work',
    'Community': 'Community Engagement',
    'Waste': 'Waste Reduction/ Disposal',
    'Government': 'Government',
    'USF': 'USF Specific (Go Bulls!)',
    'Donate': 'Donate/ Use your Resources',
    'Entertainment': 'Entertainment, Utility, Education, News'
  };

  // Get the display name for the category
  const displayCategoryName = categoryMapping[categoryId] || categoryId;

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

        // Filter out expired activities
        const today = new Date();
        filteredActivities = filteredActivities.filter(activity => {
          if (activity.expiredDate) {
            const expiredDate = new Date(activity.expiredDate);
            if (isNaN(expiredDate)) {
              console.warn(`Invalid expiredDate for activity "${activity.name}":`, activity.expiredDate);
              return true; // Keep items with invalid dates
            }
            return expiredDate >= today; // Keep only non-expired items
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

  if (loading) {
    return <div className="text-center text-earth-dark">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-earth-dark">
        {displayCategoryName}
      </h1>
      
      {activities.length === 0 && !loading && (
        <div className="p-4 bg-earth-white text-earth-dark rounded-md border border-earth-dark/20">
          No activities found for this category. Please check your data in Google Sheets.
        </div>
      )}
      
      <div className="space-y-4">
        {Object.entries(activitiesBySubcategory).map(([subcategory, subcategoryActivities]) => (
          <div 
            key={subcategory}
            className="bg-earth-white/80 rounded-lg p-4 border border-earth-olive shadow-md backdrop-blur-sm"
          >
            <button
              onClick={() => setExpandedSubcategory(
                expandedSubcategory === subcategory ? null : subcategory
              )}
              className="w-full text-left flex justify-between items-center"
            >
              <h2 className="text-xl font-semibold text-earth-dark">
                {subcategory}
              </h2>
              <span className="text-earth-peach">
                {expandedSubcategory === subcategory ? '▼' : '▶'}
              </span>
            </button>
            
            {expandedSubcategory === subcategory && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subcategoryActivities.map((activity) => {
                  // Parse and format the date here
                  const formattedDate = parseMMDDYYYYToUTCDate(activity.expiredDate);

                  return (
                    <div
                      key={activity.id}
                      className="bg-white/90 rounded-lg shadow-lg p-4 border border-earth-olive/20 hover:shadow-xl transition-shadow duration-200"
                    >
                      <h3 className="text-lg font-semibold text-earth-dark">
                        {activity.name}
                      </h3>
                      <p className="text-earth-olive mt-1">
                        {activity.location}
                      </p>
                      <p className="text-earth-dark/80 mt-2">
                        {activity.description}
                      </p>
                      {/* Conditionally render the date if it's valid */}
                      {formattedDate && formattedDate !== "Invalid Date" && (
                        <p className="text-earth-olive mt-1 italic ">
                          Expires on: {formattedDate.toLocaleDateString()}
                        </p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {activity.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-earth-blue/10 text-earth-dark rounded-full text-sm"
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
                          className="mt-4 inline-block px-4 py-2 bg-earth-peach text-earth-white rounded-md hover:bg-earth-peach-light transition-colors"
                        >
                          Visit Website
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPage;