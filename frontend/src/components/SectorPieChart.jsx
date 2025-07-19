import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = [
  '#38bdf8', // blue-400
  '#f87171', // red-400
  '#facc15', // yellow-400
  '#34d399', // green-400
  '#a78bfa', // purple-400
  '#fbbf24', // orange-400
  '#60a5fa', // blue-400
  '#f472b6', // pink-400
  '#818cf8', // indigo-400
];

function formatData(dataObj) {
  if (!dataObj) return [];
  return Object.entries(dataObj).map(([sector, val], idx) => ({
    name: sector,
    value: val.value || val.percentage || 0,
    percentage: val.percentage || 0,
    color: COLORS[idx % COLORS.length],
  }));
}

const renderLegend = (props) => {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, idx) => (
        <li key={`item-${idx}`} className="flex items-center gap-2 text-sm">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: entry.color }}></span>
          <span className="text-gray-200">{entry.value.name}</span>
          <span className="text-gray-400">({entry.value.percentage?.toFixed(1)}%)</span>
        </li>
      ))}
    </ul>
  );
};

const SectorPieChart = ({ data }) => {
  const chartData = formatData(data);
  return (
    <div className="w-full flex flex-col items-center">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            innerRadius={40}
            label={({ name, percentage }) => `${name} (${percentage?.toFixed(1)}%)`}
          >
            {chartData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name, props) => [`${value}`, name]} />
        </PieChart>
      </ResponsiveContainer>
      <Legend content={renderLegend} payload={chartData.map((entry) => ({ value: entry, color: entry.color }))} />
    </div>
  );
};

export default SectorPieChart; 