import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useChainContext } from '../context/ChainContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { links, resetChain } = useChainContext();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-white hover:text-indigo-400 transition-colors">
            Movie Chain
          </Link>
          <div className="flex items-center gap-4">
            {links.length > 0 && (
              <span className="text-sm text-gray-400">
                {links.length} movie{links.length !== 1 ? 's' : ''} in chain
              </span>
            )}
            {links.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Start a new chain? This will clear your current progress.')) {
                    resetChain();
                  }
                }}
                className="text-sm px-3 py-1.5 rounded-md bg-gray-800 hover:bg-red-900/50 hover:text-red-300 text-gray-300 transition-colors"
              >
                New Chain
              </button>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
