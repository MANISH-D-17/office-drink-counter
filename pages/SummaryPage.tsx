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
          <div className="bg-[#003B73] p-3 text-center">
            <p className="text-white text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em]">Consolidated View for procurement efficiency.</p>
          </div>
        </div>

        {/* Individual Orders Section */}
        <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden flex flex-col max-h-[500px] md:max-h-[700px]">
          <div className="px-4 py-4 md:px-8 md:py-6 border-b border-stone-100 bg-[#003B73] text-white">
            <h2 className="text-base md:text-lg font-black tracking-tight">Individual Orders</h2>
            <p className="text-[9px] md:text-[10px] text-blue-100 opacity-80 uppercase tracking-widest font-black">Recent Logs</p>
          </div>
          <div className="overflow-y-auto divide-y divide-stone-50 custom-scrollbar">
            {summary.allOrders.map((order, idx) => (
              <div key={order.id || idx} className="p-4 md:p-6 hover:bg-stone-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-black text-stone-900 text-sm md:text-base leading-tight">{order.userName}</p>
                    <p className="text-[8px] md:text-[10px] text-stone-400 font-bold tracking-widest uppercase">{order.slot}</p>
                  </div>
                  <span className="text-[8px] font-black text-[#003B73] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">LOGGED</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {order.items.map((item, iidx) => (
                    <div key={iidx} className="bg-stone-50 border border-stone-200 px-2 py-1.5 rounded-lg text-[10px] md:text-xs flex flex-col min-w-[90px] shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-stone-800 font-black">{item.drink}</span>
                        <span className="text-[#003B73] font-black bg-blue-50 px-1 rounded">x{item.quantity}</span>
                      </div>
                      <span className="text-[8px] text-stone-400 font-bold uppercase leading-none">{item.sugar}</span>
                      {item.note && (
                        <div className="mt-1.5 text-[8px] text-stone-500 italic border-l-2 border-[#FBBF24] pl-1 leading-tight">
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