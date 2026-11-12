import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import LazyScript from './components/LazyScript.jsx';
import Home from './pages/Home.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import Search from './pages/Search.jsx';
import Recommend from './pages/Recommend.jsx';
import AboutPage from './pages/AboutPage.jsx';
import CheckLinks from './pages/CheckLinks.jsx';
import './App.css';
import './index.css';
import './nav.css';

function App() {
  return (
    <Router>
      <ScrollToTop />
      {/* Third-party widget, loaded after the page finishes loading */}
      <LazyScript
        src="https://imgnilabs.com/widget.js"
        attrs={{ 'data-project': 'cmwdw9iw907qss60qxtubmps7' }}
      />
      <div className="min-h-screen bg-paper text-ink flex flex-col">
        <Navbar />
        <main id="main" className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/category/:categoryId"
              element={<div className="page-wrap py-10 sm:py-14 sm:pb-24"><CategoryPage /></div>}
            />
            <Route
              path="/search"
              element={<div className="page-wrap py-10 sm:py-14 sm:pb-24"><Search /></div>}
            />
            <Route
              path="/recommend"
              element={<div className="page-wrap py-10 sm:py-14 sm:pb-24"><Recommend /></div>}
            />
            <Route
              path="/check-links"
              element={<div className="page-wrap py-10 sm:py-14 sm:pb-24"><CheckLinks /></div>}
            />
            <Route
              path="/about"
              element={<div className="page-wrap py-10 sm:py-14 sm:pb-24"><AboutPage /></div>}
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
