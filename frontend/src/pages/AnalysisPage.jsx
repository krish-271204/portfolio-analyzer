import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SectorPieChart from '../components/SectorPieChart';
import MarketCapPieChart from '../components/MarketCapPieChart';
import ReactMarkdown from "react-markdown";
import { FaBrain, FaLightbulb, FaArrowRight } from "react-icons/fa";

// Helper function to split AI summary into sections
function splitAISummary(summary) {
  const sections = { insights: "", suggestions: "" };
  const insightsMatch = summary.match(/Behavioral Insights[:：]*([\s\S]*?)(Personalized Suggestions[:：]|$)/i);
  const suggestionsMatch = summary.match(/Personalized Suggestions[:：]*([\s\S]*)/i);
  if (insightsMatch) sections.insights = insightsMatch[1].trim();
  if (suggestionsMatch) sections.suggestions = suggestionsMatch[1].trim();
  return sections;
}

// Helper to turn markdown or plain text into array of pointers (ignoring empty and '**')
function extractPointers(text) {
  return text
    .split(/\n|\r|\*/)
    .map(line => line.trim())
    .filter(line => line && line !== '**');
}

const AnalysisPage = () => {
  const [compositionData, setCompositionData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [behaviorData, setBehaviorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    fetchAllAnalysisData();
  }, []);

 useEffect(() => {
    const fetchAISummary = async () => {
      setAiLoading(true);
      setAiError("");
      try {
        const token = localStorage.getItem("token");
        const response = await axios.post("/api/ai/summary", {}, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        setAiSummary(response.data.summary);
      } catch (err) {
        console.error("AI Summary Error:", err);
        setAiError("Could not load AI insights.");
      } finally {
        setAiLoading(false);
      }
    };
    fetchAISummary();
  }, []);

  const fetchAllAnalysisData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [compositionRes, performanceRes, behaviorRes] = await Promise.all([
        axios.get('/portfolio/composition', { headers }),
        axios.get('/portfolio/performance', { headers }),
        axios.get('/portfolio/behavior', { headers })
      ]);
      setCompositionData(compositionRes.data);
      setPerformanceData(performanceRes.data);
      setBehaviorData(behaviorRes.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        alert('Your session has expired. Please log in again.');
        navigate('/login');
        return;
      }
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch analysis data';
      setError(`Error: ${errorMessage}`);
      console.error('Error fetching analysis data:', err);
      console.error('Error response:', err.response);
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

  const { insights, suggestions } = splitAISummary(aiSummary);
  const insightPointers = extractPointers(insights);
  const suggestionPointers = extractPointers(suggestions);

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 py-6 space-y-10">
      {/* Section: Portfolio Composition */}
      <div>
        <h2 className="text-center text-2xl sm:text-3xl font-bold mb-2 relative">
          Portfolio Composition
          <span className="block mx-auto mt-2 w-16 h-1 bg-blue-500 rounded"></span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-800 rounded-xl p-6 shadow flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-3 text-white">Sector Allocation</h3>
            {compositionData && compositionData.sector_allocation ? (
              <SectorPieChart data={compositionData.sector_allocation} />
            ) : (
              <div className="w-full flex flex-col items-center justify-center min-h-[220px] text-gray-400">No data</div>
            )}
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-3 text-white">Market Cap Breakdown</h3>
            {compositionData && compositionData.market_cap_allocation ? (
              <MarketCapPieChart data={compositionData.market_cap_allocation} />
            ) : (
              <div className="w-full flex flex-col items-center justify-center min-h-[220px] text-gray-400">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Section: Top Gainers & Losers */}
      <div>
        <h2 className="text-center text-2xl sm:text-3xl font-bold mb-2 relative">
          Top Gainers & Losers
          <span className="block mx-auto mt-2 w-16 h-1 bg-blue-500 rounded"></span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-800 rounded-xl p-6 shadow">
            <h3 className="text-green-400 text-lg font-semibold mb-4">Top Gainers</h3>
            <div className="space-y-4">
              {performanceData && Array.isArray(performanceData.top_gainers) && performanceData.top_gainers.length > 0 ? (
                performanceData.top_gainers.map((g, idx) => (
                  <div key={g.symbol || idx} className="bg-gray-900 rounded-lg p-4 flex flex-col">
                    <span className="font-bold text-white">{g.symbol || '-'}</span>
                    <span className="text-xs text-gray-400">Investment: ₹{typeof g.investment === 'number' && !isNaN(g.investment) ? g.investment.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}</span>
                    <span className="text-green-400 font-bold mt-1">{typeof g.return_percentage === 'number' && !isNaN(g.return_percentage) ? (g.return_percentage >= 0 ? '+' : '') + g.return_percentage.toFixed(1) + '%' : '-'}</span>
                    <span className="text-xs text-gray-300">Current Price: ₹{typeof g.current_price === 'number' && !isNaN(g.current_price) ? g.current_price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-400">No gainers found.</div>
              )}
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow">
            <h3 className="text-red-400 text-lg font-semibold mb-4">Top Losers</h3>
            <div className="space-y-4">
              {performanceData && Array.isArray(performanceData.top_losers) && performanceData.top_losers.length > 0 ? (
                performanceData.top_losers.map((l, idx) => (
                  <div key={l.symbol || idx} className="bg-gray-900 rounded-lg p-4 flex flex-col">
                    <span className="font-bold text-white">{l.symbol || '-'}</span>
                    <span className="text-xs text-gray-400">Investment: ₹{typeof l.investment === 'number' && !isNaN(l.investment) ? l.investment.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}</span>
                    <span className="text-red-400 font-bold mt-1">{typeof l.return_percentage === 'number' && !isNaN(l.return_percentage) ? (l.return_percentage >= 0 ? '+' : '') + l.return_percentage.toFixed(1) + '%' : '-'}</span>
                    <span className="text-xs text-gray-300">Current Price: ₹{typeof l.current_price === 'number' && !isNaN(l.current_price) ? l.current_price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-400">No losers found.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section: Transaction Behavior */}
      <div>
        <h2 className="text-center text-2xl sm:text-3xl font-bold mb-2 relative">
          Transaction Behavior
          <span className="block mx-auto mt-2 w-16 h-1 bg-blue-500 rounded"></span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-gray-800 rounded-xl p-6 shadow flex flex-col items-center">
            <div className="text-blue-400 text-3xl mb-2"><i className="fas fa-clock"></i></div>
            <div className="text-gray-400 text-sm mb-1">Avg. Holding Time</div>
            <div className="text-xl font-bold text-white">{behaviorData && typeof behaviorData.average_holding_time === 'number' && !isNaN(behaviorData.average_holding_time) ? `${behaviorData.average_holding_time} days` : '-'}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow flex flex-col items-center">
            <div className="text-blue-400 text-3xl mb-2"><i className="fas fa-trophy"></i></div>
            <div className="text-gray-400 text-sm mb-1">Win Rate</div>
            <div className="text-xl font-bold text-green-400">{behaviorData && typeof behaviorData.win_rate === 'number' && !isNaN(behaviorData.win_rate) ? `${behaviorData.win_rate}%` : '-'}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow flex flex-col items-center">
            <div className="text-blue-400 text-3xl mb-2"><i className="fas fa-list"></i></div>
            <div className="text-gray-400 text-sm mb-1">Total Trades</div>
            <div className="text-xl font-bold text-white">{behaviorData && typeof behaviorData.total_trades === 'number' && !isNaN(behaviorData.total_trades) ? behaviorData.total_trades : '-'}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow flex flex-col items-center">
            <div className="text-blue-400 text-3xl mb-2"><i className="fas fa-chart-line"></i></div>
            <div className="text-gray-400 text-sm mb-1">Trading Frequency</div>
            <div className="text-xl font-bold text-white">{behaviorData && typeof behaviorData.trading_frequency === 'number' && !isNaN(behaviorData.trading_frequency) ? `${behaviorData.trading_frequency}/month` : '-'}</div>
          </div>
        </div>
      </div>

      {/* Section: AI Insights & Recommendations */}
      <div>
        <h2 className="text-center text-2xl sm:text-3xl font-bold mb-2 relative">
          AI Insights & Recommendations
          <span className="block mx-auto mt-2 w-16 h-1 bg-blue-500 rounded"></span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 w-full">
          {/* Behavioral Insights Card */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg flex flex-col min-h-[120px] border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <FaBrain className="text-blue-400 text-2xl" />
              <span className="font-bold text-lg text-white">Behavioral Insights</span>
            </div>
            <ul className="space-y-2 mt-2">
              {insightPointers.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-300 text-base">
                  <FaArrowRight className="text-blue-400 mt-1 flex-shrink-0" size={14} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Personalized Suggestions Card */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg flex flex-col min-h-[120px] border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <FaLightbulb className="text-green-400 text-2xl" />
              <span className="font-bold text-lg text-white">Personalized Suggestions</span>
            </div>
            <ul className="space-y-2 mt-2">
              {suggestionPointers.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-300 text-base">
                  <FaArrowRight className="text-green-400 mt-1 flex-shrink-0" size={14} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage; 
