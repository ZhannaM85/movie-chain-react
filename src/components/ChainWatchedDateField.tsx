import { useEffect, useRef, useState } from 'react';
import { useChainContext } from '../context/ChainContext';
import { useTranslation } from 'react-i18next';

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

interface ChainWatchedDateFieldProps {
  chainIndex: number;
  /** Prefix for stable input ids across the page. */
  idPrefix: string;
  /** Label visibility; use `sr-only` for compact sidebars. */
  labelClassName?: string;
  inputClassName?: string;
  /** Show hint when no date is set in view mode (default true). */
  showUnsetHint?: boolean;
  /** Optional wrapper for layout (e.g. flex row on chain page). */
  className?: string;
  /** In compact (sidebar) mode, align date row with title (`start`) or to the right (`end`). */
  compactContentAlign?: 'start' | 'end';
  /** When set (e.g. oldest link on chain page), show “remove first” beside the stats date row. */
  showRemoveFirstButton?: boolean;
  onRemoveFirst?: () => void;
}

/**
 * Edits which calendar day this chain link counts toward (heatmap / stats).
 * View mode shows the date, optional “remove first”, and a pencil; edit mode shows the date input.
 */
export default function ChainWatchedDateField({
  chainIndex,
  idPrefix,
  labelClassName = 'text-xs text-gray-500 shrink-0',
  inputClassName,
  showUnsetHint = true,
  className,
  compactContentAlign = 'end',
  showRemoveFirstButton = false,
  onRemoveFirst,
}: ChainWatchedDateFieldProps) {
  const { links, updateLoggedDate } = useChainContext();
  const { t, i18n } = useTranslation();
  const link = links[chainIndex];
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const id = `${idPrefix}-${chainIndex}`;
  const defaultInput =
    'px-2 py-1 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  const compact = labelClassName.includes('sr-only');

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditing(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing]);

  if (!link) return null;

  const formattedDateMedium = link.loggedDate
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
        new Date(`${link.loggedDate}T12:00:00`)
      )
    : null;

  const shortDateForSidebar = link.loggedDate
    ? new Intl.DateTimeFormat(i18n.language, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(`${link.loggedDate}T12:00:00`))
    : null;

  const baseRow = compact
    ? 'flex flex-row items-center gap-1 min-w-0 ' +
      (compactContentAlign === 'start' ? 'justify-start' : 'justify-end')
    : 'flex flex-wrap items-center gap-2';

  const compactInnerAlign =
    compactContentAlign === 'start' ? 'justify-start' : 'justify-end';

  const hasRemoveFirst = showRemoveFirstButton && onRemoveFirst;

  if (!editing) {
    const viewOuterClass =
      className ??
      (compact
        ? baseRow
        : hasRemoveFirst
          ? 'flex flex-wrap items-center gap-2 w-full'
          : baseRow);

    const viewInnerClass = compact
      ? `flex items-center gap-1 min-w-0 ${compactInnerAlign}${hasRemoveFirst ? ' w-full' : ''}`
      : hasRemoveFirst
        ? 'flex flex-1 min-w-0 items-center gap-2'
        : 'flex items-center gap-2 flex-wrap';

    return (
      <div className={viewOuterClass}>
        <span className={labelClassName}>{t('loggedDateShort')}</span>
        <div className={viewInnerClass}>
          {link.loggedDate && shortDateForSidebar ? (
            compact ? (
              <span
                className={`text-[10px] text-emerald-500/90 ${
                  compactContentAlign === 'start' ? 'break-words text-left' : 'truncate'
                }`}
                title={link.loggedDate}
              >
                {t('chainWatchedOn', { date: shortDateForSidebar })}
              </span>
            ) : (
              <time dateTime={link.loggedDate} className="text-sm text-gray-800 dark:text-gray-200 shrink-0">
                {formattedDateMedium}
              </time>
            )
          ) : (
            showUnsetHint && (
              <span className={compact ? 'text-[10px] text-gray-600 truncate' : 'text-[10px] text-gray-600'}>
                {t('loggedDateUnsetHint')}
              </span>
            )
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="p-1 rounded-md text-gray-500 hover:text-indigo-700 dark:hover:text-indigo-600 dark:text-indigo-400 hover:bg-gray-100/90 dark:bg-gray-800/80 transition-colors shrink-0"
            aria-label={t('editWatchedDateAria')}
          >
            <PencilIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          {hasRemoveFirst && (
            <button
              type="button"
              onClick={onRemoveFirst}
              className="text-xs shrink-0 px-2 py-1 rounded-md border border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:text-red-800 dark:text-red-300 hover:border-red-500/40 transition-colors ml-auto"
            >
              {t('removeFirstFromChain')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className ?? 'flex flex-wrap items-center gap-2'}>
      <label htmlFor={id} className={labelClassName}>
        {t('loggedDateShort')}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="date"
        value={link.loggedDate ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          if (v) updateLoggedDate(chainIndex, v);
        }}
        className={inputClassName ?? defaultInput}
      />
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="p-1 rounded-md text-emerald-500/90 hover:text-emerald-400 hover:bg-gray-100/90 dark:bg-gray-800/80 transition-colors shrink-0"
        aria-label={t('finishWatchedDateEditAria')}
      >
        <CheckIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
