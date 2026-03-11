import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Component, type ReactNode } from 'react';
import { ChainProvider, useChainContext } from './ChainContext';

function createMockStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
}

function Consumer() {
  const ctx = useChainContext();
  return (
    <div>
      <span data-testid="has-startChain">{typeof ctx.startChain}</span>
      <span data-testid="links-length">{ctx.links.length}</span>
      <span data-testid="step">{ctx.currentStep}</span>
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) return <span data-testid="error">{this.state.error.message}</span>;
    return this.props.children;
  }
}

describe('ChainContext', () => {
  beforeEach(() => {
    const storage = createMockStorage();
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('sessionStorage', createMockStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('provides chain context to children', () => {
    render(
      <ChainProvider>
        <Consumer />
      </ChainProvider>
    );
    expect(screen.getByTestId('has-startChain')).toHaveTextContent('function');
    expect(screen.getByTestId('links-length')).toHaveTextContent('0');
    expect(screen.getByTestId('step')).toHaveTextContent('start');
  });

  it('useChainContext throws when used outside ChainProvider', () => {
    function BadConsumer() {
      useChainContext();
      return null;
    }
    render(
      <ErrorBoundary>
        <BadConsumer />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('error')).toHaveTextContent(
      'useChainContext must be used within a ChainProvider'
    );
  });
});
