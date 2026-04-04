import type { ChainListsPersisted } from '../types/chainLists';

const CSV_COLUMNS = [
  'listName',
  'index',
  'title',
  'release_date',
  'connecting_actor',
  'comment',
  'logged_date',
  'source',
] as const;

function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * One row per chain link, UTF-8 BOM for Excel on Windows with non-ASCII text.
 */
export function buildChainListsCsv(persisted: ChainListsPersisted): string {
  const rows: string[] = [CSV_COLUMNS.join(',')];

  for (const list of persisted.lists) {
    const listName = list.name ?? '';
    const source = list.state.source ?? '';
    list.state.links.forEach((link, index) => {
      const actor = link.connectingActorName ?? '';
      const comment = link.comment ?? '';
      const logged = link.loggedDate ?? '';
      const title = link.movie?.title ?? '';
      const release = link.movie?.release_date ?? '';
      const row = [
        escapeCsvField(listName),
        String(index + 1),
        escapeCsvField(title),
        escapeCsvField(release),
        escapeCsvField(actor),
        escapeCsvField(comment),
        escapeCsvField(logged),
        escapeCsvField(source),
      ].join(',');
      rows.push(row);
    });
  }

  return `\uFEFF${rows.join('\r\n')}`;
}
