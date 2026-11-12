import { useEffect } from 'react';

// Loads an external script once the page has finished loading, so it never slows the
// first paint. This is the plain-React equivalent of Next.js's
// <Script strategy="lazyOnload" />, which isn't available in a Vite app.
//
// `attrs` are copied onto the <script> tag, e.g. { 'data-project': '...' }.
const LazyScript = ({ src, attrs = {} }) => {
  useEffect(() => {
    const alreadyLoaded = () => document.querySelector(`script[src="${src}"]`);
    if (alreadyLoaded()) return undefined;

    let timer;
    const load = () => {
      // Wait for the browser to be idle (or a short delay where that isn't supported)
      timer = window.setTimeout(() => {
        if (alreadyLoaded()) return;
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        Object.entries(attrs).forEach(([name, value]) => script.setAttribute(name, value));
        document.body.appendChild(script);
      }, 0);
    };

    if (document.readyState === 'complete') {
      load();
      return () => window.clearTimeout(timer);
    }
    window.addEventListener('load', load, { once: true });
    return () => {
      window.removeEventListener('load', load);
      window.clearTimeout(timer);
    };
    // The script should be added once per page load, so the props are read only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default LazyScript;
