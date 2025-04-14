import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchActivities } from '../services/googleSheets';

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
                {subcategoryActivities.map((activity) => (
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
                    <p className="text-earth-olive mt-1 italic ">
                      {activity.expiredDate && `Expires on: ${new Date(activity.expiredDate).toLocaleDateString('en-US', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit'
                      })}`}
                    </p>
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
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPage;