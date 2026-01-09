import React, { useState } from 'react';
import { useAuth } from '../App';

interface RegisterPageProps {
  setView: (view: any) => void;
}

const Logo = () => (
  <svg viewBox="0 0 200 200" className="h-16 w-16">
    <circle cx="100" cy="100" r="95" fill="#003B73" />
    <path 
      d="M50 70 H70 L80 130 H140 L150 80 H80" 
      stroke="white" 
      strokeWidth="8" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <circle cx="90" cy="150" r="10" fill="white" />
    <circle cx="130" cy="150" r="10" fill="white" />
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

const RegisterPage: React.FC<RegisterPageProps> = ({ setView }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await register(name, email, pin);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(val);
  };

  return (
    <div className="max-w-md mx-auto mt-20 px-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-stone-100">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <h1 className="text-3xl font-black text-[#003B73] mb-2 tracking-tight">Create Account</h1>
          <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.2em]">Join Corporate Brew Network</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-500 text-[10px] font-bold p-4 rounded-2xl border border-red-100 uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
           <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Full Name</label>
            <input 
              required
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#003B73] focus:border-transparent outline-none transition-all font-medium"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Work Email</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#003B73] focus:border-transparent outline-none transition-all font-medium"
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Set 4-Digit PIN</label>
            <input 
              required
              type="password" 
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={handlePinChange}
              className="w-full px-5 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#003B73] focus:border-transparent outline-none transition-all tracking-[0.8em] text-center text-2xl font-black text-[#003B73]"
              placeholder="••••"
            />
            <p className="mt-2 text-[9px] text-stone-300 font-bold uppercase text-center">Numeric code for instant login</p>
          </div>
          <button 
            disabled={isSubmitting || pin.length !== 4}
            className="w-full py-5 bg-[#003B73] text-white font-black rounded-2xl hover:bg-[#002B55] transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] text-xs"
          >
            {isSubmitting ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-10 text-center text-[10px]">
          <span className="text-stone-300 font-black uppercase tracking-widest">Already a member? </span>
          <button 
            onClick={() => setView('login')}
            className="text-[#003B73] font-black hover:underline uppercase tracking-widest"
          >
            Login Access
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;