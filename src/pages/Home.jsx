import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { testGoogleSheets } from '../services/testGoogleSheets';

//transparent background added
const categories = [
  {
    id: 'Internship',
    name: 'Internship, Grant, Job Opportunity, Graduate School',
    bgImg: '/image/internship.jpg'
  },
  {
    id: 'Home',
    name: 'Upgrade your Home',
    bgImg: '/image/athome.jpg'
  },
  {
    id: 'Work',
    name: 'At work',
    bgImg: '/image/atwork.jpg'
  },
  {
    id: 'Community',
    name: 'Community Engagement',
    bgImg: '/image/community.jpg'
  },
  {
    id: 'Waste',
    name: 'Waste Reduction/ Disposal',
    bgImg: '/image/waste.jpg'
  },
  {
    id: 'Government',
    name: 'Government',
    bgImg: '/image/government.jpg'
  },
  {
    id: 'USF',
    name: 'USF Specific (Go Bulls!)',
    bgImg: '/image/usf.png'
  },
  {
    id: 'Donate',
    name: 'Donate/ Use your Resources',
    bgImg: '/image/donation.jpeg'
  },
  {
    id: 'Entertainment',
    name: 'Entertainment, Utility, Education, News',
    bgImg: '/image/entertainment.jpg'
  }
];

const Home = () => {
  useEffect(() => {
    // Run the test when the component mounts
    const runTest = async () => {
      console.log('Running Google Sheets API test...');
      const result = await testGoogleSheets();
      console.log('Test result:', !!result);
    };
    
    runTest();
  }, []);
  
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-center mb-12 text-earth-dark">
        Find an opportunity to grow green!
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
  key={category.id}
  className="relative rounded-2xl overflow-hidden group"
>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${category.bgImg})` }}
      />
      <Link
        to={`/category/${encodeURIComponent(category.id)}`}
        className={`
          ${category.color}
          relative z-10
          rounded-2xl py-6 px-8
          transform hover:scale-105 transition-all duration-300
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          min-h-[150px]
          text-olive-light
          text-center
        `}
      >
        <h2 className="text-xl font-semibold">{category.name}</h2>
      </Link>
    </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home; 
