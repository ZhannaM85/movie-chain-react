import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useChainContext } from '../context/ChainContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { links, resetChain } = useChainContext();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between relative">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="text-xl font-bold tracking-tight text-white hover:text-indigo-400 transition-colors"
              onClick={() => setMobileNavOpen(false)}
            >
              Movie Chain
            </Link>
            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-4 text-sm text-gray-400">
              <Link
                to="/"
                className="hover:text-indigo-400 transition-colors"
              >
                Home
              </Link>
              <Link
                to="/about"
                className="hover:text-indigo-400 transition-colors"
              >
                About
              </Link>
            </nav>
            {/* Mobile hamburger */}
            <button
              type="button"
              className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-label="Toggle navigation"
            >
              <span className="sr-only">Toggle navigation</span>
              <span className="space-y-1">
                <span className="block w-4 h-[2px] bg-current" />
                <span className="block w-4 h-[2px] bg-current" />
                <span className="block w-4 h-[2px] bg-current" />
              </span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            {links.length > 0 && (
              <Link
                to="/chain"
                className="text-sm text-gray-400 hover:text-indigo-400 transition-colors"
                onClick={() => setMobileNavOpen(false)}
              >
                {links.length} movie{links.length !== 1 ? 's' : ''} in chain
              </Link>
            )}
            {links.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Start a new chain? This will clear your current progress.')) {
                    resetChain();
                  }
                  setMobileNavOpen(false);
                }}
                className="text-sm px-3 py-1.5 rounded-md bg-gray-800 hover:bg-red-900/50 hover:text-red-300 text-gray-300 transition-colors"
              >
                New Chain
              </button>
            )}
          </div>
        </div>
      </header>
      {/* Mobile dropdown nav */}
      {mobileNavOpen && (
        <div className="sm:hidden bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col gap-1 text-sm">
            <Link
              to="/"
              className="py-1 text-gray-300 hover:text-indigo-300 transition-colors"
              onClick={() => setMobileNavOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/about"
              className="py-1 text-gray-300 hover:text-indigo-300 transition-colors"
              onClick={() => setMobileNavOpen(false)}
            >
              About
            </Link>
          </div>
        </div>
      )}
      <main>{children}</main>
    </div>
  );
}
