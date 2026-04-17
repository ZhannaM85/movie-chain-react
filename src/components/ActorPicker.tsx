import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { eligibleActorIdsForRandomPick, pickRandomSelectableId, stableRng } from '../lib/randomSinglePick';
import type { MovieCredits } from '../types/movie';
import { useChainContext } from '../context/ChainContext';
import ActorCard from './ActorCard';
import { useTranslation } from 'react-i18next';
import { scoreActorContribution, scoreChainStep } from '../gamification/chainScoring';
import { bridgeActorStepByActorId, usedBridgeActorIds, formatCrossListEntries } from '../utils/chainLinks';
import { useChainUiPreferences } from '../hooks/useChainUiPreferences';
import { findFirstSelectableActorId } from '../lib/sequentialSelection';

interface ActorPickerProps {
  credits: MovieCredits;
}

/**
 * Shows the main cast for a movie and lets the user pick an actor to continue the chain.
 * Uses credits passed from parent to avoid duplicate API calls.
 *
 * @param {ActorPickerProps} props - The component props.
 * @returns {JSX.Element} The rendered actor picker.
 */
function ChevronToggleIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-5 h-5 transition-transform ${expanded ? '' : '-rotate-90'}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function ActorPicker({ credits }: ActorPickerProps) {
  const { selectActor, prependMode, links, crossListData } = useChainContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const [actorsExpanded, setActorsExpanded] = useState(true);

  const bridgeActorIds = useMemo(() => usedBridgeActorIds(links), [links]);
  const bridgeStepsByActorId = useMemo(() => bridgeActorStepByActorId(links), [links]);
  const { strictListOrderActors, randomSinglePickActors, randomSinglePickLimitToTop12, crossListMemory } =
    useChainUiPreferences();

  /** Union of within-chain bridge IDs and cross-list bridge IDs so pick modes never land on a warned actor. */
  const excludedActorIds = useMemo(() => {
    if (!crossListMemory || crossListData.bridgeActorIds.size === 0) return bridgeActorIds;
    const merged = new Set(bridgeActorIds);
    for (const id of crossListData.bridgeActorIds.keys()) merged.add(id);
    return merged;
  }, [bridgeActorIds, crossListMemory, crossListData.bridgeActorIds]);

  const cast = useMemo(
    () =>
      credits.cast.filter(
        (a) => a.known_for_department === 'Acting' || a.order !== undefined
      ),
    [credits.cast]
  );

  /** First billable cast member not already used as a bridge — “next” for strict list order (full cast order). */
  const firstSelectableActorId = useMemo(
    () => findFirstSelectableActorId(cast, excludedActorIds),
    [cast, excludedActorIds]
  );

  const eligibleActorIdsInOrder = useMemo(() => {
    if (!randomSinglePickActors) return [];
    if (!randomSinglePickLimitToTop12) {
      return cast.filter((a) => !excludedActorIds.has(a.id)).map((a) => a.id);
    }
    return eligibleActorIdsForRandomPick(cast, excludedActorIds);
  }, [randomSinglePickActors, randomSinglePickLimitToTop12, cast, excludedActorIds]);

  const randomChosenActorId = useMemo(() => {
    if (!randomSinglePickActors || eligibleActorIdsInOrder.length === 0) return null;
    const seed = `actor|${links.length}|${eligibleActorIdsInOrder.join(',')}`;
    return pickRandomSelectableId(eligibleActorIdsInOrder, stableRng(seed));
  }, [randomSinglePickActors, eligibleActorIdsInOrder, links.length]);

  /** Collapsed grid shows 12; if strict order’s “next” actor is below that row, user must open “Show all cast”. */
  const displayCast = showAll ? cast : cast.slice(0, 12);

  return (
    <div>
      <div className="flex items-start gap-2 mb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex-1 min-w-0">
          {prependMode ? t('pickActorToPrepend') : t('pickActorToContinue')}
        </h3>
        <button
          type="button"
          onClick={() => setActorsExpanded((v) => !v)}
          className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:border-indigo-600/50 dark:hover:border-indigo-500/50 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          aria-expanded={actorsExpanded}
          aria-label={actorsExpanded ? t('collapseActorsAria') : t('expandActorsAria')}
        >
          <ChevronToggleIcon expanded={actorsExpanded} />
        </button>
      </div>
      {actorsExpanded && (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {displayCast.map((actor) => {
              const isExcluded = bridgeActorIds.has(actor.id);
              const crossListEntries = crossListMemory
                ? crossListData.bridgeActorIds.get(actor.id)
                : undefined;
              const isCrossListBlocked = !!crossListEntries && crossListEntries.length > 0;
              const randomLocked =
                randomSinglePickActors &&
                !isExcluded &&
                !isCrossListBlocked &&
                randomChosenActorId !== null &&
                actor.id !== randomChosenActorId;
              const sequentialLocked =
                !randomSinglePickActors &&
                strictListOrderActors &&
                !isExcluded &&
                !isCrossListBlocked &&
                firstSelectableActorId !== null &&
                actor.id !== firstSelectableActorId;
              const listOrderLocked = sequentialLocked || randomLocked;
              const disabled = isExcluded || isCrossListBlocked || listOrderLocked;
              const step = bridgeStepsByActorId.get(actor.id);
              const disabledBridge =
                isExcluded && step
                  ? {
                      fromTitle: step.fromTitle,
                      toTitle: step.toTitle,
                      description: t('actorAlreadyUsedAsBridge', {
                        from: step.fromTitle,
                        to: step.toTitle,
                      }),
                    }
                  : undefined;
              const headMovie = links[0]?.movie;
              const challengePoints =
                prependMode && headMovie
                  ? scoreChainStep(headMovie, actor.popularity)
                  : scoreActorContribution(actor.popularity);
              const challengePointsVariant = prependMode ? 'step' : 'actorOnly';
              const crossListBlocked = isCrossListBlocked
                ? t('actorCrossListBlocked', { lists: formatCrossListEntries(crossListEntries) })
                : undefined;
              return (
                <ActorCard
                  key={actor.id}
                  actor={actor}
                  disabled={disabled}
                  disabledBridge={disabledBridge}
                  sequentialLocked={listOrderLocked}
                  sequentialLockedDescription={
                    randomLocked
                      ? t('actorRandomPickLockedAria', { name: actor.name })
                      : sequentialLocked
                        ? t('actorSequentialLockedAria', { name: actor.name })
                        : undefined
                  }
                  sequentialLockedHintOverride={
                    randomLocked ? t('actorRandomPickLockedHint') : undefined
                  }
                  onClick={() => {
                    selectActor(actor.id, actor.name, actor.popularity);
                    navigate(`/?actorId=${actor.id}`, {
                      state: {
                        chainUndo: 'cancelActorSelection',
                        actorName: actor.name,
                        actorPopularity: actor.popularity ?? null,
                      },
                    });
                  }}
                  challengePoints={listOrderLocked ? null : challengePoints}
                  challengePointsVariant={challengePointsVariant}
                  crossListBlocked={crossListBlocked}
                />
              );
            })}
          </div>
          {!showAll && cast.length > 12 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              {t('showAllCast', { count: cast.length })}
            </button>
          )}
        </>
      )}
    </div>
  );
}
