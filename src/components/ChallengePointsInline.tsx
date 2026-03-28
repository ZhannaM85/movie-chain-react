import { useState, useRef, useEffect, useLayoutEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

function DifficultyPointsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M3 14V8h2.5v6H3zm5.25-3V5h2.5v6H8.25zm5.25 2V6H16v8h-2.5z" />
    </svg>
  );
}

type ChallengePointsVariant = 'step' | 'total' | 'actorOnly';

function computePanelStyle(buttonEl: HTMLElement): CSSProperties {
  const r = buttonEl.getBoundingClientRect();
  const margin = 8;
  const maxW = Math.min(320, window.innerWidth - 2 * margin);
  let left = r.left;
  if (left + maxW > window.innerWidth - margin) left = Math.max(margin, window.innerWidth - margin - maxW);
  if (left < margin) left = margin;

  const spaceBelow = window.innerHeight - r.bottom - margin;
  const spaceAbove = r.top - margin;
  const preferBelow = spaceBelow >= 100 || spaceBelow >= spaceAbove;

  const base: CSSProperties = {
    position: 'fixed',
    left,
    width: maxW,
    zIndex: 9999,
    maxHeight: Math.max(96, preferBelow ? spaceBelow - 4 : spaceAbove - 4),
    overflowY: 'auto',
  };

  if (preferBelow) {
    return { ...base, top: r.bottom + 4 };
  }
  return {
    ...base,
    bottom: window.innerHeight - r.top + 4,
  };
}

/**
 * Compact difficulty points: bar icon + number, hover title on desktop, tap to read full explanation on touch devices.
 */
export default function ChallengePointsInline({
  points,
  className = 'text-gray-500 tabular-nums',
  variant = 'step',
}: {
  points: number | null | undefined;
  className?: string;
  /** `step`: one link’s score (0–21). `total`: sum for the whole chain. `actorOnly`: actor slice before a movie is chosen. */
  variant?: ChallengePointsVariant;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const explainText =
    variant === 'total'
      ? t('challengePointsTotalTooltip')
      : variant === 'actorOnly'
        ? t('challengePointsActorOnlyTooltip')
        : t('challengePointsTooltip');
  const ariaLabel =
    variant === 'total'
      ? t('challengePointsTotalInlineAria', { points })
      : variant === 'actorOnly'
        ? t('challengePointsActorOnlyInlineAria', { points })
        : t('challengePointsInlineAria', { points });

  useLayoutEffect(() => {
    if (!open) {
      setPanelStyle(null);
      return;
    }
    const update = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      setPanelStyle(computePanelStyle(btn));
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (points == null) return null;

  const portalRoot = typeof document !== 'undefined' ? document.body : null;

  return (
    <span className={`inline-flex align-middle ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex max-w-full items-center gap-0.5 rounded px-0.5 py-0 text-inherit transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        title={explainText}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <DifficultyPointsIcon className="h-[1em] w-[1em] shrink-0 opacity-85" />
        <span className="tabular-nums">{points}</span>
      </button>
      {open && panelStyle && portalRoot
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="region"
              style={panelStyle}
              className="rounded-md border border-gray-600 bg-gray-900 px-2.5 py-2 text-left text-xs font-normal normal-case leading-snug text-gray-200 shadow-lg break-words"
            >
              {explainText}
            </div>,
            portalRoot
          )
        : null}
    </span>
  );
}
