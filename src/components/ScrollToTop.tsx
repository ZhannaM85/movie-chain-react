import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Scrolls the window to the top whenever the route pathname changes,
 * but skips the scroll on back/forward (POP) navigation so the browser
 * can restore the previous scroll position naturally.
 *
 * @returns {null} Always renders nothing.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navigationType]);

  return null;
}
