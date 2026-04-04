import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Static informational page that explains how the Movie Chain app works.
 *
 * @returns {JSX.Element} The about page content.
 */
export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <p className="text-sm text-indigo-400 mb-1">
          <Link to="/" className="hover:text-indigo-300 transition-colors">
            &larr; {t('backToChain')}
          </Link>
        </p>
        <h1 className="text-3xl font-bold text-white mb-2">{t('aboutTitle')}</h1>
        <p className="text-gray-400">
          {t('aboutIntro')}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">{t('aboutHowWorks')}</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>{t('aboutStep1')}</li>
          <li>{t('aboutStep2')}</li>
          <li>{t('aboutStep3')}</li>
          <li>{t('aboutStep4')}</li>
          <li>{t('aboutStep5')}</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{t('aboutRules')}</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          <li>{t('aboutRule1')}</li>
          <li>{t('aboutRule2')}</li>
          <li>{t('aboutRule3')}</li>
          <li>{t('aboutRule4')}</li>
          <li>{t('aboutRule5')}</li>
          <li>{t('aboutRule6')}</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{t('aboutStatsTitle')}</h2>
        <p className="text-gray-300">{t('aboutStatsIntro')}</p>
        <ul className="list-disc list-inside space-y-2 text-gray-300 mt-2">
          <li>{t('aboutStatsItem1')}</li>
          <li>{t('aboutStatsItem2')}</li>
          <li>{t('aboutStatsItem3')}</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{t('aboutTech')}</h2>
        <p className="text-gray-300">
          {t('aboutTechText')}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{t('aboutDataTitle')}</h2>
        <p className="text-gray-300">{t('aboutDataExportHint')}</p>
      </section>

      <footer className="pt-4 border-t border-gray-800 mt-4">
        <p className="text-xs text-gray-500 text-center">
          {t('aboutFooterBefore')}{' '}
          <a
            href="https://github.com/ZhannaM85"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-gray-300 hover:text-indigo-300 underline-offset-2 hover:underline"
          >
            ZhannaM85
          </a>{' '}
          {t('aboutFooterAfter')}{' '}
          <span className="inline-block text-red-500 align-middle" aria-hidden="true">
            ♥
          </span>
          .
        </p>
      </footer>
    </div>
  );
}

