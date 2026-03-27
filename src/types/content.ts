export type ContentType = 'movie' | 'series' | 'live';

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  type: ContentType;
  category?: string;
  posterUrl: string;
  backdropUrl?: string;
  year?: number;
  ageRating?: string;
  durationMinutes?: number;
  videoUrl?: string;
  productionHouse?: string;
  distribution?: string;
  seasonsCount?: number;
  episodesCount?: number;
}
