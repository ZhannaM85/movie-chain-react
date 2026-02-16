import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useChain } from '../hooks/useChain';

type ChainContextType = ReturnType<typeof useChain>;

const ChainContext = createContext<ChainContextType | null>(null);

export function ChainProvider({ children }: { children: ReactNode }) {
  const chain = useChain();
  return <ChainContext.Provider value={chain}>{children}</ChainContext.Provider>;
}

export function useChainContext(): ChainContextType {
  const ctx = useContext(ChainContext);
  if (!ctx) {
    throw new Error('useChainContext must be used within a ChainProvider');
  }
  return ctx;
}
