import React from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../data/categories';
import { RECOMMEND_URL, Wordmark } from './Navbar';

const linkCls = 'hover:underline underline-offset-4';

// forest footer with dotted rules, echoing Grist's closing stretch.
const Footer = () => (
  <footer className="bg-forest text-white">
    <div className="page-wrap pb-10 pt-16 sm:pt-20">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_2fr]">
        <div>
          <Link to="/" aria-label="Practical Connections home">
            <Wordmark className="text-[40px] sm:text-[52px]" />
          </Link>
          <p className="deck mt-5 max-w-md">
            A student-built guide to the people, programs, and opportunities that
            help Tampa grow greener. Free to use and share.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={RECOMMEND_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-sprout"
            >
              Recommend a resource
            </a>
            <Link to="/search" className="btn-white">
              Search
            </Link>
          </div>
        </div>

        <div className="grid gap-10 sm:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="section-title">Topics</h2>
            <ul className="grid grid-cols-1 gap-x-8 gap-y-2.5 font-sans text-base font-bold sm:grid-cols-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link to={`/category/${encodeURIComponent(c.id)}`} className={linkCls}>
                    {c.short}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="section-title">More</h2>
            <ul className="space-y-2.5 font-sans text-base font-bold">
              <li>
                <Link to="/search" className={linkCls}>Search</Link>
              </li>
              <li>
                <Link to="/about" className={linkCls}>About</Link>
              </li>
              <li>
                <Link to="/check-links" className={linkCls}>Check links</Link>
              </li>
              <li>
                <a
                  href={RECOMMEND_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkCls}
                >
                  Recommend
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rule-t mt-14 flex flex-col justify-between gap-2 pt-5 font-sans text-sm font-bold sm:flex-row">
        <span>
          © {new Date().getFullYear()} Practical Connections. Created with USF Honors students.
        </span>
        <span>Free for you to use and share.</span>
      </div>
    </div>
  </footer>
);

export default Footer;
