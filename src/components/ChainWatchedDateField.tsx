import { useChainContext } from '../context/ChainContext';
import { useTranslation } from 'react-i18next';

interface ChainWatchedDateFieldProps {
  chainIndex: number;
  /** Prefix for stable input ids across the page. */
  idPrefix: string;
  /** Label visibility; use `sr-only` for compact sidebars. */
  labelClassName?: string;
  inputClassName?: string;
  /** Show hint when no date is set (default true). */
  showUnsetHint?: boolean;
  /** Optional wrapper for layout (e.g. flex row on chain page). */
  className?: string;
}

/**
 * Edits which calendar day this chain link counts toward (heatmap / stats).
 */
export default function ChainWatchedDateField({
  chainIndex,
  idPrefix,
  labelClassName = 'text-xs text-gray-500 shrink-0',
  inputClassName,
  showUnsetHint = true,
  className,
}: ChainWatchedDateFieldProps) {
  const { links, updateLoggedDate } = useChainContext();
  const { t } = useTranslation();
  const link = links[chainIndex];
  if (!link) return null;

  const id = `${idPrefix}-${chainIndex}`;
  const defaultInput =
    'px-2 py-1 rounded-md bg-gray-900 border border-gray-700 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  return (
    <div className={className ?? 'flex flex-wrap items-center gap-2'}>
      <label htmlFor={id} className={labelClassName}>
        {t('loggedDateShort')}
      </label>
      <input
        id={id}
        type="date"
        value={link.loggedDate ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          if (v) updateLoggedDate(chainIndex, v);
        }}
        className={inputClassName ?? defaultInput}
      />
      {showUnsetHint && !link.loggedDate && (
        <span className="text-[10px] text-gray-600">{t('loggedDateUnsetHint')}</span>
      )}
    </div>
  );
}
