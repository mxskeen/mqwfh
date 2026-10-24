import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { MonthlyResponse } from '../types';
import { KpiCards } from './KpiCards';

interface MonthlyAnalysisProps {
  data: MonthlyResponse;
  onSelectDate: (date: string) => void;
}

export const MonthlyAnalysis: React.FC<MonthlyAnalysisProps> = ({
  data,
  onSelectDate,
}) => {
  const chartData = data.daily_breakdown.map((d) => ({
    date: d.date.substring(5), // "01-15"
    fullDate: d.date,
    mae_mw: d.metrics.mae,
    bias_mw: d.metrics.mean_bias,
    peak_actual_mw: d.peak_actual_mw,
    peak_forecast_mw: d.peak_forecast_mw,
  }));

  return (
    <div className="space-y-6">
      {/* Monthly Aggregate KPIs */}
      <div className="bg-white p-5 rounded border border-[#eeebe2] space-y-4">
        <div>
          <h3 className="font-serif text-lg font-medium text-[#1c1917]">
            January 2026 Macro Forecast Performance
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Aggregated across all 31 days and 1,488 half-hour settlement periods at D-1 Day-Ahead Cutoff.
          </p>
        </div>

        <KpiCards metrics={data.aggregate_metrics} />
      </div>

      {/* Daily MAE Trend Across the Month */}
      <div className="bg-white p-5 rounded border border-[#eeebe2] space-y-3">
        <div className="flex items-baseline justify-between border-b border-[#f2efe8] pb-3">
          <div>
            <h4 className="font-serif text-base font-medium text-[#1c1917]">
              Daily Forecast Error Trend (January 1 to 31, 2026)
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Click any point on the chart or table to drill down into that specific delivery day.
            </p>
          </div>
          <span className="text-xs font-mono text-stone-500">Values in MW</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1ede6" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#78716c', fontFamily: 'monospace' }}
                interval={2}
                tickLine={false}
                axisLine={{ stroke: '#e5e1d7' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#78716c', fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e1d7' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-[#eeebe2] p-2.5 rounded text-xs space-y-1">
                      <div className="font-mono font-medium text-stone-900">{d.fullDate}</div>
                      <div className="font-mono text-[#1b3a2f]">MAE: {d.mae_mw.toLocaleString()} MW</div>
                      <div className="font-mono text-amber-700">Mean Bias: +{d.bias_mw.toLocaleString()} MW</div>
                      <div className="text-[10px] text-stone-400 mt-1">Click to inspect delivery day</div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="mae_mw"
                name="Daily MAE"
                stroke="#1b3a2f"
                strokeWidth={2}
                dot={{ r: 3, fill: '#1b3a2f' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="bias_mw"
                name="Mean Bias"
                stroke="#d97706"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white rounded border border-[#eeebe2] overflow-hidden">
        <div className="p-4 border-b border-[#f2efe8] flex items-center justify-between">
          <h4 className="font-serif text-sm font-medium text-stone-900">
            Daily Performance Ledger (31 Delivery Days)
          </h4>
          <span className="text-xs font-mono text-stone-500">Sorted chronologically</span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fbfaf8] text-stone-500 font-mono text-[11px] uppercase tracking-wider border-b border-[#eeebe2] sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">MAE (MW)</th>
                <th className="py-2.5 px-3 text-right">RMSE (MW)</th>
                <th className="py-2.5 px-3 text-right">Mean Bias (MW)</th>
                <th className="py-2.5 px-3 text-right">WAPE (%)</th>
                <th className="py-2.5 px-3">Direction</th>
                <th className="py-2.5 px-3 text-right">Peak Actual (MW)</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2efe8] font-mono">
              {data.daily_breakdown.map((row) => (
                <tr key={row.date} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-2 px-3 font-medium text-stone-800">{row.date}</td>
                  <td className="py-2 px-3 text-right text-stone-800">{row.metrics.mae.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-stone-600">{row.metrics.rmse.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-semibold text-amber-700">
                    +{row.metrics.mean_bias.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right text-stone-700">{row.metrics.wape.toFixed(1)}%</td>
                  <td className="py-2 px-3">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-[#f2efe8] text-stone-700 border border-[#e5e1d7]">
                      {row.metrics.bias_direction}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-[#1b3a2f] font-medium">
                    {row.peak_actual_mw.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => onSelectDate(row.date)}
                      className="text-[#1b3a2f] hover:underline cursor-pointer font-sans text-xs"
                    >
                      View Day
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
