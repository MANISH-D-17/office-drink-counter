import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      await updateProfile(name, email, pin);
      setSuccess(true);
      setPin(''); // Clear pin after success
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(val);
  };

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto mt-10 px-4">
      <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-stone-100">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#003B73] rounded-[1.5rem] mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-900/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#003B73] mb-2 tracking-tight">Edit Profile</h1>
          <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.2em]">Manage Identity Settings</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-500 text-[10px] font-bold p-4 rounded-2xl border border-red-100 uppercase tracking-widest">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 text-green-600 text-[10px] font-bold p-4 rounded-2xl border border-green-100 flex items-center gap-2 uppercase tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Successfully Updated!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
           <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Display Name</label>
            <input 
              required
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#003B73] focus:border-transparent outline-none transition-all font-medium text-sm"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Email Address</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#003B73] focus:border-transparent outline-none transition-all font-medium text-sm"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Update Security PIN</label>
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
            <p className="mt-2 text-[9px] text-stone-300 font-bold uppercase text-center">Required to confirm changes</p>
          </div>
          <button 
            disabled={isSubmitting || pin.length !== 4}
            className="w-full py-5 bg-[#003B73] text-white font-black rounded-2xl hover:bg-[#002B55] transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] text-xs"
          >
            {isSubmitting ? 'Processing...' : 'Save Profile Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;