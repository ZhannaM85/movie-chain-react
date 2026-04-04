import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type MovieOverviewClampProps = {
  overview: string;
  /** Typography / color classes for the overview text */
  className: string;
  /** Resets “read more” when the movie (or row) changes */
  resetKey: string | number;
  /** If set, desktop (sm+) renders the full overview as a link to this path */
  linkTo?: string;
  /** When false, desktop renders plain text (no link) */
  showLink?: boolean;
};

const MOBILE_MQ = '(max-width: 639px)';

/**
 * Mobile: clamps to 4 lines with optional read more / show less (avoids putting line-clamp on {@link Link}, which is unreliable).
 * Desktop: full overview; optionally wrapped in a link to the movie page.
 */
export default function MovieOverviewClamp({
  overview,
  className,
  resetKey,
  linkTo,
  showLink = true,
}: MovieOverviewClampProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const mobileParagraphRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setExpanded(false);
  }, [resetKey]);

  useLayoutEffect(() => {
    const el = mobileParagraphRef.current;
    if (!el || typeof window.matchMedia !== 'function') {
      setOverflows(false);
      return;
    }
    const mq = window.matchMedia(MOBILE_MQ);
    const measure = () => {
      if (!mq.matches || expanded) {
        setOverflows(false);
        return;
      }
      requestAnimationFrame(() => {
        const node = mobileParagraphRef.current;
        if (!node) return;
        setOverflows(node.scrollHeight > node.clientHeight + 1);
      });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    mq.addEventListener('change', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      mq.removeEventListener('change', measure);
    };
  }, [overview, expanded, resetKey]);

  const showToggle = Boolean(overview) && (expanded || overflows);
  const mobilePClass = `${className} min-w-0 ${!expanded ? 'line-clamp-4' : ''}`;

  const desktopBody =
    linkTo && showLink ? (
      <Link to={linkTo} className={`block min-w-0 ${className} hover:text-gray-700 dark:text-gray-300 transition-colors`}>
        {overview}
      </Link>
    ) : (
      <p className={`min-w-0 ${className}`}>{overview}</p>
    );

  return (
    <div className="min-w-0">
      <div className="sm:hidden">
        <p ref={mobileParagraphRef} className={mobilePClass}>
          {overview}
        </p>
        {showToggle && (
          <button
            type="button"
            className="mt-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? t('overviewShowLess') : t('overviewReadMore')}
          </button>
        )}
      </div>
      <div className="hidden sm:block">{desktopBody}</div>
    </div>
  );
}
