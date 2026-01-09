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
  const [lastBroadcastId, setLastBroadcastId] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = api.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setView('order');
      requestNotificationPermission();
    }
    setLoading(false);
  }, []);

  // Browser Notification Permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      await Notification.requestPermission();
    }
  };

  const showBrowserNotification = (title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  // Scheduled Reminder Logic (10:30 AM and 2:30 PM)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      
      // Reminders at exactly 10:30 and 14:30
      if (timeStr === "10:30" || timeStr === "14:30") {
        showBrowserNotification(
          "☕ Time to Order!", 
          "Place your order now! It's time to choose your corporate brew."
        );
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user]);

  // Broadcast Polling Logic
  useEffect(() => {
    if (!user) return;

    const pollBroadcasts = async () => {
      try {
        const latest = await api.getLatestBroadcast();
        if (latest && latest.id !== lastBroadcastId) {
          // Verify it's recent (within last 5 mins) to avoid old notification spam
          const broadcastTime = new Date(latest.createdAt).getTime();
          const now = new Date().getTime();
          
          if (now - broadcastTime < 300000) {
            showBrowserNotification("📢 Office Alert", latest.message);
          }
          setLastBroadcastId(latest.id);
        }
      } catch (err) {
        console.error("Broadcast polling error", err);
      }
    };

    const pollInterval = setInterval(pollBroadcasts, 30000); // Poll every 30 seconds
    return () => clearInterval(pollInterval);
  }, [user, lastBroadcastId]);

  const handleLogin = async (email: string, pin: string) => {
    const u = await api.login(email, pin);
    setUser(u);
    setView('order');
    requestNotificationPermission();
  };

  const handleRegister = async (name: string, email: string, pin: string) => {
    const u = await api.register(name, email, pin);
    setUser(u);
    setView('order');
    requestNotificationPermission();
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
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003B73]"></div>
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
          &copy; 2026 Drink Counter. All rights reserved.
        </footer>
      </div>
    </AuthContext.Provider>
  );
};

export default App;