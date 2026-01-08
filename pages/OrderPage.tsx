
import React, { useState } from 'react';
import { DrinkType, SugarPreference, TimeSlot, OrderItem } from '../types';
import { useAuth } from '../App';
import { api } from '../api';

const DRINKS = [
  { type: DrinkType.COFFEE, icon: '☕', desc: 'Premium roasted beans' },
  { type: DrinkType.TEA, icon: '🍵', desc: 'Soothing organic leaves' },
  { type: DrinkType.MILK, icon: '🥛', desc: 'Fresh dairy or almond' },
  { type: DrinkType.BLACK_TEA, icon: '🍃', desc: 'Strong classic brew' },
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
    setCart([...cart, { id, drink, sugar: SugarPreference.WITHOUT_SUGAR, quantity: 1 }]);
    
    // Feedback
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
      // Place order for each selected slot
      await Promise.all(
        selectedSlots.map(slot => api.placeOrder(user.id, user.name, cart, slot))
      );
      
      setCart([]);
      setSelectedSlots([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert("Failed to place order. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Menu Area */}
      <div className="flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Morning or Afternoon?</h1>
          <p className="text-stone-500">You can select both slots if needed.</p>
        </header>

        {/* Multi-Slot Selector */}
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
                <div className={`text-sm font-semibold mb-1 ${isSelected ? 'text-stone-200' : 'text-stone-400'}`}>
                  {s === TimeSlot.MORNING ? 'Early Bird' : 'Midday Boost'}
                </div>
                <div className="text-xl font-bold">{s}</div>
                {isSelected && (
                  <div className="absolute top-2 right-2 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Drink Selection */}
        <h2 className="text-xl font-bold text-stone-800 mb-6">Available Drinks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {DRINKS.map(drink => (
            <div 
              key={drink.type} 
              className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all flex flex-col relative overflow-hidden"
            >
              <div className="text-4xl mb-4">{drink.icon}</div>
              <h3 className="text-lg font-bold text-stone-800 mb-1">{drink.type}</h3>
              <p className="text-stone-400 text-sm mb-6 flex-grow">{drink.desc}</p>
              
              <button
                onClick={() => addToCart(drink.type)}
                className={`w-full py-3 font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 ${
                  feedback[drink.type] 
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-stone-50 text-[#6F4E37] hover:bg-[#6F4E37] hover:text-white'
                }`}
              >
                {feedback[drink.type] ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-bounce" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <span>Add to Cart</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-96">
        <div className="bg-white rounded-2xl shadow-lg border border-stone-100 sticky top-24 p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-stone-800">Your Order</h2>
            <span className="bg-[#6F4E37] text-white text-xs font-bold px-2.5 py-1 rounded-full">{cart.length}</span>
          </div>

          {showSuccess && (
            <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Order placed successfully!</span>
            </div>
          )}

          <div className="space-y-4 max-h-[50vh] overflow-y-auto mb-6 pr-2">
            {cart.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-stone-300 mb-4 flex justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-stone-400 text-sm">Cart is empty.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="p-4 bg-stone-50 rounded-xl relative group">
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="absolute top-2 right-2 text-stone-300 hover:text-red-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-stone-800">{item.drink}</span>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => updateCartItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                        className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center text-stone-500 hover:text-[#6F4E37]"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button 
                         onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })}
                         className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center text-stone-500 hover:text-[#6F4E37]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(SugarPreference).map(s => (
                      <button
                        key={s}
                        onClick={() => updateCartItem(item.id, { sugar: s })}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                          item.sugar === s 
                          ? 'border-[#6F4E37] bg-[#6F4E37] text-white' 
                          : 'border-stone-200 bg-white text-stone-400 hover:border-stone-300'
                        }`}
                      >
                        {s === SugarPreference.WITH_SUGAR ? 'Sugar' : 'No Sugar'}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-stone-100 pt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-stone-500">Scheduled for</span>
              <span className={`text-sm font-bold ${selectedSlots.length > 0 ? 'text-[#6F4E37]' : 'text-stone-300 italic'}`}>
                {selectedSlots.length > 0 ? selectedSlots.join(', ') : 'Select slots'}
              </span>
            </div>
            <button
              disabled={selectedSlots.length === 0 || cart.length === 0 || isSubmitting}
              onClick={handlePlaceOrder}
              className={`w-full py-4 rounded-xl font-bold transition-all shadow-md ${
                selectedSlots.length === 0 || cart.length === 0 || isSubmitting
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed shadow-none'
                : 'bg-[#6F4E37] text-white hover:bg-stone-800 active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? 'Brewing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
