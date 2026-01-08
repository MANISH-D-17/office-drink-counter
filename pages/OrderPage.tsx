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
    const id = Math.random().toString(36).substr(2, 5);
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
    if (selectedSlots.length === 0) return alert("Please select at least one time slot!");
    if (cart.length === 0) return alert("Your cart is empty!");
    if (!user) return;

    setIsSubmitting(true);
    try {
      await Promise.all(
        selectedSlots.map(slot => api.placeOrder(user.id, user.name, cart, slot))
      );
      setCart([]);
      setSelectedSlots([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert("Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
      <div className="flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Morning or Afternoon?</h1>
          <p className="text-stone-500">Choose one or both slots for your drinks.</p>
        </header>

        <div className="grid grid-cols-2 gap-4 mb-10">
          {[TimeSlot.MORNING, TimeSlot.AFTERNOON].map(s => {
            const isSelected = selectedSlots.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleSlot(s)}
                className={`p-6 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${
                  isSelected 
                  ? 'border-[#6F4E37] bg-[#6F4E37] text-white shadow-xl scale-[1.02]' 
                  : 'border-white bg-white text-stone-600 hover:border-stone-200 shadow-sm'
                }`}
              >
                <div className={`text-sm font-semibold mb-1 ${isSelected ? 'text-stone-200' : 'text-stone-400'}`}>{s === TimeSlot.MORNING ? 'Early' : 'Late'}</div>
                <div className="text-xl font-bold">{s}</div>
              </button>
            );
          })}
        </div>

        <h2 className="text-xl font-bold text-stone-800 mb-6">Available Drinks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {DRINKS.map(drink => (
            <div key={drink.type} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all flex flex-col">
              <div className="text-4xl mb-4">{drink.icon}</div>
              <h3 className="text-lg font-bold text-stone-800 mb-1">{drink.type}</h3>
              <p className="text-stone-400 text-sm mb-6 flex-grow">{drink.desc}</p>
              <button
                onClick={() => addToCart(drink.type)}
                className={`w-full py-3 font-semibold rounded-xl transition-all ${
                  feedback[drink.type] 
                  ? 'bg-green-100 text-green-700'
                  : 'bg-stone-50 text-[#6F4E37] hover:bg-[#6F4E37] hover:text-white'
                }`}
              >
                {feedback[drink.type] ? 'Added!' : 'Add to Cart'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-96">
        <div className="bg-white rounded-2xl shadow-lg border border-stone-100 sticky top-24 p-6">
          <h2 className="text-xl font-bold text-stone-800 mb-6">Your Order</h2>
          {showSuccess && <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium">Order placed!</div>}

          <div className="space-y-4 max-h-[50vh] overflow-y-auto mb-6 pr-2">
            {cart.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-10">Cart is empty.</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="p-4 bg-stone-50 rounded-xl space-y-3 relative">
                  <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 text-stone-300 hover:text-red-500">×</button>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-stone-800">{item.drink}</span>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => updateCartItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} className="w-6 h-6 bg-white rounded shadow-sm text-stone-500">-</button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })} className="w-6 h-6 bg-white rounded shadow-sm text-stone-500">+</button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {Object.values(SugarPreference).map(s => (
                      <button
                        key={s}
                        onClick={() => updateCartItem(item.id, { sugar: s })}
                        className={`text-[10px] px-2 py-1 rounded border flex-1 transition-all ${item.sugar === s ? 'bg-[#6F4E37] text-white border-[#6F4E37]' : 'bg-white text-stone-400 border-stone-200'}`}
                      >
                        {s === SugarPreference.WITH_SUGAR ? 'Sugar' : 'No Sugar'}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Note (optional)..."
                    value={item.note || ''}
                    onChange={(e) => updateCartItem(item.id, { note: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#6F4E37]"
                  />
                </div>
              ))
            )}
          </div>

          <button
            disabled={selectedSlots.length === 0 || cart.length === 0 || isSubmitting}
            onClick={handlePlaceOrder}
            className={`w-full py-4 rounded-xl font-bold transition-all ${
              selectedSlots.length === 0 || cart.length === 0 || isSubmitting
              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
              : 'bg-[#6F4E37] text-white hover:bg-stone-800'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;