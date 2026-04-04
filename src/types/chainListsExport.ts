import type { ChainListsPersisted } from './chainLists';

export const CHAIN_EXPORT_APP = 'movie-chain';

/** Current wrapper version for JSON backup files. */
export const CHAIN_EXPORT_FILE_VERSION = 1;

/**
 * JSON backup file shape written by Export JSON and read by Import.
 * `data` matches localStorage `movie-chain-lists-v1` content.
 */
export interface ChainListsExportFile {
  app: typeof CHAIN_EXPORT_APP;
  exportVersion: typeof CHAIN_EXPORT_FILE_VERSION;
  exportedAt: string;
  data: ChainListsPersisted;
}
