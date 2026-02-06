import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import { OfficeSummary, SugarPreference, Order, OrderItem } from '../types';

const ADMIN_EMAILS = ['manish.d@profitstory.ai', 'mathan.kumar@profitstory.ai'];

const SummaryPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<OfficeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);
  
  // Admin Edit State
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<OrderItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    refreshSummary();
  }, []);

  const refreshSummary = () => {
    setLoading(true);
    api.getOfficeSummary().then(res => {
      setSummary(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const handleBroadcastArrived = async () => {
    if (!window.confirm("Send 'Coffee Arrived' notification AND email blast to all users?")) return;
    setIsBroadcasting(true);
    try {
      const msg = "☕ Coffee has arrived! Please come and pick up your drinks.";
      await api.sendBroadcast(msg, "COFFEE_ARRIVED");
      await api.sendEmailBlast("☕ Your Drink is Ready!", msg);
      setBroadcastSent(true);
      setTimeout(() => setBroadcastSent(false), 5000);
    } catch (err: any) {
      alert("Notification failed: " + err.message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleBroadcastReminder = async () => {
    if (!window.confirm("Send 'Time to Order' notification AND email blast to all users?")) return;
    setIsBroadcasting(true);
    try {
      const msg = "📢 It is time to order! Please place your beverage requests now on the Drink Counter app.";
      await api.sendBroadcast(msg, "ORDER_REMINDER");
      await api.sendEmailBlast("🕒 Time to Order your Coffee/Tea!", msg);
      setBroadcastSent(true);
      setTimeout(() => setBroadcastSent(false), 5000);
    } catch (err: any) {
      alert("Notification failed: " + err.message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("CRITICAL: This will remove EVERY order from the board. Continue?")) return;
    if (!window.confirm("Final check: Are you absolutely sure? This cannot be undone.")) return;
    
    try {
      await api.clearAllOrders();
      refreshSummary();
    } catch (err) {
      alert("Failed to clear board.");
    }
  };

  // Inline Editing Functions
  const startEdit = (order: Order) => {
    setEditingOrderId(order.id);
    setEditBuffer(JSON.parse(JSON.stringify(order.items)));
  };

  const cancelEdit = () => {
    setEditingOrderId(null);
    setEditBuffer([]);
  };

  const updateBufferItem = (id: string, updates: Partial<OrderItem>) => {
    setEditBuffer(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const saveEdit = async () => {
    if (!editingOrderId) return;
    setIsUpdating(true);
    try {
      await api.updateOrder(editingOrderId, editBuffer);
      setEditingOrderId(null);
      refreshSummary();
    } catch (err) {
      alert("Failed to update order");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Delete this specific order?")) return;
    try {
      await api.deleteOrder(orderId);
      refreshSummary();
    } catch (err) {
      alert("Failed to delete order");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003B73] mb-4"></div>
      <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Syncing Performance Data</p>
    </div>
  );

  if (!summary || summary.totalDrinks === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 px-4">
        <h1 className="text-3xl font-bold text-stone-900 mb-4">Office Summary</h1>
        <div className="bg-white rounded-3xl p-10 md:p-20 border border-stone-100 shadow-sm text-stone-300">
          <div className="text-6xl mb-6">📊</div>
          <p className="font-bold uppercase tracking-widest text-sm">No transactions logged yet</p>
        </div>
      </div>
    );
  }

  const isAdmin = user && ADMIN_EMAILS.includes(user.email.toLowerCase());

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4">
      <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-1 bg-[#003B73] rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#003B73]">Corporate Analytics</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-stone-900 tracking-tight">Procurement Dashboard</h1>
          <p className="text-stone-400 text-xs md:text-sm mt-1">
            Office brew consumption 
            <span className="text-green-500 ml-2 font-bold flex items-center inline-flex gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> 
              LIVE
            </span>
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 md:flex md:gap-4 w-full md:w-auto">
          <div className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-2 md:gap-4 transition-transform hover:scale-[1.02]">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center text-[#003B73] text-lg md:text-xl font-black">☕</div>
            <div>
              <span className="text-[9px] md:text-[10px] text-stone-400 block font-black uppercase tracking-widest leading-tight">Total Brews</span>
              <span className="text-xl md:text-2xl font-black text-stone-900 leading-none">{summary.totalDrinks}</span>
            </div>
          </div>
          <div className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-2 md:gap-4 transition-transform hover:scale-[1.02]">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-50 rounded-xl md:rounded-2xl flex items-center justify-center text-[#FBBF24] text-lg md:text-xl">✨</div>
            <div>
              <span className="text-[9px] md:text-[10px] text-stone-400 block font-black uppercase tracking-widest leading-tight">Sweetened</span>
              <span className="text-xl md:text-2xl font-black text-stone-900 leading-none">{summary.totalWithSugar}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Control Center */}
      {isAdmin && (
        <div className="mb-8 space-y-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-dashed border-[#003B73]/20 shadow-xl shadow-blue-900/5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#003B73] rounded-full animate-pulse opacity-10"></div>
                  <div className="relative w-14 h-14 bg-[#003B73] rounded-full flex items-center justify-center text-white text-2xl shadow-lg">🛠️</div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#003B73]">System Administrator Controls</h3>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Global Dashboard & Email Notifications</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleBroadcastReminder}
                  disabled={isBroadcasting}
                  className="px-6 py-3 bg-[#FBBF24] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-md hover:bg-amber-500 transition-all active:scale-95 flex items-center gap-2"
                >
                  {isBroadcasting ? <span className="w-2 h-2 rounded-full bg-white animate-ping"></span> : '📢'}
                  Notify & Email: Time to Order!
                </button>
                <button
                  onClick={handleBroadcastArrived}
                  disabled={isBroadcasting}
                  className="px-6 py-3 bg-[#003B73] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-md hover:bg-[#002B55] transition-all active:scale-95 flex items-center gap-2"
                >
                  {isBroadcasting ? <span className="w-2 h-2 rounded-full bg-white animate-ping"></span> : '☕'}
                  Notify & Email: Coffee Arrived!
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-6 py-3 bg-red-50 text-red-500 border border-red-100 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm"
                >
                  🗑️ Clear Board
                </button>
              </div>
            </div>
            {broadcastSent && <div className="mt-4 text-center text-green-500 font-bold text-[10px] uppercase tracking-widest animate-fade-in">✅ Success: Notifications and Email Blast Sent to All Users!</div>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 items-start">
        {/* Procurement Table Section */}
        <div className="xl:col-span-2 bg-white rounded-2xl md:rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden">
          <div className="px-4 py-4 md:px-8 md:py-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center gap-2">
            <div>
              <h2 className="text-base md:text-lg font-black text-[#003B73]">Procurement List</h2>
              <p className="text-[9px] md:text-[10px] text-stone-400 font-bold uppercase tracking-widest">Guide for Kitchen Inventory</p>
            </div>
            <span className="whitespace-nowrap px-2 py-1 bg-[#003B73] rounded-lg text-[8px] md:text-[10px] font-black text-white shadow-sm uppercase tracking-widest">READY TO SHOP</span>
          </div>
          
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[500px] md:min-w-0">
              <thead className="text-stone-400 text-[9px] md:text-[10px] uppercase font-black tracking-widest bg-stone-50/30">
                <tr className="border-b border-stone-50">
                  <th className="px-4 py-4 md:px-8 md:py-5">Item</th>
                  <th className="px-4 py-4 md:px-8 md:py-5">Preference</th>
                  <th className="px-2 py-4 md:px-8 md:py-5 text-center">11 AM</th>
                  <th className="px-2 py-4 md:px-8 md:py-5 text-center">3 PM</th>
                  <th className="px-4 py-4 md:px-8 md:py-5 text-right bg-blue-50/30">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {summary.table.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#003B73]/5 transition-colors group">
                    <td className="px-4 py-4 md:px-8 md:py-6 font-black text-stone-900 flex items-center gap-2 text-xs md:text-sm">
                       <span className="w-1.5 h-1.5 rounded-full bg-[#003B73]"></span>
                       {row.drink}
                    </td>
                    <td className="px-4 py-4 md:px-8 md:py-6">
                      <span className={`text-[8px] md:text-[9px] px-2 py-0.5 rounded-full font-black tracking-tight whitespace-nowrap ${row.sugar === SugarPreference.WITH_SUGAR ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>
                        {row.sugar.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-2 py-4 md:px-8 md:py-6 text-center text-stone-500 font-bold text-xs md:text-sm">{row.morningCount || '-'}</td>
                    <td className="px-2 py-4 md:px-8 md:py-6 text-center text-stone-500 font-bold text-xs md:text-sm">{row.afternoonCount || '-'}</td>
                    <td className="px-4 py-4 md:px-8 md:py-6 text-right font-black text-[#003B73] bg-blue-50/10 text-base md:text-xl">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Individual Orders Section */}
        <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden flex flex-col max-h-[600px] md:max-h-[800px]">
          <div className="px-4 py-4 md:px-8 md:py-6 border-b border-stone-100 bg-[#003B73] text-white flex justify-between items-center">
            <div>
              <h2 className="text-base md:text-lg font-black tracking-tight">Individual Orders</h2>
              <p className="text-[9px] md:text-[10px] text-blue-100 opacity-80 uppercase tracking-widest font-black">Recent Logs</p>
            </div>
            {isAdmin && <span className="bg-white/20 px-2 py-1 rounded text-[8px] font-bold uppercase">Admin View</span>}
          </div>
          <div className="overflow-y-auto divide-y divide-stone-50 custom-scrollbar">
            {summary.allOrders.map((order, idx) => {
              const isEditing = editingOrderId === order.id;
              return (
                <div key={order.id || idx} className={`p-4 md:p-6 transition-colors ${isEditing ? 'bg-blue-50/30' : 'hover:bg-stone-50'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-black text-stone-900 text-sm md:text-base leading-tight">{order.userName}</p>
                      <p className="text-[8px] md:text-[10px] text-stone-400 font-bold tracking-widest uppercase">{order.slot}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && !isEditing && (
                        <div className="flex gap-1">
                          <button 
                            onClick={() => startEdit(order)}
                            className="p-1.5 text-stone-300 hover:text-[#003B73] transition-colors"
                            title="Edit Order"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1.5 text-stone-300 hover:text-red-500 transition-colors"
                            title="Delete Order"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}
                      {isEditing ? (
                        <div className="flex gap-1">
                          <button onClick={saveEdit} disabled={isUpdating} className="px-3 py-1 bg-[#003B73] text-white text-[8px] font-black uppercase rounded shadow-sm">Save</button>
                          <button onClick={cancelEdit} className="px-3 py-1 bg-stone-200 text-stone-600 text-[8px] font-black uppercase rounded">Cancel</button>
                        </div>
                      ) : (
                        <span className="text-[8px] font-black text-[#003B73] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">LOGGED</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(isEditing ? editBuffer : order.items).map((item, iidx) => (
                      <div key={iidx} className={`bg-white border ${isEditing ? 'border-[#003B73]/30 shadow-md' : 'border-stone-200'} px-2 py-1.5 rounded-lg text-[10px] md:text-xs flex flex-col min-w-[100px] shadow-sm transition-all`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-stone-800 font-black">{item.drink}</span>
                          <span className="text-[#003B73] font-black bg-blue-50 px-1 rounded">x{item.quantity}</span>
                        </div>
                        
                        {isEditing ? (
                          <div className="space-y-1.5 mt-1">
                            <div className="flex gap-1">
                              {Object.values(SugarPreference).map(s => (
                                <button 
                                  key={s} 
                                  onClick={() => updateBufferItem(item.id, { sugar: s })}
                                  className={`flex-1 text-[7px] font-black py-0.5 rounded border transition-all ${item.sugar === s ? 'bg-[#FBBF24] text-white border-[#FBBF24]' : 'bg-stone-50 text-stone-400 border-stone-200'}`}
                                >
                                  {s === SugarPreference.WITH_SUGAR ? 'SUGAR' : 'NO'}
                                </button>
                              ))}
                            </div>
                            <input 
                              type="text" 
                              value={item.note || ''} 
                              onChange={e => updateBufferItem(item.id, { note: e.target.value })}
                              placeholder="Note..."
                              className="w-full text-[8px] px-1 py-0.5 border border-stone-100 rounded bg-stone-50"
                            />
                          </div>
                        ) : (
                          <>
                            <span className="text-[8px] text-stone-400 font-bold uppercase leading-none">{item.sugar}</span>
                            {item.note && (
                              <div className="mt-1.5 text-[8px] text-stone-500 italic border-l-2 border-[#FBBF24] pl-1 leading-tight">
                                {item.note}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;