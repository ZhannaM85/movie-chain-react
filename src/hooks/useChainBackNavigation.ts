import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { useChainContext } from '../context/ChainContext';

interface ChainNavState {
  chainUndo?: 'cancelActorSelection' | 'removeLastMovie' | 'removeFirstMovie';
  actorName?: string;
  actorPopularity?: number | null;
}

/**
 * Listens for browser back navigation and undoes the corresponding chain action.
 *
 * When an actor is selected or a movie is added, a history entry is pushed with a
 * `chainUndo` marker. On POP (back), this hook detects the direction of travel and
 * calls the appropriate undo function so the chain state stays in sync with the URL.
 * Forward navigation (redo) is intentionally not supported.
 */
export function useChainBackNavigation() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const { cancelActorSelection, undoLast, removeFirst, selectActor } = useChainContext();

  const prevLocationRef = useRef(location);
  // Track visited history keys in visit order so we can detect back vs forward.
  const historyKeysRef = useRef<string[]>([location.key]);

  useEffect(() => {
    const prevLocation = prevLocationRef.current;
    prevLocationRef.current = location;

    if (navigationType === 'POP') {
      const prevIdx = historyKeysRef.current.indexOf(prevLocation.key);
      const currIdx = historyKeysRef.current.indexOf(location.key);
      // Going back = arriving at an earlier (lower index) or unseen position.
      const isGoingBack = prevIdx !== -1 && (currIdx === -1 || currIdx < prevIdx);

      if (isGoingBack) {
        const prevState = prevLocation.state as ChainNavState | null;

        if (prevState?.chainUndo === 'cancelActorSelection') {
          cancelActorSelection();
        } else if (prevState?.chainUndo === 'removeLastMovie') {
          undoLast();
          // Restore actor selection if the entry we're arriving at represents actor-selected state.
          const params = new URLSearchParams(location.search);
          const actorIdStr = params.get('actorId');
          const arrivedState = location.state as ChainNavState | null;
          if (actorIdStr && arrivedState?.actorName) {
            selectActor(Number(actorIdStr), arrivedState.actorName, arrivedState.actorPopularity);
          }
        } else if (prevState?.chainUndo === 'removeFirstMovie') {
          removeFirst();
        }
      }
    }

    if (!historyKeysRef.current.includes(location.key)) {
      historyKeysRef.current.push(location.key);
    }
  }, [location, navigationType, cancelActorSelection, undoLast, removeFirst, selectActor]);
}
