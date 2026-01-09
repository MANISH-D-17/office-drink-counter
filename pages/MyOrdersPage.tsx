import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import { Order, SugarPreference, OrderItem } from '../types';

const MyOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<OrderItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = () => {
    if (user) {
      setLoading(true);
      api.getMyOrders(user.id).then(res => {
        setOrders(res);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  };

  const totalDrinks = orders.reduce((acc, order) => acc + order.items.reduce((sum, item) => sum + (item.quantity || 1), 0), 0);
  const totalWithSugar = orders.reduce((acc, order) => acc + order.items.reduce((sum, item) => item.sugar === SugarPreference.WITH_SUGAR ? sum + (item.quantity || 1) : sum, 0), 0);

  const startEdit = (order: Order) => {
    setEditingId(order.id);
    setEditBuffer(JSON.parse(JSON.stringify(order.items)));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditBuffer([]);
  };

  const updateBufferItem = (id: string, updates: Partial<OrderItem>) => {
    setEditBuffer(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setIsUpdating(true);
    try {
      await api.updateOrder(editingId, editBuffer);
      setEditingId(null);
      fetchOrders();
    } catch (err) {
      alert("Failed to update");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!window.confirm("Delete this order?")) return;
    setDeletingId(orderId);
    try {
      await api.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003B73] mb-4"></div>
      <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Loading history...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Order History</h1>
        <p className="text-stone-500">View and manage your previous beverage requests.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center">
          <div className="text-3xl font-bold text-[#003B73]">{totalDrinks}</div>
          <div className="text-xs text-stone-400 uppercase font-bold tracking-widest mt-1">Total Drinks</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center">
          <div className="text-3xl font-bold text-amber-600">{totalWithSugar}</div>
          <div className="text-xs text-stone-400 uppercase font-bold tracking-widest mt-1">Sweetened</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-stone-200 text-stone-300">
           <div className="text-6xl mb-4">📭</div>
           <p className="font-bold uppercase tracking-widest text-sm">No orders recorded yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const isEditing = editingId === order.id;
            return (
              <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:border-[#003B73]/20 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start">
                  <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center space-x-3">
                      <span className="bg-[#003B73]/10 text-[#003B73] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{order.slot}</span>
                      <span className="text-[10px] text-stone-300 font-bold uppercase">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="space-y-3">
                      {(isEditing ? editBuffer : order.items).map((item, idx) => (
                        <div key={idx} className={`p-4 rounded-2xl ${isEditing ? 'bg-stone-50 border border-[#003B73]/10 shadow-inner' : 'bg-stone-50/50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-bold text-stone-800">{item.drink}</span>
                              <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${item.sugar === SugarPreference.WITH_SUGAR ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-400'}`}>{item.sugar}</span>
                            </div>
                            <span className="font-black text-[#003B73]">x{item.quantity}</span>
                          </div>
                          {item.note && !isEditing && <p className="text-[10px] text-stone-400 italic bg-white/50 p-2 rounded-lg">"{item.note}"</p>}
                          {isEditing && (
                            <div className="space-y-2 mt-2">
                              <div className="flex gap-1.5">
                                {Object.values(SugarPreference).map(s => (
                                  <button key={s} onClick={() => updateBufferItem(item.id, { sugar: s })} className={`text-[9px] px-2 py-1.5 rounded-lg border font-bold transition-all flex-1 ${item.sugar === s ? 'bg-[#FBBF24] text-white border-[#FBBF24]' : 'bg-white text-stone-400 border-stone-200'}`}>{s.toUpperCase()}</button>
                                ))}
                              </div>
                              <input 
                                type="text" 
                                value={item.note || ''} 
                                onChange={e => updateBufferItem(item.id, { note: e.target.value })} 
                                placeholder="Edit instructions..." 
                                className="w-full text-[10px] bg-white border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#003B73]"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 md:ml-6 flex md:flex-col items-center md:items-end gap-2 w-full md:w-auto">
                    {isEditing ? (
                      <>
                        <button onClick={saveEdit} disabled={isUpdating} className="flex-1 md:flex-none px-6 py-2 bg-[#003B73] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md">Update</button>
                        <button onClick={cancelEdit} className="flex-1 md:flex-none px-6 py-2 bg-stone-100 text-stone-400 text-[10px] font-black uppercase tracking-widest rounded-xl">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(order)} className="p-3 text-stone-300 hover:text-[#003B73] hover:bg-blue-50 rounded-xl transition-all" title="Edit Order"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                        <button onClick={() => handleDelete(order.id)} disabled={deletingId === order.id} className="p-3 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete Order"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;