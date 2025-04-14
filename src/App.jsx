import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import Search from './pages/Search.jsx';
import Recommend from './pages/Recommend.jsx';
import './App.css';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-earth-white to-earth-blue/10">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/search" element={<Search />} />
            <Route path="/recommend" element={<Recommend />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
