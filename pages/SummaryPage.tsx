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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003B73] mb-4"></div>
      <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Syncing Global Data</p>
    </div>
  );

  if (!summary || summary.totalDrinks === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-3xl font-bold text-stone-900 mb-4">Office Summary</h1>
        <div className="bg-white rounded-3xl p-20 border border-stone-100 shadow-sm text-stone-300">
          <div className="text-6xl mb-6">📊</div>
          <p className="font-bold uppercase tracking-widest text-sm">Waiting for today's first brew log</p>
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
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#003B73]">Global Report</span>
          </div>
          <h1 className="text-4xl font-bold text-stone-900">CEO Dashboard</h1>
          <p className="text-stone-400 text-sm mt-1">Live Office Brew Performance Overview <span className="text-green-500 ml-2 font-bold flex items-center inline-flex gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Live Data</span></p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4 min-w-[200px]">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#003B73] font-bold">∑</div>
            <div>
              <span className="text-[10px] text-stone-400 block font-black uppercase tracking-widest">Total Units</span>
              <span className="text-2xl font-black text-stone-900">{summary.totalDrinks}</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4 min-w-[200px]">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-[#FBBF24] font-bold">✨</div>
            <div>
              <span className="text-[10px] text-stone-400 block font-black uppercase tracking-widest">Sweetened</span>
              <span className="text-2xl font-black text-stone-900">{summary.totalWithSugar}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <MetricCard title="Morning Total" value={summary.morningSummary.total} subtitle="11:00 AM Slot" color="border-l-[#003B73]" />
        <MetricCard title="Morning Sugar" value={summary.morningSummary.withSugar} subtitle="Custom Preference" color="border-l-[#FBBF24]" />
        <MetricCard title="Afternoon Total" value={summary.afternoonSummary.total} subtitle="03:00 PM Slot" color="border-l-[#003B73]" />
        <MetricCard title="Afternoon Sugar" value={summary.afternoonSummary.withSugar} subtitle="Custom Preference" color="border-l-[#FBBF24]" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Aggregation Table */}
        <div className="xl:col-span-2 bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-stone-50 bg-stone-50/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-stone-800">Financial Trends (Drink Breakdown)</h2>
            <div className="flex gap-2">
               <span className="px-3 py-1 bg-white border border-stone-200 rounded-lg text-[10px] font-bold text-stone-400">DAILY</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-stone-400 text-[10px] uppercase font-black tracking-widest">
                <tr className="border-b border-stone-50">
                  <th className="px-8 py-4">Category</th>
                  <th className="px-8 py-4">Preference</th>
                  <th className="px-8 py-4 text-center">Early</th>
                  <th className="px-8 py-4 text-center">Late</th>
                  <th className="px-8 py-4 text-right">Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {summary.table.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#003B73]/5 transition-colors group">
                    <td className="px-8 py-6 font-bold text-stone-900">{row.drink}</td>
                    <td className="px-8 py-6">
                      <span className={`text-[9px] px-2 py-1 rounded-full font-black ${row.sugar === SugarPreference.WITH_SUGAR ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-400'}`}>
                        {row.sugar.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center text-stone-500 font-bold">{row.morningCount || '-'}</td>
                    <td className="px-8 py-6 text-center text-stone-500 font-bold">{row.afternoonCount || '-'}</td>
                    <td className="px-8 py-6 text-right font-black text-[#003B73]">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Individual Feed */}
        <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden flex flex-col max-h-[700px]">
          <div className="px-8 py-6 border-b border-stone-50 bg-[#003B73] text-white">
            <h2 className="text-lg font-bold">Individual Logins</h2>
            <p className="text-[10px] text-blue-100 opacity-80 uppercase tracking-widest font-bold">Recent Transactions</p>
          </div>
          <div className="overflow-y-auto divide-y divide-stone-50">
            {summary.allOrders.map((order, idx) => (
              <div key={order.id || idx} className="p-6 hover:bg-stone-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-black text-stone-900 text-sm">{order.userName}</p>
                    <p className="text-[10px] text-stone-400 font-bold">{order.slot}</p>
                  </div>
                  <span className="text-[10px] font-black text-[#003B73] bg-blue-50 px-2 py-0.5 rounded uppercase">ORDERED</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {order.items.map((item, iidx) => (
                    <div key={iidx} className="bg-stone-100/50 border border-stone-100 px-2 py-1 rounded-lg text-[10px] flex items-center gap-2">
                      <span className="font-black text-[#003B73]">{item.quantity}x</span>
                      <span className="text-stone-600 font-bold">{item.drink}</span>
                    </div>
                  ))}
                </div>
                {order.items.some(i => i.note) && (
                   <div className="mt-2 text-[9px] text-stone-400 italic border-l-2 border-amber-400 pl-2">
                     "{order.items.find(i => i.note)?.note}"
                   </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle, color }: any) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border border-stone-100 border-l-4 ${color}`}>
    <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest block mb-1">{title}</span>
    <div className="text-2xl font-black text-stone-900">{value}</div>
    <span className="text-[10px] text-stone-300 font-bold uppercase">{subtitle}</span>
  </div>
);

export default SummaryPage;