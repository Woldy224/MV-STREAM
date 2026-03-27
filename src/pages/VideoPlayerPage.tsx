import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  Clock3,
  Heart,
  Info,
  Play,
  Plus,
  Share2,
  Sparkles,
  Star,
  Tv,
  X,
} from 'lucide-react';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { ContentAPI } from '../utils/api';
import { toContentItem } from '../utils/mapper';
import { ContentItem } from '../types/content';
import { isInMyList, isLiked, shareContentLink, toggleLiked, toggleMyList } from '../utils/library';

function isProbablyUrl(value?: string | null): boolean {
  if (!value) return false;
  const v = value.trim();
  return /^https?:\/\//i.test(v) || /^\/\//.test(v);
}

function normalizeUrl(url: string): string {
  const u = url.trim();
  return u.startsWith('//') ? `https:${u}` : u;
}

function toEmbedUrl(url: string): string {
  const u = normalizeUrl(url);
  try {
    const parsed = new URL(u);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      if (parsed.pathname.startsWith('/embed/')) return u;
    }
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace('/', '').split('/')[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === 'vimeo.com') {
      const id = parsed.pathname.replace('/', '').split('/')[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (host === 'player.vimeo.com' && parsed.pathname.startsWith('/video/')) return u;
  } catch {
    return u;
  }
  return u;
}

function extractIframeSrc(embedHtml?: string | null): string {
  if (!embedHtml) return '';
  try {
    const doc = new DOMParser().parseFromString(embedHtml, 'text/html');
    const iframe = doc.querySelector('iframe');
    const src = iframe?.getAttribute('src') || '';
    if (!src) return '';
    return isProbablyUrl(src) ? toEmbedUrl(src) : '';
  } catch {
    return '';
  }
}

function splitDistribution(value?: string) {
  return (value || '')
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

const infoFallback = 'Ajoute enfòmasyon sa a nan admin dashboard la pou li parèt isit la.';

const VideoPlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playerRef = useRef<HTMLDivElement | null>(null);

  const [item, setItem] = useState<ContentItem | null>(null);
  const [related, setRelated] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string>('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [inList, setInList] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [detailRes, listRes] = await Promise.all([ContentAPI.get(id), ContentAPI.list()]);
        const current = toContentItem(detailRes.item);
        setItem(current);
        setInList(isInMyList(current.id));
        setLiked(isLiked(current.id));

        const pool = (listRes.items || []).map(toContentItem).filter((entry) => entry.id !== current.id);
        const sameCategory = pool.filter((entry) => entry.category && entry.category === current.category);
        const sameType = pool.filter((entry) => entry.type === current.type && entry.category !== current.category);
        const fallback = pool.filter((entry) => entry.id !== current.id);
        const ordered = [...sameCategory, ...sameType, ...fallback];
        const unique = ordered.filter((entry, index, arr) => arr.findIndex((x) => x.id === entry.id) === index);
        setRelated(unique.slice(0, 8));
      } catch (error) {
        console.error(error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const iframeSrc = useMemo(() => {
    if (!item) return '';
    const rawEmbedUrl = (item as any)?.embedUrl ?? (item as any)?.embed_url ?? (item as any)?.iframeUrl ?? '';
    if (typeof rawEmbedUrl === 'string' && isProbablyUrl(rawEmbedUrl)) return toEmbedUrl(rawEmbedUrl);

    const rawEmbedCode = (item as any)?.embedCode ?? (item as any)?.embed_code ?? (item as any)?.iframeCode ?? '';
    if (typeof rawEmbedCode === 'string' && rawEmbedCode.trim().startsWith('<')) {
      const src = extractIframeSrc(rawEmbedCode);
      if (src) return src;
    }

    const v = (item.videoUrl ?? '').trim();
    if (!v) return '';
    if (v.startsWith('<')) return extractIframeSrc(v);
    if (isProbablyUrl(v)) return toEmbedUrl(v);
    return '';
  }, [item]);

  const canUseIframe = Boolean(iframeSrc);
  const distributionItems = splitDistribution(item?.distribution);

  const playNow = () => {
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleToggleList = () => {
    if (!item) return;
    const next = toggleMyList(item.id);
    setInList(next);
    setToast(next ? 'Ajouté à Ma liste' : 'Retiré de Ma liste');
  };

  const handleToggleLike = () => {
    if (!item) return;
    const next = toggleLiked(item.id);
    setLiked(next);
    setToast(next ? 'Ajouté dans J’aime' : 'Retiré des favoris');
  };

  const handleShare = async () => {
    if (!item) return;
    const url = `${window.location.origin}/watch/${item.id}`;
    const result = await shareContentLink(url, item.title);
    if (result === 'shared') setToast('Contenu partagé');
    else if (result === 'copied') setToast('Lien copié');
    else setToast('Impossible de partager pour le moment');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        </div>
      </div>
    );
  }

  if (!item) return null;

  const metaLine = [item.year, item.ageRating, item.category].filter(Boolean).join(' • ');

  return (
    <div className="min-h-screen bg-[#05070c] pb-16 pt-20 text-white">
      <section className="relative isolate overflow-hidden border-b border-white/8">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${item.backdropUrl || item.posterUrl})` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(196,35,64,0.18),transparent_22%),linear-gradient(90deg,rgba(4,4,8,0.96)_0%,rgba(4,4,8,0.78)_42%,rgba(4,4,8,0.58)_68%,rgba(4,4,8,0.92)_100%),linear-gradient(180deg,rgba(4,4,8,0.2)_0%,rgba(4,4,8,0.72)_72%,#05070c_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/72 transition hover:text-white">
            <ChevronLeft className="h-4 w-4" />
            Retour à l’accueil
          </Link>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur-xl">
                  {item.type === 'movie' ? 'Film premium' : item.type === 'series' ? 'Série premium' : 'Live premium'}
                </span>
                {item.category && <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-white/72">{item.category}</span>}
              </div>

              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">{item.title}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/72">
                {metaLine && <span>{metaLine}</span>}
                {item.durationMinutes ? (
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    {item.durationMinutes} min
                  </span>
                ) : null}
                {item.type === 'series' && item.seasonsCount ? <span>{item.seasonsCount} saison(s)</span> : null}
                {item.type === 'series' && item.episodesCount ? <span>{item.episodesCount} épisode(s)</span> : null}
              </div>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/74 md:text-lg">
                {item.description || 'Ajoute yon description nan admin dashboard la pou paj sa a parèt plis pwofesyonèl.'}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={playNow}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
                >
                  <Play className="h-4 w-4" fill="currentColor" />
                  Regarder
                </button>

                <button
                  type="button"
                  onClick={handleToggleList}
                  className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-medium text-white backdrop-blur-xl transition hover:bg-white/14"
                >
                  {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  Ma liste
                </button>

                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-medium backdrop-blur-xl transition ${
                    liked ? 'border-red-400/40 bg-red-500/12 text-red-100 hover:bg-red-500/18' : 'border-white/14 bg-white/8 text-white hover:bg-white/14'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                  J’aime
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-medium text-white backdrop-blur-xl transition hover:bg-white/14"
                >
                  <Share2 className="h-4 w-4" />
                  Partager
                </button>

                <button
                  type="button"
                  onClick={() => setInfoOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-medium text-white backdrop-blur-xl transition hover:bg-white/14"
                >
                  <Info className="h-4 w-4" />
                  More info
                </button>

                <button
                  type="button"
                  onClick={handleToggleList}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/14 bg-white/8 text-white backdrop-blur-xl transition hover:bg-white/14"
                  title={inList ? 'Retirer de Ma liste' : 'Ajouter à Ma liste'}
                >
                  {inList ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Aperçu premium</p>
              <div className="mt-4 overflow-hidden rounded-[1.6rem] border border-white/10">
                <img src={item.posterUrl} alt={item.title} className="aspect-[3/4] w-full object-cover" />
              </div>
              <div className="mt-4 space-y-3 text-sm text-white/72">
                <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-3">
                  <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 text-yellow-300" /> Présentation</span>
                  <span className="text-white/95">Premium</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-3">
                  <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-sky-300" /> Maison</span>
                  <span className="max-w-[120px] truncate text-right text-white/95">{item.productionHouse || '—'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2"><Tv className="h-4 w-4 text-red-300" /> Distribution</span>
                  <span className="max-w-[120px] truncate text-right text-white/95">{distributionItems[0] || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-8 max-w-7xl space-y-8 px-4 md:px-6">
        <section ref={playerRef} className="glass-panel overflow-hidden rounded-[2rem] border border-white/10">
          <div className="border-b border-white/10 px-5 py-4 md:px-7">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Lecture</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{item.title}</h2>
          </div>

          <div className="overflow-hidden">
            {canUseIframe ? (
              <div className="aspect-video w-full bg-black">
                <iframe
                  className="h-full w-full"
                  src={iframeSrc}
                  title={item.title || 'Embedded video'}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : item.videoUrl ? (
              <VideoPlayer src={item.videoUrl} poster={item.backdropUrl} title={item.title} isLive={item.type === 'live'} />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center text-white/70">
                <p>Source vidéo introuvable.</p>
                <p className="max-w-xl text-sm text-white/46">Ajoute yon lien vidéo, yon iframe embed, oswa yon fichye video nan admin dashboard la.</p>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.95fr]">
          <div className="glass-panel rounded-[2rem] p-6 md:p-7">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Maison de production</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">{item.productionHouse || 'Maison de production non renseignée'}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/66">
              {item.productionHouse
                ? `Ce titre est associé à ${item.productionHouse}. Cette zone te permet de mettre en avant le studio ou la structure de création directement depuis le dashboard admin.`
                : infoFallback}
            </p>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 md:p-7">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Distribution</p>
            {distributionItems.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {distributionItems.map((name) => (
                  <span key={name} className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/82 backdrop-blur-xl">
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-white/66">{infoFallback}</p>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-panel rounded-[2rem] p-6 md:p-7">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Synopsis</p>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-white/74 md:text-base">
              {item.description || 'Ajoute yon synopsis nan admin dashboard la pou seksyon sa a gen plis valè.'}
            </p>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 md:p-7">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Fiche technique</p>
            <div className="mt-4 space-y-4 text-sm text-white/72">
              <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3">
                <span>Type</span>
                <span className="text-white/95">{item.type}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3">
                <span>Année</span>
                <span className="text-white/95">{item.year || '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3">
                <span>Âge</span>
                <span className="text-white/95">{item.ageRating || 'Tout public'}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3">
                <span>Durée</span>
                <span className="text-white/95">{item.durationMinutes ? `${item.durationMinutes} min` : '—'}</span>
              </div>
              {item.type === 'series' && (
                <>
                  <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3">
                    <span>Saisons</span>
                    <span className="text-white/95">{item.seasonsCount || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 pb-1">
                    <span>Épisodes</span>
                    <span className="text-white/95">{item.episodesCount || '—'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="glass-panel rounded-[2rem] p-6 md:p-7">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">À découvrir ensuite</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Plus comme ça</h2>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((entry) => (
                <Link
                  key={entry.id}
                  to={`/watch/${entry.id}`}
                  className="group overflow-hidden rounded-[1.4rem] border border-white/8 bg-white/[0.03] transition hover:-translate-y-1 hover:border-white/14 hover:bg-white/[0.05]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={entry.posterUrl} alt={entry.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 text-base font-semibold text-white">{entry.title}</h3>
                    <p className="mt-1 text-xs text-white/56">
                      {[entry.year, entry.ageRating, entry.category].filter(Boolean).join(' • ') || entry.type}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-full border border-white/10 bg-black/80 px-4 py-2 text-sm text-white shadow-[0_18px_42px_rgba(0,0,0,0.36)] backdrop-blur-xl">
          {toast}
        </div>
      )}

      {infoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0e14] shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">More info</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{item.title}</h3>
              </div>
              <button type="button" onClick={() => setInfoOpen(false)} className="rounded-full border border-white/10 bg-white/6 p-2 text-white/80 transition hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-6 p-6 md:grid-cols-[220px_1fr]">
              <img src={item.posterUrl} alt={item.title} className="aspect-[3/4] w-full rounded-[1.4rem] object-cover" />
              <div className="space-y-5">
                <p className="text-sm leading-7 text-white/74">{item.description || 'Aucune description pour le moment.'}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/45">Maison de production</p>
                    <p className="mt-3 text-sm text-white/84">{item.productionHouse || 'Non renseignée'}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/45">Distribution</p>
                    <p className="mt-3 text-sm text-white/84">{item.distribution || 'Non renseignée'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayerPage;
