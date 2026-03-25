import { useTranslation } from 'react-i18next';

/**
 * Renders localized challenge points for a chain link when {@link points} is set.
 */
export default function ChallengePointsInline({
  points,
  className = 'text-gray-500 tabular-nums',
}: {
  points: number | null | undefined;
  className?: string;
}) {
  const { t } = useTranslation();
  if (points == null) return null;
  return (
    <span className={className} title={t('challengePointsTooltip')}>
      {t('challengePointsShort', { points })}
    </span>
  );
}
