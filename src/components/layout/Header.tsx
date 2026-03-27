import { useState, useEffect } from 'react';
import logo from '../../assets/group.png';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, PlayCircle, Tv2, Film, LayoutGrid, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../ui/SearchBar';

const navItems = [
  { to: '/', label: 'Accueil', icon: LayoutGrid },
  { to: '/browse', label: 'Explorer', icon: Film },
  { to: '/live-tv', label: 'Live', icon: Tv2 },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 18);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-6">
      <div
        className={`mx-auto max-w-7xl rounded-[28px] transition-all duration-300 ${
          isScrolled ? 'glass-panel border border-white/10' : 'bg-transparent border border-transparent'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-3">
                <div className="flex h-10 w-28 items-center ]">
                  <img src={logo} alt="Logo MV Stream" className="h-28 w-28 object-contain" />
                </div>
            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-[-0.03em] text-white"></div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map(({ to, label }) => {
              const active = to === '/' ? location.pathname === to : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-white text-slate-950 shadow-[0_12px_30px_rgba(255,255,255,0.15)]'
                      : 'text-white/70 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <SearchBar />

            {user ? (
              <div className="group relative">
                <button className="apple-pill flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/85 transition hover:bg-white/10">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="max-w-32 truncate">{user.full_name}</span>
                </button>
                <div className="glass-panel invisible absolute right-0 mt-3 w-56 rounded-3xl p-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <Link to="/subscription" className="block rounded-2xl px-4 py-3 text-sm text-white/80 transition hover:bg-white/8 hover:text-white">Abonnement</Link>
                  {user.isAdmin && (
                    <Link to="/admin" className="block rounded-2xl px-4 py-3 text-sm text-white/80 transition hover:bg-white/8 hover:text-white">Tableau admin</Link>
                  )}
                  <button
                    onClick={logout}
                    className="block w-full rounded-2xl px-4 py-3 text-left text-sm text-white/80 transition hover:bg-white/8 hover:text-white"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
              >
                <Sparkles className="h-4 w-4" />
                Connexion
              </Link>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="apple-pill flex h-11 w-11 items-center justify-center rounded-full text-white md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-white/8 px-4 pb-4 pt-2 md:hidden">
            <div className="mb-3 flex justify-end">
              <SearchBar />
            </div>
            <div className="space-y-2">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-3 text-white/85"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
              {!user && (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950"
                >
                  <User className="h-4 w-4" />
                  Connexion
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
