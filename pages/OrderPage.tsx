import React, { useState } from 'react';
import { DrinkType, SugarPreference, TimeSlot, OrderItem } from '../types';
import { useAuth } from '../App';
import { api } from '../api';

const DRINKS = [
  { type: DrinkType.COFFEE, icon: '☕', desc: 'Premium roasted beans' },
  { type: DrinkType.TEA, icon: '🍵', desc: 'Soothing organic leaves' },
  { type: DrinkType.MILK, icon: '🥛', desc: 'Fresh dairy or almond' },
  { type: DrinkType.BLACK_TEA, icon: '🍃', desc: 'Soothing classic brew' },
  { type: DrinkType.BLACK_COFFEE, icon: '🖤', desc: 'Pure caffeine kick' },
];

const OrderPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});

  const toggleSlot = (slot: TimeSlot) => {
    setSelectedSlots(prev => 
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const addToCart = (drink: DrinkType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setCart([...cart, { id, drink, sugar: SugarPreference.WITH_SUGAR, quantity: 1, note: '' }]);
    
    setFeedback(prev => ({ ...prev, [drink]: true }));
    setTimeout(() => {
      setFeedback(prev => ({ ...prev, [drink]: false }));
    }, 1500);
  };

  const updateCartItem = (id: string, updates: Partial<OrderItem>) => {
    setCart(cart.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handlePlaceOrder = async () => {
    if (selectedSlots.length === 0) return alert("Please select a delivery window (Morning or Afternoon)!");
    if (cart.length === 0) return alert("Your cart is empty!");
    if (!user) return alert("User session lost. Please log in again.");

    setIsSubmitting(true);
    try {
      // Execute sequentially for higher reliability on mobile networks
      for (const slot of selectedSlots) {
        await api.placeOrder(user.id, user.name, cart, slot);
      }
      
      setCart([]);
      setSelectedSlots([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Submission Error:', err);
      alert(err.message || "Failed to place order. Please check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
      <div className="flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Morning or Afternoon?</h1>
          <p className="text-stone-500">Select your preferred delivery windows.</p>
        </header>

        <div className="grid grid-cols-2 gap-4 mb-10">
          {[TimeSlot.MORNING, TimeSlot.AFTERNOON].map(s => {
            const isSelected = selectedSlots.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleSlot(s)}
                className={`p-6 rounded-2xl border-2 transition-all text-left relative overflow-hidden group shadow-sm ${
                  isSelected 
                  ? 'border-[#003B73] bg-[#003B73] text-white scale-[1.02]' 
                  : 'border-white bg-white text-stone-600 hover:border-stone-200'
                }`}
              >
                <div className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${isSelected ? 'text-[#FBBF24]' : 'text-stone-300'}`}>{s === TimeSlot.MORNING ? 'Early Session' : 'Late Session'}</div>
                <div className="text-xl font-bold">{s}</div>
              </button>
            );
          })}
        </div>

        <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[#003B73] rounded-full"></span>
          Available Beverages
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {DRINKS.map(drink => (
            <div key={drink.type} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 hover:shadow-lg hover:border-[#003B73]/20 transition-all flex flex-col group">
              <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">{drink.icon}</div>
              <h3 className="text-lg font-bold text-stone-800 mb-1">{drink.type}</h3>
              <p className="text-stone-400 text-xs mb-6 flex-grow">{drink.desc}</p>
              <button
                onClick={() => addToCart(drink.type)}
                className={`w-full py-3 font-bold rounded-xl transition-all ${
                  feedback[drink.type] 
                  ? 'bg-green-50 text-green-600'
                  : 'bg-stone-50 text-[#003B73] hover:bg-[#003B73] hover:text-white'
                }`}
              >
                {feedback[drink.type] ? 'Added to Cart' : 'Order Now'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-96">
        <div className="bg-white rounded-3xl shadow-xl border border-stone-100 sticky top-24 p-8">
          <h2 className="text-xl font-bold text-stone-800 mb-6">Cart Summary</h2>
          {showSuccess && <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl text-xs font-bold border border-green-100 animate-bounce">Order successfully logged!</div>}

          <div className="space-y-4 max-h-[50vh] overflow-y-auto mb-6 pr-2 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-stone-100 text-6xl mb-4">🛒</div>
                <p className="text-stone-400 text-xs font-medium uppercase tracking-wider">Your tray is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="p-4 bg-stone-50 rounded-2xl space-y-3 relative border border-stone-100">
                  <button onClick={() => removeFromCart(item.id)} className="absolute top-3 right-3 text-stone-300 hover:text-red-500 transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div className="flex justify-between items-center pr-6">
                    <span className="font-bold text-stone-800">{item.drink}</span>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => updateCartItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} className="w-6 h-6 bg-white rounded border border-stone-200 text-stone-400 font-bold">-</button>
                      <span className="text-sm font-bold w-4 text-center text-[#003B73]">{item.quantity}</span>
                      <button onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })} className="w-6 h-6 bg-white rounded border border-stone-200 text-stone-400 font-bold">+</button>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {Object.values(SugarPreference).map(s => (
                      <button
                        key={s}
                        onClick={() => updateCartItem(item.id, { sugar: s })}
                        className={`text-[9px] px-2 py-1.5 rounded-lg border flex-1 font-bold transition-all ${item.sugar === s ? 'bg-[#FBBF24] text-white border-[#FBBF24]' : 'bg-white text-stone-400 border-stone-200'}`}
                      >
                        {s === SugarPreference.WITH_SUGAR ? 'SUGAR' : 'NO SUGAR'}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add special instructions..."
                    value={item.note || ''}
                    onChange={(e) => updateCartItem(item.id, { note: e.target.value })}
                    className="w-full bg-white border border-stone-100 rounded-xl px-3 py-2 text-[10px] outline-none focus:border-[#003B73] transition-colors"
                  />
                </div>
              ))
            )}
          </div>

          <button
            disabled={selectedSlots.length === 0 || cart.length === 0 || isSubmitting}
            onClick={handlePlaceOrder}
            className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg ${
              selectedSlots.length === 0 || cart.length === 0 || isSubmitting
              ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
              : 'bg-[#003B73] text-white hover:bg-[#002B55] hover:shadow-[#003B73]/20'
            }`}
          >
            {isSubmitting ? 'Syncing with Server...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;