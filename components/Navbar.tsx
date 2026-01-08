
import React from 'react';
import { User } from '../types';
import { useAuth } from '../App';

interface NavbarProps {
  user: User;
  currentView: string;
  setView: (view: any) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, currentView, setView }) => {
  const { logout } = useAuth();

  return (
    <nav className="bg-white border-b border-stone-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        <div 
          className="flex items-center cursor-pointer space-x-2"
          onClick={() => setView('order')}
        >
          <div className="w-10 h-10 bg-[#6F4E37] rounded-xl flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="brand-font text-xl font-bold text-[#6F4E37]">Drink Counter</span>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => setView('order')}
            className={`font-medium transition-colors ${currentView === 'order' ? 'text-[#6F4E37]' : 'text-stone-500 hover:text-stone-800'}`}
          >
            Order Drink
          </button>
          <button 
            onClick={() => setView('my-orders')}
            className={`font-medium transition-colors ${currentView === 'my-orders' ? 'text-[#6F4E37]' : 'text-stone-500 hover:text-stone-800'}`}
          >
            My History
          </button>
          <button 
            onClick={() => setView('summary')}
            className={`font-medium transition-colors ${currentView === 'summary' ? 'text-[#6F4E37]' : 'text-stone-500 hover:text-stone-800'}`}
          >
            Office Summary
          </button>
        </div>

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
            className="p-2 text-stone-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
