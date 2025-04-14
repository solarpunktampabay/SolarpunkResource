import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-earth-dark shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              to="/"
              className="flex items-center px-2 py-2 text-earth-white hover:text-earth-peach transition-colors"
            >
              <span className="text-xl font-semibold">Practical Connections</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/search"
              className="px-3 py-2 rounded-md text-earth-white hover:text-earth-peach hover:bg-earth-dark-light transition-colors"
            >
              Search
            </Link>
            <Link
              to="/recommend"
              className="px-3 py-2 rounded-md text-earth-white hover:text-earth-peach hover:bg-earth-dark-light transition-colors"
            >
              Recommend
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 