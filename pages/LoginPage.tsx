import React, { useState } from 'react';
import { useAuth } from '../App';

const Logo = () => (
  <svg viewBox="0 0 200 200" className="h-20 w-20 md:h-24 md:w-24">
    <circle cx="100" cy="100" r="95" fill="#003B73" />
    <path 
      d="M50 75 H75 L85 135 H135 L145 85 H75" 
      stroke="white" 
      strokeWidth="8" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <circle cx="95" cy="155" r="10" fill="white" />
    <circle cx="125" cy="155" r="10" fill="white" />
    <path 
      d="M125 75 L130 85 L140 85 L132 91 L135 101 L125 95 L115 101 L118 91 L110 85 L120 85 Z" 
      fill="#FBBF24" 
    />
    <path 
      d="M150 55 L155 65 L165 65 L157 71 L160 81 L150 75 L140 81 L143 71 L135 65 L145 65 Z" 
      fill="#FBBF24" 
    />
  </svg>
);

const LoginPage: React.FC<{ setView: (view: any) => void }> = ({ setView }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Strict Regex for @profitstory.ai
    const profitStoryRegex = /^[a-zA-Z0-9._%+-]+@profitstory\.ai$/;
    if (!profitStoryRegex.test(email.toLowerCase())) {
      return setError('Access restricted: Use your @profitstory.ai email');
    }
    if (pin.length !== 4) return setError('PIN must be 4 digits');
    
    setIsSubmitting(true);
    setError('');
    try {
      await login(email, pin);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 md:mt-20 px-4">
      <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-stone-100">
        <div className="text-center mb-8 md:mb-10">
          <div className="flex justify-center mb-4 md:mb-6">
            <Logo />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#003B73] mb-1 md:mb-2 tracking-tight">System Login</h1>
          <p className="text-stone-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Corporate Brew Portal</p>
        </div>

        {error && <div className="mb-4 md:mb-6 bg-red-50 text-red-500 text-[10px] font-bold p-3 md:p-4 rounded-xl md:rounded-2xl border border-red-100 uppercase tracking-widest text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Corporate Email</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#003B73] focus:border-transparent outline-none transition-all font-medium text-sm"
              placeholder="name@profitstory.ai"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Security PIN</label>
            <input 
              required
              type="password" 
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#003B73] focus:border-transparent outline-none transition-all tracking-[0.8em] text-center text-xl md:text-2xl font-black text-[#003B73]"
              placeholder="••••"
            />
          </div>
          <button 
            disabled={isSubmitting || pin.length !== 4}
            className="w-full py-4 md:py-5 bg-[#003B73] text-white font-black rounded-xl md:rounded-2xl hover:bg-[#002B55] transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] text-[10px] md:text-xs"
          >
            {isSubmitting ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>

        <div className="mt-8 md:mt-10 text-center text-[10px]">
          <span className="text-stone-300 font-black uppercase tracking-widest">New team member? </span>
          <button onClick={() => setView('register')} className="text-[#003B73] font-black hover:underline uppercase tracking-widest">Register Account</button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;