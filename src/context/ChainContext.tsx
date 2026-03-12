import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useChain } from '../hooks/useChain';

type ChainContextType = ReturnType<typeof useChain>;

const ChainContext = createContext<ChainContextType | null>(null);

/**
 * Provides the movie chain state and actions to the component subtree.
 *
 * @param {{ children: ReactNode }} props - The provider props.
 * @returns {JSX.Element} The context provider element.
 */
export function ChainProvider({ children }: { children: ReactNode }) {
  const chain = useChain();
  return <ChainContext.Provider value={chain}>{children}</ChainContext.Provider>;
}

/**
 * Convenience hook for accessing the movie chain context.
 *
 * @returns {ChainContextType} The current chain state and actions.
 * @throws {Error} If used outside of a `ChainProvider`.
 */
export function useChainContext(): ChainContextType {
  const ctx = useContext(ChainContext);
  if (!ctx) {
    throw new Error('useChainContext must be used within a ChainProvider');
  }
  return ctx;
}
