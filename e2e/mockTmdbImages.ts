import type { Page } from '@playwright/test';

/**
 * TMDB poster URLs use sizes like w342, w500, original; profile headshots use w185, h632.
 * @see https://developer.themoviedb.org/docs/image-basics
 */
function isProfileImageUrl(url: string): boolean {
  return /\/t\/p\/(w185|h632)\//.test(url);
}

/** Wider “poster” placeholder — indigo frame so screenshots are visibly not broken. */
function posterPlaceholderSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513" viewBox="0 0 342 513">
<rect fill="#312e81" width="100%" height="100%"/>
<rect fill="#4f46e5" x="24" y="24" width="294" height="465" rx="6"/>
<text x="171" y="260" fill="#c7d2fe" font-family="system-ui,sans-serif" font-size="18" text-anchor="middle">E2E poster</text>
</svg>`;
}

/** Narrow “headshot” placeholder — distinct from poster for actor cards. */
function profilePlaceholderSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="185" height="278" viewBox="0 0 185 278">
<rect fill="#475569" width="100%" height="100%"/>
<circle cx="92" cy="100" r="48" fill="#94a3b8"/>
<rect x="40" y="168" width="105" height="72" rx="6" fill="#64748b"/>
<text x="92" y="248" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="11" text-anchor="middle">E2E photo</text>
</svg>`;
}

/**
 * Mocks TMDB image CDN so e2e does not hit real servers; fake fixture paths still resolve to visible images.
 */
export async function registerTmdbImageMocks(page: Page): Promise<void> {
  await page.route('https://image.tmdb.org/**', async (route) => {
    const url = route.request().url();
    const svg = isProfileImageUrl(url) ? profilePlaceholderSvg() : posterPlaceholderSvg();
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml; charset=utf-8',
      body: Buffer.from(svg, 'utf-8'),
    });
  });
}
