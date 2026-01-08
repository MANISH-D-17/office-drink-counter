import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { OfficeSummary, TimeSlot, SugarPreference } from '../types';

const SummaryPage: React.FC = () => {
  const [summary, setSummary] = useState<OfficeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOfficeSummary().then(res => {
      setSummary(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#6F4E37] mb-4"></div>
        <p className="text-stone-400">Aggregating office reports...</p>
      </div>
    );
  }

  if (!summary || summary.totalDrinks === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-3xl font-bold text-stone-900 mb-4">Office Summary</h1>
        <div className="bg-white rounded-2xl p-16 border border-stone-100 shadow-sm">
          <p className="text-stone-400">No data available for today yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Office Brew Report</h1>
          <p className="text-stone-500">Real-time aggregated stats for all colleagues.</p>
        </div>
        <div className="flex space-x-4">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-stone-100">
            <span className="text-xs text-stone-400 block uppercase font-bold tracking-widest">Total Active</span>
            <span className="text-xl font-bold text-[#6F4E37]">{summary.totalDrinks} <span className="text-xs font-normal text-stone-400">Drinks</span></span>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-stone-100">
            <span className="text-xs text-stone-400 block uppercase font-bold tracking-widest">Sugar Preference</span>
            <span className="text-xl font-bold text-amber-600">{summary.totalWithSugar} <span className="text-xs font-normal text-stone-400">Sweetened</span></span>
          </div>
        </div>
      </header>

      {/* Slot Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {[
          { title: 'Morning - 11:00 AM', stats: summary.morningSummary, color: 'bg-orange-50 text-orange-700' },
          { title: 'Afternoon - 03:00 PM', stats: summary.afternoonSummary, color: 'bg-indigo-50 text-indigo-700' }
        ].map((slot, idx) => (
          <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 relative overflow-hidden">
            <h3 className="text-lg font-bold text-stone-800 mb-6 flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-orange-400' : 'bg-indigo-400'}`}></span>
              <span>{slot.title}</span>
            </h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-sm text-stone-400 mb-1">Total Ordered</div>
                <div className="text-3xl font-bold text-stone-900">{slot.stats.total}</div>
              </div>
              <div>
                <div className="text-sm text-stone-400 mb-1">With Sugar</div>
                <div className="text-3xl font-bold text-stone-900">{slot.stats.withSugar}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Aggregation Table */}
      <div className="bg-white rounded-3xl shadow-lg border border-stone-100 overflow-hidden mb-12">
        <div className="p-8 border-b border-stone-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-stone-800">Detailed Aggregation</h2>
          <span className="text-xs text-stone-400 italic">Consolidated View</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-stone-50 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-8 py-4">Drink Type</th>
                <th className="px-8 py-4">Sugar Pref</th>
                <th className="px-8 py-4 text-center">{TimeSlot.MORNING}</th>
                <th className="px-8 py-4 text-center">{TimeSlot.AFTERNOON}</th>
                <th className="px-8 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {summary.table.map((row, idx) => (
                <tr key={idx} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-8 py-5 font-bold text-stone-800">{row.drink}</td>
                  <td className="px-8 py-5">
                    <span className={`text-[10px] px-2 py-1 rounded-full ${row.sugar === SugarPreference.WITH_SUGAR ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>
                      {row.sugar}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center text-stone-600 font-medium">{row.morningCount || '-'}</td>
                  <td className="px-8 py-5 text-center text-stone-600 font-medium">{row.afternoonCount || '-'}</td>
                  <td className="px-8 py-5 text-right font-black text-[#6F4E37]">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual User Orders */}
      <div className="bg-white rounded-3xl shadow-lg border border-stone-100 overflow-hidden">
        <div className="p-8 border-b border-stone-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-stone-800">Who's Drinking Today?</h2>
          <span className="bg-stone-100 text-stone-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
            {summary.allOrders.length} {summary.allOrders.length === 1 ? 'Order' : 'Orders'}
          </span>
        </div>
        <div className="divide-y divide-stone-50">
          {summary.allOrders.length === 0 ? (
            <div className="p-12 text-center text-stone-400">No individual records found.</div>
          ) : (
            summary.allOrders.map((order, idx) => (
              <div key={order.id || idx} className="p-6 md:px-8 hover:bg-stone-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-bold text-stone-900 text-lg">{order.userName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${order.slot === TimeSlot.MORNING ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {order.slot}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item, iidx) => (
                      <div key={iidx} className="bg-stone-100 px-3 py-1.5 rounded-xl text-xs flex items-center space-x-2">
                        <span className="font-black text-[#6F4E37]">{item.quantity}x</span>
                        <span className="text-stone-700 font-medium">{item.drink}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${item.sugar === SugarPreference.WITH_SUGAR ? 'bg-amber-100 text-amber-600' : 'bg-stone-200 text-stone-500'}`}>
                          {item.sugar === SugarPreference.WITH_SUGAR ? 'Sugar' : 'No Sugar'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                   <span className="text-[10px] text-stone-300 font-medium">Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;