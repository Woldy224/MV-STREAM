import { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Filter, Search, X, Sparkles, SlidersHorizontal, Play } from 'lucide-react';
import { ContentAPI } from '../utils/api';
import { toContentItem } from '../utils/mapper';
import { ContentItem, ContentType } from '../types/content';

const categoryOptions: Array<{ label: string; value: ContentType | 'all' }> = [
  { label: 'Films', value: 'movie' },
  { label: 'Séries', value: 'series' },
  { label: 'Live', value: 'live' },
  { label: 'Anime', value: 'anime' },
  { label: 'Documentaires', value: 'documentary' },
];

const BrowsePage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = (queryParams.get('category') as ContentType | 'all') || 'all';
  const initialSearchQuery = queryParams.get('search') || '';

  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ContentType | 'all'>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortBy, setSortBy] = useState<'newest' | 'title'>('newest');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await ContentAPI.list();
        setItems((res.items || []).map(toContentItem));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = [...items];

    if (selectedCategory !== 'all') {
      list = list.filter((x) => x.type === selectedCategory);
    }

    if (q) {
      list = list.filter((x) => x.title.toLowerCase().includes(q));
    }

    if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list.sort((a, b) => Number(b.id) - Number(a.id));
    }

    return list;
  }, [items, selectedCategory, searchQuery, sortBy]);

  const featured = filtered[0];

  return (
    <div className="page-shell min-h-screen px-4 pb-14 pt-28 md:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="glass-panel overflow-hidden rounded-[2.25rem] border border-white/10">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative min-h-[360px] overflow-hidden p-8 md:p-10">
              {featured && (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-70"
                    style={{ backgroundImage: `url(${featured.backdropUrl || featured.posterUrl})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#05070c] via-[#05070c]/82 to-[#05070c]/40" />
                </>
              )}

              <div className="relative z-10 max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/65 backdrop-blur-xl">
                  <Sparkles className="h-3.5 w-3.5" />
                  Explorer le catalogue
                </div>
                <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">Trouve rapidement quoi regarder</h1>
                

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="apple-pill flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/75">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtres rapides
                  </div>
                  <div className="apple-pill rounded-full px-4 py-2 text-sm text-white/75">{filtered.length} titres visibles</div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/8 p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un titre, une série..."
                  className="w-full rounded-full border border-white/10 bg-white/6 py-3 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/20 focus:bg-white/[0.08]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {categoryOptions.map((option) => {
                  const active = selectedCategory === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedCategory(option.value)}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        active ? 'bg-white text-slate-950 font-semibold' : 'apple-pill text-white/68 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setFilterModalOpen(true)}
                  className="glass-panel flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm text-white/80 transition hover:bg-white/10"
                >
                  <Filter className="h-4 w-4" />
                  Plus de filtres
                </button>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'title')}
                  className="glass-panel rounded-2xl px-4 py-3 text-sm text-white/80 outline-none"
                >
                  <option value="newest">Plus récents</option>
                  <option value="title">Ordre alphabétique</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {filterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
            <div className="glass-panel w-full max-w-xl rounded-[2rem] border border-white/10 p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">Filtres</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Affiner la sélection</h2>
                </div>
                <button onClick={() => setFilterModalOpen(false)} className="apple-pill flex h-10 w-10 items-center justify-center rounded-full text-white/70">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/60">Type de contenu</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as ContentType | 'all')}
                    className="glass-panel w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  >
                    
                    <option value="movie">Films</option>
                    <option value="series">Séries</option>
                    <option value="live">Live</option>
                    <option value="anime">Anime</option>
                    <option value="documentary">Documentaires</option> 
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">Tri</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'title')}
                    className="glass-panel w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="newest">Plus récents</option>
                    <option value="title">Titre</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSortBy('newest');
                  }}
                  className="apple-pill rounded-full px-5 py-3 text-sm text-white/80"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => setFilterModalOpen(false)}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="pt-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/40">Catalogue</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Résultats</h2>
            </div>
            <div className="text-sm text-white/45">{filtered.length} contenu(x)</div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="glass-panel aspect-[16/10] rounded-[1.5rem] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map((item) => (
                <Link
                  to={`/watch/${item.id}`}
                  key={item.id}
                  className="group apple-grid-card poster-sheen relative overflow-hidden rounded-[1.6rem] transition hover:-translate-y-1"
                >
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="aspect-[16/10] h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#04070c] via-[#04070c]/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-white/12 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/68 backdrop-blur-xl">
                        {item.type}
                      </span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-950 opacity-0 transition group-hover:opacity-100">
                        <Play className="h-3.5 w-3.5" fill="currentColor" />
                      </div>
                    </div>
                    <h3 className="line-clamp-1 text-sm font-semibold tracking-[-0.02em] text-white md:text-base">{item.title}</h3>
                    <p className="mt-1 text-xs text-white/48">
                      {item.year || 'Nouveau'} {item.ageRating ? `• ${item.ageRating}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default BrowsePage;
