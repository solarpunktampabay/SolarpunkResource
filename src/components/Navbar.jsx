import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-earth-blue p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold">Solarpunk Connections</Link>
        <ul className="flex space-x-6">
          <li><Link to="/" className="text-white hover:text-earth-peach transition-colors duration-300">Home</Link></li>
          <li><Link to="/search" className="text-white hover:text-earth-peach transition-colors duration-300">Search</Link></li>
          <li>
            <a 
              href="https://forms.gle/hdSHy8kjSz4giBsW9" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-earth-peach transition-colors duration-300"
            >
              Recommend
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar; 
