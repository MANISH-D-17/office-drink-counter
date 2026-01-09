import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { OfficeSummary, SugarPreference } from '../types';

const SummaryPage: React.FC = () => {
  const [summary, setSummary] = useState<OfficeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOfficeSummary().then(res => {
      setSummary(res);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003B73] mb-4"></div>
      <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Syncing Performance Data</p>
    </div>
  );

  if (!summary || summary.totalDrinks === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-3xl font-bold text-stone-900 mb-4">Office Summary</h1>
        <div className="bg-white rounded-3xl p-20 border border-stone-100 shadow-sm text-stone-300">
          <div className="text-6xl mb-6">📊</div>
          <p className="font-bold uppercase tracking-widest text-sm">No transactions logged yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-1 bg-[#003B73] rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#003B73]">Corporate Analytics</span>
          </div>
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight">Procurement Dashboard</h1>
          <p className="text-stone-400 text-sm mt-1">
            Real-time office brew consumption stats 
            <span className="text-green-500 ml-3 font-bold flex items-center inline-flex gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> 
              LIVE
            </span>
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4 min-w-[220px] transition-transform hover:scale-[1.02]">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#003B73] text-xl font-black">☕</div>
            <div>
              <span className="text-[10px] text-stone-400 block font-black uppercase tracking-widest">Total Brews</span>
              <span className="text-2xl font-black text-stone-900">{summary.totalDrinks}</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4 min-w-[220px] transition-transform hover:scale-[1.02]">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-[#FBBF24] text-xl">✨</div>
            <div>
              <span className="text-[10px] text-stone-400 block font-black uppercase tracking-widest">Sweetened</span>
              <span className="text-2xl font-black text-stone-900">{summary.totalWithSugar}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Procurement Table */}
        <div className="xl:col-span-2 bg-white rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-[#003B73]">Procurement List</h2>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Shopping Guide for Kitchen Inventory</p>
            </div>
            <div className="flex gap-2">
               <span className="px-3 py-1 bg-[#003B73] rounded-lg text-[10px] font-black text-white shadow-sm uppercase tracking-widest">Ready to Shop</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-stone-400 text-[10px] uppercase font-black tracking-widest bg-stone-50/30">
                <tr className="border-b border-stone-50">
                  <th className="px-8 py-5">Drink Item</th>
                  <th className="px-8 py-5">Preference</th>
                  <th className="px-8 py-5 text-center">11 AM Slot</th>
                  <th className="px-8 py-5 text-center">3 PM Slot</th>
                  <th className="px-8 py-5 text-right bg-blue-50/30">Purchase Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {summary.table.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#003B73]/5 transition-colors group">
                    <td className="px-8 py-6 font-black text-stone-900 flex items-center gap-3">
                       <span className="w-2 h-2 rounded-full bg-[#003B73]"></span>
                       {row.drink}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[9px] px-2.5 py-1 rounded-full font-black tracking-tighter ${row.sugar === SugarPreference.WITH_SUGAR ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>
                        {row.sugar.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center text-stone-500 font-bold">{row.morningCount || '-'}</td>
                    <td className="px-8 py-6 text-center text-stone-500 font-bold">{row.afternoonCount || '-'}</td>
                    <td className="px-8 py-6 text-right font-black text-[#003B73] bg-blue-50/10 text-xl">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-[#003B73] p-4 text-center">
            <p className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Consolidated View: Use this breakdown for procurement efficiency.</p>
          </div>
        </div>

        {/* Individual Orders List */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden flex flex-col max-h-[700px]">
          <div className="px-8 py-6 border-b border-stone-100 bg-[#003B73] text-white">
            <h2 className="text-lg font-black tracking-tight">Individual Orders</h2>
            <p className="text-[10px] text-blue-100 opacity-80 uppercase tracking-widest font-black">Employee Specific Requests</p>
          </div>
          <div className="overflow-y-auto divide-y divide-stone-50 custom-scrollbar">
            {summary.allOrders.map((order, idx) => (
              <div key={order.id || idx} className="p-6 hover:bg-stone-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-black text-stone-900 text-base">{order.userName}</p>
                    <p className="text-[10px] text-stone-400 font-bold tracking-widest uppercase">{order.slot}</p>
                  </div>
                  <span className="text-[9px] font-black text-[#003B73] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">LOGGED</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {order.items.map((item, iidx) => (
                    <div key={iidx} className="bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-xs flex flex-col min-w-[100px] shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-stone-800 font-black">{item.drink}</span>
                        <span className="text-[#003B73] font-black bg-blue-50 px-1.5 rounded">x{item.quantity}</span>
                      </div>
                      <span className="text-[9px] text-stone-400 font-bold uppercase">{item.sugar}</span>
                      {item.note && (
                        <div className="mt-2 text-[9px] text-stone-500 italic border-l-2 border-[#FBBF24] pl-2 leading-tight">
                          {item.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;