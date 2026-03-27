import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(fullName, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || "Impossible de créer le compte.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-20 relative overflow-hidden">
      <img src="/src/assets/group.png" alt="Logo Groupe" className="fixed inset-0 w-full h-full object-contain opacity-10 pointer-events-none z-0" />
      <div className="w-full max-w-md rounded-2xl bg-[#121217] border border-white/10 shadow-2xl p-8">
        <h1 className="text-3xl font-extrabold text-white text-center">Créer un compte</h1>
        <p className="text-gray-400 text-center mt-2">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-[#e50914] hover:text-[#ff2a2a] font-semibold">
            Connexion
          </Link>
        </p>

        {error && (
          <div className="mt-6 p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-200 flex gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Nom complet</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white/10 border border-white/10 focus:border-white/25 rounded-lg pl-10 pr-3 py-2 outline-none"
                placeholder="Ex: Jean Pierre"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/10 focus:border-white/25 rounded-lg pl-10 pr-3 py-2 outline-none"
                placeholder="you@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/10 focus:border-white/25 rounded-lg pl-10 pr-3 py-2 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/10 focus:border-white/25 rounded-lg pl-10 pr-3 py-2 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-[#e50914] hover:bg-[#b81d24] disabled:opacity-70 text-white font-semibold rounded-lg py-2.5 transition"
          >
            {isSubmitting ? 'Création…' : 'Créer le compte'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
