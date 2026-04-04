import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useChainContext } from '../context/ChainContext';
import { buildChainRecap } from '../gamification/chainRecap';

/**
 * Header control: switch named lists, add, rename, delete.
 */
export default function ChainListMenu() {
  const {
    activeListId,
    activeListName,
    links,
    chainLists,
    setActiveListId,
    createList,
    renameList,
    deleteList,
    getListLinks,
    resetChain,
  } = useChainContext();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, minWidth: 224 });

  const updatePanelPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const minW = Math.max(rect.width, 224);
    const margin = 8;
    let left = rect.left;
    if (left + minW > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - margin - minW);
    }
    setPanelPos({ top: rect.bottom + 4, left, minWidth: minW });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    const onScrollOrResize = () => updatePanelPosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const node = e.target as Node;
      if (triggerRef.current?.contains(node) || panelRef.current?.contains(node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const handleAdd = useCallback(() => {
    createList(t('newListNumbered', { n: chainLists.length + 1 }));
    setOpen(false);
  }, [chainLists.length, createList, t]);

  const handleRename = useCallback(
    (id: string, current: string) => {
      const next = window.prompt(t('renameListPrompt'), current);
      if (next == null) return;
      if (!next.trim()) {
        window.alert(t('listNameEmpty'));
        return;
      }
      renameList(id, next);
    },
    [renameList, t]
  );

  const handleClearCurrentChain = useCallback(() => {
    const recap = buildChainRecap(links);
    const msg =
      links.length === 0
        ? t('confirmNewChain')
        : t('confirmNewChainRecap', {
            length: recap.length,
            difficulty: recap.totalDifficulty,
            actors: recap.uniqueActors,
            decades: recap.distinctDecades,
          });
    if (window.confirm(msg)) {
      resetChain();
      setOpen(false);
    }
  }, [links, resetChain, t]);

  const handleDelete = useCallback(
    (id: string, name: string) => {
      const links = getListLinks(id);
      const recap = buildChainRecap(links);
      const msg =
        links.length === 0
          ? t('confirmDeleteListEmpty', { name })
          : t('confirmDeleteListRecap', {
              name,
              length: recap.length,
              difficulty: recap.totalDifficulty,
              actors: recap.uniqueActors,
              decades: recap.distinctDecades,
            });
      if (window.confirm(msg)) {
        deleteList(id);
        setOpen(false);
      }
    },
    [deleteList, getListLinks, t]
  );

  const dropdown =
    open &&
    createPortal(
      <div
        ref={panelRef}
        className="fixed z-[200] max-w-[min(calc(100vw-1rem),20rem)] rounded-md border border-gray-700 bg-gray-900 py-1 shadow-lg shadow-black/40"
        style={{
          top: panelPos.top,
          left: panelPos.left,
          minWidth: panelPos.minWidth,
        }}
        role="listbox"
      >
        <div className="max-h-[min(60vh,20rem)] overflow-y-auto">
          {chainLists.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center gap-1 border-b border-gray-800/80 px-2 py-1.5 last:border-b-0 ${
                entry.id === activeListId ? 'bg-indigo-950/40' : ''
              }`}
            >
              <button
                type="button"
                role="option"
                aria-selected={entry.id === activeListId}
                className="min-w-0 flex-1 truncate text-left text-sm text-gray-200 hover:text-indigo-300"
                onClick={() => {
                  setActiveListId(entry.id);
                  setOpen(false);
                }}
              >
                <span className="font-medium">{entry.name}</span>
                <span className="ml-1 text-xs text-gray-500">({entry.linkCount})</span>
              </button>
              <button
                type="button"
                className="shrink-0 rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                onClick={() => handleRename(entry.id, entry.name)}
              >
                {t('renameList')}
              </button>
              <button
                type="button"
                className="shrink-0 rounded px-1.5 py-0.5 text-xs text-red-400/90 hover:bg-red-950/50 hover:text-red-300"
                onClick={() => handleDelete(entry.id, entry.name)}
              >
                {t('deleteList')}
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="w-full border-t border-gray-800 px-2 py-2 text-left text-sm text-indigo-400 hover:bg-gray-800/80"
          onClick={handleAdd}
        >
          {t('addList')}
        </button>
        {links.length > 0 && (
          <button
            type="button"
            className="w-full border-t border-gray-800 px-2 py-2 text-left text-sm text-red-400/95 hover:bg-red-950/40"
            title={t('clearChainTooltip')}
            onClick={handleClearCurrentChain}
          >
            {t('clearChain')}
          </button>
        )}
      </div>,
      document.body
    );

  return (
    <div ref={triggerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 max-w-[10rem] sm:max-w-[14rem] items-center gap-1 rounded-md border border-gray-700 bg-gray-800 px-2 text-left text-xs text-gray-200 transition-colors hover:border-gray-600 hover:bg-gray-800/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        aria-expanded={open}
        aria-haspopup="listbox"
        title={t('chainListMenuAria')}
        aria-label={t('chainListMenuAria')}
      >
        <span className="min-w-0 flex-1 truncate font-medium">{activeListName}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {dropdown}
    </div>
  );
}
