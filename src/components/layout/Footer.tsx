import React from 'react';
import logo from '../../assets/group.png';
import { Link } from 'react-router-dom';
import { Play, Twitter, Facebook, Instagram, Youtube, Mail, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-950 pt-12 pb-6 text-gray-400">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-3">
                            <div className="flex h-10 w-28 items-center mb-4">
                              <img src={logo} alt="Logo MV Stream" className="h-28 w-28 object-contain" />
                            </div>
                        <div className="leading-tight">
                          <div className="text-lg font-semibold tracking-[-0.03em] text-white"></div>
                        </div>
            </Link>
            
            <p className="text-sm mb-4">
              Votre destination de streaming premium pour les films, les séries TV, les documentaires et les chaînes de télévision en direct.
            </p>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="hover:text-white transition-colors" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="YouTube">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="col-span-1">
            <h3 className="text-white font-medium mb-4">Liens Rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Acceuil</Link>
              </li>
              <li>
                <Link to="/browse" className="hover:text-white transition-colors">Recherche</Link>
              </li>
              <li>
                <Link to="/live-tv" className="hover:text-white transition-colors">Live TV</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">Connexion</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">Inscription</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="col-span-1">
            <h3 className="text-white font-medium mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/browse?category=movies" className="hover:text-white transition-colors">Films</Link>
              </li>
              <li>
                <Link to="/browse?category=series" className="hover:text-white transition-colors">TV Series</Link>
              </li>
              <li>
                <Link to="/browse?category=documentaries" className="hover:text-white transition-colors">Documentaries</Link>
              </li>
              <li>
                <Link to="/browse?category=cartoons" className="hover:text-white transition-colors">Animes</Link>
              </li>
              <li>
                <Link to="/browse?category=new" className="hover:text-white transition-colors">A Venir</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-span-1">
            <h3 className="text-white font-medium mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-white transition-colors">Centre d'aide</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">Contactez-nous</Link>
              </li>
              <li className="flex items-center space-x-2">
                <Mail size={16} />
                <span>mediaversestudio1@gmail.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone size={16} />
                <span>+509 3209-9430</span>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-800 my-8" />

        {/* Bottom footer */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm">
          <div className="mb-4 md:mb-0">
            &copy; {currentYear} mvstream. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;