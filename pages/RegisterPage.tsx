
import React, { useState } from 'react';
import { useAuth } from '../App';

interface RegisterPageProps {
  setView: (view: any) => void;
}

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
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-stone-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#6F4E37] rounded-2xl mx-auto flex items-center justify-center text-white mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Create Account</h1>
          <p className="text-stone-400">Join the office drink network.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-500 text-sm p-4 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
           <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Full Name</label>
            <input 
              required
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#6F4E37] focus:border-transparent outline-none transition-all"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Email Address</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#6F4E37] focus:border-transparent outline-none transition-all"
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Set 4-Digit PIN</label>
            <input 
              required
              type="password" 
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={handlePinChange}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#6F4E37] focus:border-transparent outline-none transition-all tracking-widest text-center text-xl font-bold"
              placeholder="••••"
            />
            <p className="mt-2 text-xs text-stone-400">Choose a 4-digit numeric code for fast login.</p>
          </div>
          <button 
            disabled={isSubmitting || pin.length !== 4}
            className="w-full py-4 bg-[#6F4E37] text-white font-bold rounded-xl hover:bg-stone-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-stone-400">Already have an account? </span>
          <button 
            onClick={() => setView('login')}
            className="text-[#6F4E37] font-bold hover:underline"
          >
            Login here
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
