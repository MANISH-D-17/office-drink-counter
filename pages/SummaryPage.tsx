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

  if (loading) return <div className="text-center py-20 text-stone-400">Compiling office report...</div>;

  if (!summary || summary.totalDrinks === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-3xl font-bold text-stone-900 mb-4">Office Summary</h1>
        <div className="bg-white rounded-2xl p-16 border border-stone-100 shadow-sm text-stone-400">No active orders found for today.</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Office Brew Report</h1>
          <p className="text-stone-500">Live aggregated statistics and individual records.</p>
        </div>
        <div className="flex space-x-4">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-stone-100">
            <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-widest">Total</span>
            <span className="text-xl font-bold text-[#6F4E37]">{summary.totalDrinks}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-stone-100">
            <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-widest">Sweet</span>
            <span className="text-xl font-bold text-amber-600">{summary.totalWithSugar}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {[
          { title: 'Morning - 11:00 AM', stats: summary.morningSummary, color: 'bg-orange-50 text-orange-700' },
          { title: 'Afternoon - 03:00 PM', stats: summary.afternoonSummary, color: 'bg-indigo-50 text-indigo-700' }
        ].map((slot, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4">{slot.title}</h3>
            <div className="flex justify-between items-center">
              <div>
                <span className="block text-3xl font-bold text-stone-900">{slot.stats.total}</span>
                <span className="text-[10px] text-stone-400 uppercase font-bold">Total</span>
              </div>
              <div className="text-right">
                <span className="block text-3xl font-bold text-stone-900">{slot.stats.withSugar}</span>
                <span className="text-[10px] text-stone-400 uppercase font-bold">Sugar</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-stone-100 overflow-hidden mb-12">
        <div className="p-8 border-b border-stone-50">
          <h2 className="text-xl font-bold text-stone-800">Aggregation Table</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-stone-50 text-stone-400 text-[10px] uppercase font-bold">
              <tr>
                <th className="px-8 py-4">Drink</th>
                <th className="px-8 py-4">Sugar</th>
                <th className="px-8 py-4 text-center">11 AM</th>
                <th className="px-8 py-4 text-center">3 PM</th>
                <th className="px-8 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {summary.table.map((row, idx) => (
                <tr key={idx} className="hover:bg-stone-50 transition-colors">
                  <td className="px-8 py-5 font-bold text-stone-800">{row.drink}</td>
                  <td className="px-8 py-5"><span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100">{row.sugar}</span></td>
                  <td className="px-8 py-5 text-center text-stone-600">{row.morningCount || '-'}</td>
                  <td className="px-8 py-5 text-center text-stone-600">{row.afternoonCount || '-'}</td>
                  <td className="px-8 py-5 text-right font-black text-[#6F4E37]">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-stone-100 overflow-hidden">
        <div className="p-8 border-b border-stone-50">
          <h2 className="text-xl font-bold text-stone-800">Individual Orders</h2>
        </div>
        <div className="divide-y divide-stone-50">
          {summary.allOrders.map((order, idx) => (
            <div key={order.id || idx} className="p-6 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="font-bold text-stone-900 text-lg">{order.userName}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${order.slot === TimeSlot.MORNING ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>{order.slot}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {order.items.map((item, iidx) => (
                    <div key={iidx} className="bg-stone-50 border border-stone-100 px-3 py-1.5 rounded-xl text-xs space-y-1 min-w-[120px]">
                      <div className="flex justify-between font-medium">
                        <span className="text-stone-800">{item.drink}</span>
                        <span className="text-[#6F4E37] font-bold">x{item.quantity}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-stone-400">
                        <span>{item.sugar}</span>
                        {item.note && <span className="italic truncate max-w-[80px]">"{item.note}"</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right text-[10px] text-stone-300">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;