import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/portfolio/analysis', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  const formatCurrency = (num) =>
    num?.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) || '₹0';

  return (
    <div className="w-full max-w-5xl mx-auto mt-4 px-2 sm:px-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-white">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center shadow">
          <div className="text-gray-400 mb-2">Total Investment</div>
          <div className="text-3xl font-bold text-white">{formatCurrency(data.total_investment)}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center shadow">
          <div className="text-gray-400 mb-2">Current Value</div>
          <div className="text-3xl font-bold text-white">{formatCurrency(data.total_current_value)}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center shadow">
          <div className="text-gray-400 mb-2">Realized Profit</div>
          <div className="text-3xl font-bold text-green-500">{formatCurrency(data.realized_profit)}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center shadow">
          <div className="text-gray-400 mb-2">Unrealized Profit</div>
          <div className="text-3xl font-bold text-green-500">{formatCurrency(data.unrealized_profit)}</div>
        </div>
      </div>

      {/* Table for desktop */}
      <div className="hidden sm:block w-full overflow-x-auto bg-gray-900 rounded-xl mt-6 sm:mt-8">
        <table className="min-w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-800 text-gray-300">
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Symbol</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right">Qty</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right">Avg Buy Price</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right">Market Price</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right">Unrealized P&amp;L</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right">Value</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right">Day Change</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right">Allocation</th>
            </tr>
          </thead>
          <tbody>
            {data.holdings && data.holdings.length > 0 ? (
              data.holdings.map((h) => {
                const unrealized = h.unrealized_profit;
                const value = h.current_value;
                const allocation = h.allocation_percent ?? 0;
                const dayChange = h.day_change_percent ?? 0;
                const dayChangeColor = dayChange > 0 ? 'text-green-500' : dayChange < 0 ? 'text-red-500' : 'text-gray-300';
                const dayChangeArrow = dayChange > 0 ? '▲' : dayChange < 0 ? '▼' : '';
                return (
                  <tr key={h.symbol} className="border-b border-gray-700">
                    <td className="px-2 sm:px-4 py-2">{h.symbol}</td>
                    <td className="px-2 sm:px-4 py-2 text-right">{h.quantity}</td>
                    <td className="px-2 sm:px-4 py-2 text-right">₹{h.avg_buy_price.toFixed(2)}</td>
                    <td className="px-2 sm:px-4 py-2 text-right">₹{h.market_price?.toFixed(2) ?? '-'}</td>
                    <td className={`px-2 sm:px-4 py-2 text-right ${unrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>₹{unrealized.toFixed(0)}</td>
                    <td className="px-2 sm:px-4 py-2 text-right">₹{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className={`px-2 sm:px-4 py-2 text-right font-semibold ${dayChangeColor}`}> {dayChangeArrow} {dayChange > 0 ? '+' : ''}{dayChange.toFixed(2)}% </td>
                    <td className="px-2 sm:px-4 py-2 text-right">
                      <span className="inline-block bg-gray-800 text-white rounded-full px-2 sm:px-3 py-1 text-xs font-semibold">
                        {allocation.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-4 sm:py-6">No holdings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Cards for mobile */}
      <div className="block sm:hidden space-y-3 mt-6">
        {data.holdings && data.holdings.length > 0 ? (
          data.holdings.map((h) => {
            const unrealized = h.unrealized_profit;
            const value = h.current_value;
            const allocation = h.allocation_percent ?? 0;
            const dayChange = h.day_change_percent ?? 0;
            const dayChangeColor = dayChange > 0 ? 'text-green-500' : dayChange < 0 ? 'text-red-500' : 'text-gray-300';
            const dayChangeArrow = dayChange > 0 ? '▲' : dayChange < 0 ? '▼' : '';
            return (
              <div key={h.symbol} className="bg-gray-900 rounded-xl p-4 flex flex-col gap-2 shadow">
                <div className="flex justify-between items-center"><span className="font-semibold">Symbol:</span> <span>{h.symbol}</span></div>
                <div className="flex justify-between items-center"><span className="font-semibold">Qty:</span> <span>{h.quantity}</span></div>
                <div className="flex justify-between items-center"><span className="font-semibold">Avg Buy Price:</span> <span>₹{h.avg_buy_price.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="font-semibold">Market Price:</span> <span>₹{h.market_price?.toFixed(2) ?? '-'}</span></div>
                <div className="flex justify-between items-center"><span className="font-semibold">Unrealized P&amp;L:</span> <span className={unrealized >= 0 ? 'text-green-400' : 'text-red-400'}>₹{unrealized.toFixed(0)}</span></div>
                <div className="flex justify-between items-center"><span className="font-semibold">Value:</span> <span>₹{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between items-center"><span className="font-semibold">Day Change:</span> <span className={`font-semibold ${dayChangeColor}`}>{dayChangeArrow} {dayChange > 0 ? '+' : ''}{dayChange.toFixed(2)}%</span></div>
                <div className="flex justify-between items-center"><span className="font-semibold">Allocation:</span> <span>{allocation.toFixed(1)}%</span></div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-400 py-6">No holdings found.</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 