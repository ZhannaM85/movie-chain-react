import type { TFunction } from 'i18next';

const MOVIES_MILESTONE_RE = /^movies_(\d+)$/;

export function achievementTitle(t: TFunction, id: string): string {
  const m = MOVIES_MILESTONE_RE.exec(id);
  if (m) {
    const count = Number(m[1]);
    return t('achievement.movies_milestone.title', { count });
  }
  return t(`achievement.${id}.title`, { defaultValue: id });
}

export function achievementDesc(t: TFunction, id: string): string {
  const m = MOVIES_MILESTONE_RE.exec(id);
  if (m) {
    const count = Number(m[1]);
    return t('achievement.movies_milestone.desc', { count });
  }
  return t(`achievement.${id}.desc`, { defaultValue: '' });
}
