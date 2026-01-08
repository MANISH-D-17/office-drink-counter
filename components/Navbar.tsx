import React, { useState } from 'react';
import { User } from '../types';
import { useAuth } from '../App';

interface NavbarProps {
  user: User;
  currentView: string;
  setView: (view: any) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, currentView, setView }) => {
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Order Drink', view: 'order' },
    { label: 'My History', view: 'my-orders' },
    { label: 'Office Summary', view: 'summary' }
  ];

  const handleNavigate = (view: any) => {
    setView(view);
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-stone-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        {/* Logo Section */}
        <div 
          className="flex items-center cursor-pointer space-x-2"
          onClick={() => handleNavigate('order')}
        >
          <div className="w-10 h-10 bg-[#6F4E37] rounded-xl flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="brand-font text-xl font-bold text-[#6F4E37]">Drink Counter</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <button 
              key={link.view}
              onClick={() => setView(link.view)}
              className={`font-medium transition-colors ${currentView === link.view ? 'text-[#6F4E37]' : 'text-stone-500 hover:text-stone-800'}`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop Profile / Logout */}
        <div className="flex items-center space-x-4">
          <div 
            className="hidden sm:block text-right cursor-pointer group hover:opacity-80 transition-opacity"
            onClick={() => setView('profile')}
          >
            <p className={`text-sm font-semibold transition-colors ${currentView === 'profile' ? 'text-[#6F4E37]' : 'text-stone-800'}`}>{user.name}</p>
            <p className="text-xs text-stone-400">Coffee Enthusiast</p>
          </div>
          
          <button 
            onClick={logout}
            className="hidden sm:block p-2 text-stone-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-stone-500 hover:bg-stone-50 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`md:hidden bg-white border-b border-stone-100 transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-96 opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`}>
        <div className="px-4 py-6 space-y-4">
          {navLinks.map((link) => (
            <button 
              key={link.view}
              onClick={() => handleNavigate(link.view)}
              className={`block w-full text-left px-4 py-3 rounded-xl font-semibold transition-all ${
                currentView === link.view 
                ? 'bg-[#6F4E37] text-white shadow-md shadow-[#6F4E37]/20' 
                : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              {link.label}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-stone-100">
            <button 
              onClick={() => handleNavigate('profile')}
              className={`flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl transition-all ${
                currentView === 'profile' ? 'bg-stone-50 text-[#6F4E37]' : 'text-stone-600'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="font-bold">{user.name}</span>
            </button>
            <button 
              onClick={logout}
              className="flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 mt-2 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="font-bold">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;