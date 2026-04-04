import { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useChainContext } from '../context/ChainContext';
import { ChainListsBackupError } from '../utils/chainListsBackup';

/**
 * Backup & restore controls for the About page (JSON full restore; CSV export for spreadsheets).
 */
export default function AboutBackupSection() {
  const { t } = useTranslation();
  const { exportChainListsJson, exportChainListsCsv, importChainListsFromJson } = useChainContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importModeRef = useRef<'replace' | 'merge' | null>(null);

  const runImport = useCallback(
    (text: string) => {
      const mode = importModeRef.current;
      importModeRef.current = null;
      if (mode !== 'replace' && mode !== 'merge') return;

      if (mode === 'replace') {
        if (!window.confirm(t('backupImportConfirmReplace'))) {
          return;
        }
      }

      try {
        importChainListsFromJson(text, mode);
        window.alert(t('backupImportSuccess'));
      } catch (e) {
        const msg =
          e instanceof ChainListsBackupError
            ? e.message
            : e instanceof Error
              ? e.message
              : t('backupImportError');
        window.alert(msg);
      }
    },
    [importChainListsFromJson, t]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        runImport(String(reader.result ?? ''));
      };
      reader.onerror = () => {
        window.alert(t('backupImportError'));
      };
      reader.readAsText(file);
    },
    [runImport, t]
  );

  const pickImportReplace = useCallback(() => {
    importModeRef.current = 'replace';
    fileInputRef.current?.click();
  }, []);

  const pickImportMerge = useCallback(() => {
    importModeRef.current = 'merge';
    fileInputRef.current?.click();
  }, []);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-white">{t('backupSectionTitle')}</h2>
      <p className="text-gray-300 text-sm leading-relaxed">{t('backupSectionIntro')}</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label={t('backupImportFileAria')}
        onChange={onFileChange}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportChainListsJson}
          className="rounded-md border border-indigo-600/60 bg-indigo-950/40 px-3 py-2 text-sm font-medium text-indigo-200 hover:bg-indigo-900/50 transition-colors"
        >
          {t('backupExportJson')}
        </button>
        <button
          type="button"
          onClick={exportChainListsCsv}
          className="rounded-md border border-gray-600 bg-gray-800/80 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700/80 transition-colors"
        >
          {t('backupExportCsv')}
        </button>
        <button
          type="button"
          onClick={pickImportReplace}
          className="rounded-md border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-sm font-medium text-amber-100 hover:bg-amber-950/50 transition-colors"
        >
          {t('backupImportReplace')}
        </button>
        <button
          type="button"
          onClick={pickImportMerge}
          className="rounded-md border border-gray-600 bg-gray-800/80 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700/80 transition-colors"
        >
          {t('backupImportMerge')}
        </button>
      </div>
      <p className="text-xs text-gray-500">{t('backupCsvNote')}</p>
    </section>
  );
}
