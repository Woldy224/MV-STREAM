import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, Play, Plus, Sparkles, Volume2, Clapperboard, Tv2 } from 'lucide-react';
import ContentSlider from '../components/content/ContentSlider';
import CountdownEvent from '../components/content/CountdownEvent';
import { ContentAPI } from '../utils/api';
import { toContentItem, formatDuration } from '../utils/mapper';
import { ContentItem } from '../types/content';

const HomePage = () => {
  const [heroContent, setHeroContent] = useState<ContentItem | null>(null);
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [series, setSeries] = useState<ContentItem[]>([]);
  const [live, setLive] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [m, s, l] = await Promise.all([
          ContentAPI.list('movie'),
          ContentAPI.list('series'),
          ContentAPI.list('live'),
        ]);

        const moviesItems = (m.items || []).map(toContentItem);
        const seriesItems = (s.items || []).map(toContentItem);
        const liveItems = (l.items || []).map(toContentItem);

        setMovies(moviesItems);
        setSeries(seriesItems);
        setLive(liveItems);

        const pick = seriesItems[0] || moviesItems[0] || liveItems[0] || null;
        setHeroContent(pick);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);
  const heroMeta = useMemo(() => {
    if (!heroContent) return null;
    return {
      badge: heroContent.type === 'movie' ? 'Film événement' : heroContent.type === 'series' ? 'Apple-style series' : 'Direct premium',
      year: heroContent.year,
      duration: formatDuration(heroContent.durationMinutes),
      rating: heroContent.ageRating,
    };
  }, [heroContent]);

  const spotlight = useMemo(() => [...series, ...movies, ...live].slice(0, 4), [series, movies, live]);

  if (loading && !heroContent) {
    return (
      <div className="page-shell min-h-screen pt-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="glass-panel h-[72vh] rounded-[2rem] animate-pulse" />
        </div>
      </div>
    );
  }

  function setInfoOpen(arg0: boolean): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="page-shell pb-16 relative overflow-hidden">
      <img src="/src/assets/group.png" alt="Logo Groupe" className="fixed inset-0 w-full h-full object-contain opacity-10 pointer-events-none z-0" />
      {heroContent && (
        <section className="relative overflow-hidden px-4 pt-24 md:px-6 md:pt-28">
          <div className="mx-auto max-w-7xl">
            <div className="glass-panel relative overflow-hidden rounded-[2.25rem] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroContent.backdropUrl || heroContent.posterUrl})` }}
              />
              <div className="hero-overlay absolute inset-0" />
              <div className="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />

              <div className="relative z-10 grid min-h-[76vh] gap-10 px-6 py-8 md:grid-cols-[1.25fr_380px] md:px-10 md:py-10 lg:px-12">
                <div className="flex flex-col justify-between">
                  <div className="pt-8 md:max-w-3xl md:pt-16">
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-white/14 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/78 backdrop-blur-xl">
                        {heroMeta?.badge}
                      </span>
                      {heroMeta?.year && <span className="text-sm text-white/65">{heroMeta.year}</span>}
                      {heroMeta?.duration && <span className="text-sm text-white/65">{heroMeta.duration}</span>}
                      {heroMeta?.rating && (
                        <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                          {heroMeta.rating}
                        </span>
                      )}
                    </div>

                    <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-white drop-shadow-2xl md:text-6xl lg:text-7xl">
                      {heroContent.title}
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 md:text-lg">
                      {heroContent.description || 'Une sélection immersive avec une atmosphère premium, pensée pour une navigation fluide et cinématographique.'}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link
                        to={`/watch/${heroContent.id}`}
                        className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                      >
                        <Play className="h-4 w-4" fill="currentColor" />
                        Regarder maintenant
                      </Link>

                      <button
                        type="button"
                        onClick={() => setInfoOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-medium text-white backdrop-blur-xl transition hover:bg-white/14"
                      >
                        <Info className="h-4 w-4" />
                          More info
                      </button>

                      <button className="apple-pill flex h-12 w-12 items-center justify-center rounded-full text-white/85 transition hover:bg-white/12">
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  
                </div>

                <aside className="self-end md:self-stretch">
                  <div className="glass-panel h-full rounded-[2rem] p-5 md:p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-white/45">À la une</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Up Next</h2>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950">
                        <Tv2 className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {spotlight.map((item, index) => (
                        <Link
                          key={item.id}
                          to={`/watch/${item.id}`}
                          className="group flex items-center gap-4 rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-3 transition hover:bg-white/[0.08]"
                        >
                          <div className="relative h-20 w-32 overflow-hidden rounded-2xl">
                            <img src={item.posterUrl} alt={item.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs uppercase tracking-[0.18em] text-white/40">0{index + 1}</div>
                            <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-white">{item.title}</h3>
                            <p className="mt-1 text-xs text-white/50">
                              {item.type.toUpperCase()} {item.year ? `• ${item.year}` : ''}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-gradient-to-br from-white/10 to-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/48">Expérience</p>
                      <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">Accueil plus fluide, premium et respirant</h3>
                      <p className="mt-2 text-sm leading-6 text-white/58">
                        Gwo visuels, espace bien dosé, kontni ki pi fasil pou dekouvri sou desktop ak mobile.
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="px-4 pt-12 md:px-6">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
          <CountdownEvent image="/src/assets/1.jpg" title="AVENGERS DOOMSDAY" date="2026-12-18T10:00:00" />
          <CountdownEvent image="/src/assets/2.webp" title="Projet dernière chance" date="2026-03-12T19:00:00" />
          <CountdownEvent image="/src/assets/3.webp" title="From the Ashes" date="2027-05-31T15:00:00" />
          <CountdownEvent image="/src/assets/4.jpg" title="OUTER BANKS SAISON 5" date="2026-12-12T10:00:00" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-4 md:px-6">
        <ContentSlider title="Films en vedette" contents={movies.slice(0, 20)} seeMoreLink="/browse?category=movie" />
        <ContentSlider title="Séries à suivre" contents={series.slice(0, 20)} seeMoreLink="/browse?category=series" />
        <ContentSlider title="Live & événements" contents={live.slice(0, 20)} seeMoreLink="/live-tv" />
      </div>
    </div>
  );
};

export default HomePage;
