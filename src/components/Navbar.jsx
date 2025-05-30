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
              to="/about"
              className="px-3 py-2 rounded-md text-earth-white hover:text-earth-peach hover:bg-earth-dark-light transition-colors"
            >
              About
            </Link>
            <Link
              to="/search"
              className="px-3 py-2 rounded-md text-earth-white hover:text-earth-peach hover:bg-earth-dark-light transition-colors"
            >
              Search
            </Link>
            
            <a
              href="https://forms.gle/hdSHy8kjSz4giBsW9"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-md text-earth-white hover:text-earth-peach hover:bg-earth-dark-light transition-colors"
            >
              Recommend
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 
