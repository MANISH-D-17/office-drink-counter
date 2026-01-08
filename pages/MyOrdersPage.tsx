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

  const totalDrinks = orders.reduce((acc, order) => 
    acc + order.items.reduce((sum, item) => sum + (item.quantity || 1), 0), 0
  );

  const totalWithSugar = orders.reduce((acc, order) => 
    acc + order.items.reduce((sum, item) => 
      item.sugar === SugarPreference.WITH_SUGAR ? sum + (item.quantity || 1) : sum, 0
    ), 0
  );

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
      alert("Failed to update order");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    
    setDeletingId(orderId);
    try {
      await api.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      alert("Failed to delete order");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#6F4E37] mb-4"></div>
        <p className="text-stone-400">Loading your history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">My History</h1>
        <p className="text-stone-500">Track and manage your previous orders.</p>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center">
          <div className="text-3xl font-bold text-[#6F4E37]">{totalDrinks}</div>
          <div className="text-sm text-stone-400">Total Drinks</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center">
          <div className="text-3xl font-bold text-[#6F4E37]">{totalWithSugar}</div>
          <div className="text-sm text-stone-400">With Sugar</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-20 text-center border border-dashed border-stone-200">
           <div className="text-stone-200 mb-6 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-stone-500 font-medium">No orders yet.</p>
          <p className="text-stone-400 text-sm mt-1">Start by placing your first order on the menu.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const isEditing = editingId === order.id;
            const isDeleting = deletingId === order.id;
            
            return (
              <div key={order.id} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${isEditing ? 'border-[#6F4E37] ring-1 ring-[#6F4E37]/10 scale-[1.01]' : 'border-stone-100'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-between md:justify-start space-x-3 mb-4">
                      <span className="bg-[#6F4E37]/10 text-[#6F4E37] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {order.slot}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(isEditing ? editBuffer : order.items).map((item, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${isEditing ? 'bg-stone-50' : ''}`}>
                          <div className="flex items-center space-x-4">
                            <span className="font-bold text-stone-800">{item.drink}</span>
                            {isEditing ? (
                              <div className="flex flex-wrap gap-1">
                                {Object.values(SugarPreference).map(s => (
                                  <button
                                    key={s}
                                    onClick={() => updateBufferItem(item.id, { sugar: s })}
                                    className={`text-[9px] px-2 py-0.5 rounded border ${item.sugar === s ? 'bg-[#6F4E37] text-white' : 'bg-white text-stone-400'}`}
                                  >
                                    {s === SugarPreference.WITH_SUGAR ? 'Sugar' : 'No'}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.sugar === SugarPreference.WITH_SUGAR ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>
                                {item.sugar}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-3">
                            {isEditing ? (
                              <div className="flex items-center space-x-2">
                                <button onClick={() => updateBufferItem(item.id, { quantity: Math.max(1, (item.quantity || 1) - 1) })} className="w-6 h-6 rounded bg-white shadow-sm">-</button>
                                <span className="w-4 text-center text-sm font-bold">{item.quantity || 1}</span>
                                <button onClick={() => updateBufferItem(item.id, { quantity: (item.quantity || 1) + 1 })} className="w-6 h-6 rounded bg-white shadow-sm">+</button>
                              </div>
                            ) : (
                              <span className="font-bold text-[#6F4E37]">x{item.quantity || 1}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 md:mt-0 md:ml-6 flex flex-col items-end space-y-3 w-full md:w-auto">
                    {isEditing ? (
                      <div className="flex space-x-2 w-full md:w-auto">
                        <button 
                          onClick={cancelEdit}
                          className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700 bg-stone-100 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={saveEdit}
                          disabled={isUpdating}
                          className="flex-1 md:flex-none px-4 py-2 text-sm font-bold text-white bg-[#6F4E37] rounded-xl shadow-sm"
                        >
                          {isUpdating ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2 w-full md:w-auto">
                        <button 
                          onClick={() => startEdit(order)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm font-bold text-[#6F4E37] bg-stone-50 rounded-xl hover:bg-[#6F4E37] hover:text-white transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(order.id)}
                          disabled={isDeleting}
                          className="p-2 text-stone-300 hover:text-red-500 transition-colors bg-stone-50 hover:bg-red-50 rounded-xl disabled:opacity-50"
                          title="Delete Order"
                        >
                          {isDeleting ? (
                            <div className="h-5 w-5 border-2 border-red-500 border-t-transparent animate-spin rounded-full"></div>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-stone-300">ID: #{order.id}</p>
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