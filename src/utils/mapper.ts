import { ApiContent, assetUrl } from './api';
import { ContentItem, ContentType } from '../types/content';

const fallbackPoster =
  'https://images.pexels.com/photos/7991310/pexels-photo-7991310.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
const fallbackBackdrop =
  'https://images.pexels.com/photos/7233275/pexels-photo-7233275.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';

export function toContentItem(x: ApiContent): ContentItem {
  const type = (x.type as ContentType) || 'movie';

  // video_url can be:
  // 1) a relative upload path ("/uploads/...") -> needs assetUrl()
  // 2) a direct URL (https://...)
  // 3) an embed code (e.g. <iframe ...>) -> must be kept as-is (do NOT run through assetUrl)
  const rawVideo = x.video_url != null ? String(x.video_url).trim() : undefined;
  const videoUrl = rawVideo
    ? rawVideo.startsWith('http://') || rawVideo.startsWith('https://') || rawVideo.startsWith('//')
      ? rawVideo
      : rawVideo.startsWith('<')
        ? rawVideo
        : assetUrl(rawVideo)
    : undefined;
  return {
    id: String(x.id),
    title: x.title,
    description: (x.description ?? '') || '',
    type,
    category: (x.category ?? undefined) || undefined,
    posterUrl: x.poster_url ? assetUrl(x.poster_url) : fallbackPoster,
    backdropUrl: x.backdrop_url ? assetUrl(x.backdrop_url) : (x.poster_url ? assetUrl(x.poster_url) : fallbackBackdrop),
    year: x.year ?? undefined,
    ageRating: (x.age_rating ?? undefined) || undefined,
    durationMinutes: x.duration_minutes ?? undefined,
    videoUrl,
    productionHouse: (x.production_house ?? undefined) || undefined,
    distribution: (x.distribution ?? undefined) || undefined,
    seasonsCount: x.seasons_count ?? undefined,
    episodesCount: x.episodes_count ?? undefined,
  };
}

export function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
