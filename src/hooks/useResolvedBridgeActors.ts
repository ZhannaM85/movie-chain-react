import { useState, useEffect, useMemo } from 'react';
import type { ChainLink } from '../types/movie';
import type { MovieApi } from '../services/movieApi';
import { resolveSharedBridgeActor } from '../utils/bridgeSharedCast';

type ResolveStatus = 'idle' | 'loading' | 'done';

/**
 * For links with no stored bridge actor, resolves a shared cast member from the API
 * (lowest billing `order` in the newer film wins ties).
 */
export function useResolvedBridgeActors(links: ChainLink[], api: MovieApi) {
  const chainKey = useMemo(() => links.map((l) => l.movie.id).join(','), [links]);

  const [status, setStatus] = useState<ResolveStatus>('idle');
  const [resolved, setResolved] = useState<Record<number, { id: number; name: string } | null>>({});

  useEffect(() => {
    let cancelled = false;
    const tasks: Promise<{ index: number; result: { id: number; name: string } | null }>[] = [];
    for (let i = 1; i < links.length; i++) {
      const link = links[i];
      if (link.connectingActorId != null || link.connectingActorName != null) continue;
      tasks.push(
        resolveSharedBridgeActor(api, links[i - 1].movie.id, link.movie.id).then((result) => ({
          index: i,
          result,
        }))
      );
    }

    if (tasks.length === 0) {
      setStatus('done');
      setResolved({});
      return;
    }

    setStatus('loading');
    setResolved({});

    Promise.all(tasks)
      .then((results) => {
        if (cancelled) return;
        const next: Record<number, { id: number; name: string } | null> = {};
        for (const { index, result } of results) {
          next[index] = result;
        }
        setResolved(next);
        setStatus('done');
      })
      .catch(() => {
        if (!cancelled) {
          setResolved({});
          setStatus('done');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [api, chainKey]);

  const needsInference = useMemo(
    () =>
      links.some(
        (l, i) => i > 0 && l.connectingActorId == null && l.connectingActorName == null
      ),
    [links]
  );

  return { resolved, status, needsInference };
}
