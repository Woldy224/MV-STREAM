import { useEffect, useState, useRef, type FC } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Plus, Info, Check } from 'lucide-react';
import { ContentItem } from '../../types/content';
import { isInMyList, toggleMyList } from '../../utils/library';

interface ContentSliderProps {
  title: string;
  contents: ContentItem[];
  seeMoreLink?: string;
}

const ContentSlider: FC<ContentSliderProps> = ({ title, contents, seeMoreLink }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<Set<string>>(() => new Set(contents.filter((item) => isInMyList(item.id)).map((item) => item.id)));

  useEffect(() => {
    setSavedItems(new Set(contents.filter((item) => isInMyList(item.id)).map((item) => item.id)));
  }, [contents]);

  const handleToggleList = (id: string) => {
    const next = toggleMyList(id);
    setSavedItems((prev) => {
      const clone = new Set(prev);
      if (next) clone.add(id);
      else clone.delete(id);
      return clone;
    });
  };

  const slideLeft = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, clientWidth } = sliderRef.current;
    sliderRef.current.scrollTo({ left: scrollLeft - clientWidth * 0.82, behavior: 'smooth' });
    setCurrentSlide(Math.max(0, currentSlide - 1));
  };

  const slideRight = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = sliderRef.current;
    sliderRef.current.scrollTo({ left: scrollLeft + clientWidth * 0.82, behavior: 'smooth' });
    const maxSlides = Math.ceil(scrollWidth / clientWidth) - 1;
    setCurrentSlide(Math.min(maxSlides, currentSlide + 1));
  };

  return (
    <section className="my-12" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="section-heading text-2xl font-semibold tracking-[-0.04em] text-white md:text-[2rem]">{title}</h2>
          <p className="mt-1 text-sm text-white/45">Sélection pensée pour une expérience cinéma plus élégante.</p>
        </div>
        {seeMoreLink && (
          <Link to={seeMoreLink} className="text-sm font-medium text-white/55 transition hover:text-white">
            Voir tout
          </Link>
        )}
      </div>

      <div className="relative group">
        <button
          onClick={slideLeft}
          className={`glass-panel absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition ${
            isHovering ? 'opacity-100' : 'opacity-0'
          } ${currentSlide === 0 ? 'cursor-not-allowed opacity-30' : 'hover:scale-105'}`}
          disabled={currentSlide === 0}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={slideRight}
          className={`glass-panel absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition ${
            isHovering ? 'opacity-100' : 'opacity-0'
          } hover:scale-105`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div
          ref={sliderRef}
          className="scrollbar-hide flex gap-5 overflow-x-auto pb-2 pt-1 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {contents.map((item) => (
            <article
              key={item.id}
              className="group/card poster-sheen relative flex-none w-[250px] sm:w-[280px] md:w-[320px] transition-transform duration-300 hover:-translate-y-1"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="apple-grid-card relative aspect-[16/10] overflow-hidden">
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-500 group-hover/card:scale-[1.04]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#04070c] via-[#04070c]/15 to-transparent" />

                <div className="absolute left-4 top-4 flex items-center gap-2">
                  <span className="rounded-full bg-white/16 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-white/78 backdrop-blur-xl">
                    {item.type}
                  </span>
                  {item.year && <span className="text-xs text-white/60">{item.year}</span>}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <div>
                      <h3 className="line-clamp-1 text-lg font-semibold tracking-[-0.03em] text-white">{item.title}</h3>
                      <p className="text-xs text-white/52">
                        {item.ageRating || 'Tout public'}
                        {item.category ? ` • ${item.category}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleList(item.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-xl transition hover:bg-white/20"
                      title={savedItems.has(item.id) ? 'Retirer de Ma liste' : 'Ajouter à Ma liste'}
                    >
                      {savedItems.has(item.id) ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${hoveredItem === item.id ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="flex items-center gap-2 pt-2">
                      <Link
                        to={`/watch/${item.id}`}
                        className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
                      >
                        <Play className="h-4 w-4" fill="currentColor" />
                        Lire
                      </Link>
                      <button className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/82 backdrop-blur-xl transition hover:bg-white/16">
                        <Info className="h-4 w-4" />
                        Détails
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContentSlider;
