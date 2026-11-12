import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { categories } from '../data/categories';

export const RECOMMEND_URL = 'https://forms.gle/hdSHy8kjSz4giBsW9';

// Simple sprout mark, used as a small brand glyph.
export const LogoMark = ({ className = 'h-6 w-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M12 22V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 12C12 7.5 8.5 4.5 3 4.5c0 4.8 3.2 7.5 9 7.5Z" fill="currentColor" />
    <path d="M12 14.5c0-4 3-7 9-7 0 4.6-3.4 7-9 7Z" fill="currentColor" opacity=".6" />
  </svg>
);

// Big serif wordmark, the way Grist treats its name.
export const Wordmark = ({ className = '' }) => (
  <span
    className={`font-serif font-semibold leading-none tracking-[-0.045em] ${className}`}
  >
    Practical Connections
  </span>
);

const href = (c) => `/category/${encodeURIComponent(c.id)}`;

// Two-bar hamburger (26 x 12), like Grist's
const MenuIcon = () => (
  <svg className="nav__menu-icon" viewBox="0 0 26 12" fill="none" aria-hidden="true">
    <path d="M0 1h26M0 11h26" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="close-button__icon"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="m2 2 16 16M18 2 2 18" />
  </svg>
);

const MenuTrigger = ({ onClick, expanded }) => (
  <button
    type="button"
    className="nav__menu-trigger"
    aria-label="Open menu"
    aria-expanded={expanded}
    aria-controls="menu"
    onClick={onClick}
  >
    <MenuIcon />
  </button>
);

const RecommendButton = () => (
  <a
    href={RECOMMEND_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="nav-button"
  >
    Recommend
  </a>
);

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null);

  const closeMenu = () => setMenuOpen(false);

  // Close the menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  // Compact bar slides in after ~120px of scrolling, and tucks away near the top
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setShowSticky((prev) => (y > 120 ? true : y < 30 ? false : prev));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // While the menu is open: lock page scroll, close on Escape, move focus into it
  useEffect(() => {
    document.body.classList.toggle('js-menu-active', menuOpen);
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    if (!menuOpen) return undefined;

    const focusTimer = setTimeout(() => menuRef.current?.focus(), 50);
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = '';
      document.body.classList.remove('js-menu-active');
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100003] focus:bg-white focus:px-4 focus:py-2 focus:font-sans focus:font-bold focus:text-ink"
      >
        Skip to content
      </a>

      {/* ───────── Main bar (scrolls away with the page) ───────── */}
      <header className="main-header">
        <nav className="main-nav" aria-label="Primary">
          <div className="page-wrap">
            <div className="main-nav__content">
              <span className="main-nav__tagline">A guide to growing green in Tampa</span>

              <div className="site-logo">
                <Link
                  to="/"
                  className="site-logo__link"
                  aria-label="Practical Connections home"
                >
                  <Wordmark className="site-logo__logo" />
                </Link>
              </div>

              <div className="main-nav__nav">
                <ul className="nav__items">
                  <li className="nav__item nav__item--link">
                    <Link to="/search" className="nav__item-link">
                      Search
                    </Link>
                  </li>
                  <li className="nav__item nav__item--button">
                    <RecommendButton />
                  </li>
                </ul>
                <MenuTrigger onClick={() => setMenuOpen(true)} expanded={menuOpen} />
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* ───────── Compact bar (slides down on scroll) ───────── */}
      <div className={`sticky-bar ${showSticky ? 'is-visible' : ''}`}>
        <div className="sticky-bar__inner">
          <Link
            to="/"
            className="site-logo__link"
            aria-label="Practical Connections home"
            tabIndex={showSticky ? 0 : -1}
          >
            <Wordmark className="site-logo__logo" />
          </Link>
          <div className="sticky-bar__actions">
            <RecommendButton />
            <button
              type="button"
              className="nav__menu-trigger"
              aria-label="Open menu"
              aria-controls="menu"
              tabIndex={showSticky ? 0 : -1}
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </div>

      {/* ───────── Menu: mask + panel ───────── */}
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={closeMenu}
        className={`menu__mask ${menuOpen ? 'is-active' : ''}`}
      />

      <nav
        id="menu"
        ref={menuRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-label"
        aria-hidden={!menuOpen}
        className={`menu ${menuOpen ? 'is-active' : ''}`}
      >
        <h2 id="menu-label" hidden>
          Menu
        </h2>

        <div className="menu__close-button">
          <button
            type="button"
            className="close-button"
            aria-label="Close menu"
            onClick={closeMenu}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="menu__inner">
          <div className="menu__section menu__section-topics">
            <h2 className="subsection-header">Topics</h2>
            <ul className="menu__topics">
              {categories.map((c) => (
                <li key={c.id} className="menu__topic">
                  <Link to={href(c)} className="menu__topic-link">
                    <svg
                      className="menu__intersection-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      aria-hidden="true"
                    >
                      <path d="M3 12h17M13 5l7 7-7 7" />
                    </svg>
                    <span className="menu__topic-name">{c.short}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
