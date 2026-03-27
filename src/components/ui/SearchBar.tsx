import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

const SearchBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsExpanded(false);
    }
  };

  const toggleSearch = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const closeSearch = () => {
    setIsExpanded(false);
    setSearchQuery('');
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="relative">
      <form
        onSubmit={handleSearch}
        className={`apple-pill flex items-center overflow-hidden rounded-full transition-all duration-300 ${
          isExpanded ? 'w-64 border-white/15 bg-white/8 px-2 py-1.5' : 'w-11 border-transparent bg-transparent'
        }`}
      >
        <button
          type={isExpanded ? 'submit' : 'button'}
          onClick={!isExpanded ? toggleSearch : undefined}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        <input
          ref={inputRef}
          type="text"
          placeholder="Search movies, series..."
          className={`w-full bg-transparent px-2 text-sm text-white placeholder:text-white/40 outline-none transition-all duration-300 ${
            isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'
          }`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {isExpanded && (
          <button
            type="button"
            onClick={closeSearch}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>
    </div>
  );
};

export default SearchBar;
