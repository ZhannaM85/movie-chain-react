import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ChainListsPersisted } from '../types/chainLists';
import {
  ChainListsBackupError,
  parseChainListsBackupJson,
  prepareImportedListsMerge,
  prepareImportedListsReplace,
  buildExportJsonFile,
  persistedSnapshotForSingleList,
  sanitizeExportFilenameSegment,
  backupFilenameForListJson,
} from './chainListsBackup';
import { buildChainListsCsv } from './chainListsCsv';

const minimalMovie = {
  id: 1,
  title: 'Test',
  overview: '',
  poster_path: null,
  backdrop_path: null,
  release_date: '2020-01-01',
  vote_average: 7,
  vote_count: 1,
  popularity: 1,
};

const samplePersisted: ChainListsPersisted = {
  version: 1,
  activeListId: 'a1',
  lists: [
    {
      id: 'a1',
      name: 'My list',
      state: {
        links: [
          {
            movie: minimalMovie,
            connectingActorId: null,
            connectingActorName: null,
            comment: 'hi',
            loggedDate: '2026-01-01',
          },
        ],
        currentStep: 'pick-actor',
        selectedActorId: null,
        selectedActorName: null,
        source: 'tmdb',
      },
    },
  ],
};

describe('chainListsBackup', () => {
  beforeEach(() => {
    let n = 0;
    vi.stubGlobal('crypto', {
      randomUUID: () => `test-uuid-${++n}`,
    });
  });

  it('parseChainListsBackupJson accepts wrapped export file', () => {
    const json = buildExportJsonFile(samplePersisted);
    const parsed = parseChainListsBackupJson(json);
    expect(parsed.version).toBe(1);
    expect(parsed.lists).toHaveLength(1);
    expect(parsed.lists[0].state.links[0].movie.title).toBe('Test');
  });

  it('parseChainListsBackupJson accepts bare ChainListsPersisted', () => {
    const json = JSON.stringify(samplePersisted);
    const parsed = parseChainListsBackupJson(json);
    expect(parsed.activeListId).toBe('a1');
  });

  it('parseChainListsBackupJson throws on invalid JSON', () => {
    expect(() => parseChainListsBackupJson('not json')).toThrow(ChainListsBackupError);
  });

  it('prepareImportedListsReplace assigns new ids and normalizes', () => {
    const out = prepareImportedListsReplace(samplePersisted, 'pending-actor-pick');
    expect(out.lists[0].id).toBe('test-uuid-1');
    expect(out.activeListId).toBe('test-uuid-1');
    expect(out.lists[0].state.links).toHaveLength(1);
  });

  it('persistedSnapshotForSingleList round-trips through export wrapper', () => {
    const entry = samplePersisted.lists[0];
    const single = persistedSnapshotForSingleList(entry);
    expect(single.lists).toHaveLength(1);
    expect(single.activeListId).toBe(entry.id);
    const json = buildExportJsonFile(single);
    const parsed = parseChainListsBackupJson(json);
    expect(parsed.lists[0].name).toBe('My list');
  });

  it('sanitizeExportFilenameSegment strips unsafe characters', () => {
    expect(sanitizeExportFilenameSegment('My/List:name', 40)).toBe('My_List_name');
  });

  it('backupFilenameForListJson includes sanitized name', () => {
    const name = backupFilenameForListJson('Test List');
    expect(name).toMatch(/^movie-chain-list-Test List-/);
    expect(name.endsWith('.json')).toBe(true);
  });

  it('prepareImportedListsMerge renames duplicate list names', () => {
    const current: ChainListsPersisted = {
      version: 1,
      activeListId: 'x',
      lists: [
        {
          id: 'x',
          name: 'My list',
          state: {
            links: [],
            currentStep: 'start',
            selectedActorId: null,
            selectedActorName: null,
          },
        },
      ],
    };
    const imported: ChainListsPersisted = {
      version: 1,
      activeListId: 'a1',
      lists: [
        {
          id: 'a1',
          name: 'My list',
          state: {
            links: [
              {
                movie: minimalMovie,
                connectingActorId: null,
                connectingActorName: null,
                comment: '',
              },
            ],
            currentStep: 'pick-actor',
            selectedActorId: null,
            selectedActorName: null,
          },
        },
      ],
    };
    const out = prepareImportedListsMerge(current, imported, 'pending-actor-pick');
    expect(out.lists).toHaveLength(2);
    expect(out.lists[1].name).toMatch(/^My list \(2\)/);
  });
});

describe('chainListsCsv', () => {
  it('buildChainListsCsv includes BOM and header row', () => {
    const csv = buildChainListsCsv(samplePersisted);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('listName,index,title');
    expect(csv).toContain('My list');
    expect(csv).toContain('Test');
  });

  it('escapes commas in fields', () => {
    const p: ChainListsPersisted = {
      version: 1,
      activeListId: 'a',
      lists: [
        {
          id: 'a',
          name: 'A,B',
          state: {
            links: [
              {
                movie: { ...minimalMovie, title: 'Title, with comma' },
                connectingActorId: null,
                connectingActorName: null,
                comment: '',
              },
            ],
            currentStep: 'start',
            selectedActorId: null,
            selectedActorName: null,
          },
        },
      ],
    };
    const csv = buildChainListsCsv(p);
    expect(csv).toContain('"A,B"');
    expect(csv).toContain('"Title, with comma"');
  });
});
