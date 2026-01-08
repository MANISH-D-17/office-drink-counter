
import React, { useState, useEffect, createContext, useContext } from 'react';
import { api } from './api';
import { User } from './types';
import Navbar from './components/Navbar';
import OrderPage from './pages/OrderPage';
import MyOrdersPage from './pages/MyOrdersPage';
import SummaryPage from './pages/SummaryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pin: string) => Promise<void>;
  register: (name: string, email: string, pin: string) => Promise<void>;
  updateProfile: (name: string, email: string, pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'order' | 'my-orders' | 'summary' | 'login' | 'register' | 'profile'>('login');

  useEffect(() => {
    const currentUser = api.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setView('order');
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email: string, pin: string) => {
    const u = await api.login(email, pin);
    setUser(u);
    setView('order');
  };

  const handleRegister = async (name: string, email: string, pin: string) => {
    const u = await api.register(name, email, pin);
    setUser(u);
    setView('order');
  };

  const handleUpdateProfile = async (name: string, email: string, pin: string) => {
    if (!user) return;
    const u = await api.updateUserProfile(user.id, { name, email, pin });
    setUser(u);
    setView('order');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setView('login');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6F4E37]"></div>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, loading, login: handleLogin, register: handleRegister, updateProfile: handleUpdateProfile, logout: handleLogout }}>
      <div className="min-h-screen flex flex-col">
        {user && <Navbar user={user} currentView={view} setView={setView} />}
        
        <main className="flex-grow container mx-auto px-4 py-8">
          {!user ? (
            view === 'register' ? <RegisterPage setView={setView} /> : <LoginPage setView={setView} />
          ) : (
            <>
              {view === 'order' && <OrderPage />}
              {view === 'my-orders' && <MyOrdersPage />}
              {view === 'summary' && <SummaryPage />}
              {view === 'profile' && <ProfilePage />}
            </>
          )}
        </main>
        
        <footer className="py-6 text-center text-stone-400 text-sm">
          &copy; 2026 Profitstory.ai. Designed for modern teams.
        </footer>
      </div>
    </AuthContext.Provider>
  );
};

export default App;
