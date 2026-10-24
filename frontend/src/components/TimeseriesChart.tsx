import { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from 'recharts';
import { DailySettlementItem } from '../types';

interface TimeseriesChartProps {
  data: DailySettlementItem[];
  targetDate: string;
  cutoffTime: string;
}

export const TimeseriesChart = ({
  data,
  targetDate,
  cutoffTime,
}: TimeseriesChartProps) => {
  const [showActual, setShowActual] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [showErrorSpread, setShowErrorSpread] = useState(true);

  const chartData = data.map((d) => ({
    sp: `SP${d.settlement_period.toString().padStart(2, '0')}`,
    spNumber: d.settlement_period,
    time: d.start_time.substring(11, 16),
    actual_mw: d.actual_mw,
    forecasted_mw: d.forecasted_mw,
    error_mw: d.forecast_error,
    publish_time: d.publish_time,
  }));

  return (
    <div className="bg-white p-6 rounded border border-[#eeebe2] space-y-4">
      {/* Header with Title and Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f2efe8] pb-4">
        <div>
          <h3 className="font-serif text-lg font-medium text-[#1c1917]">
            Day-Ahead Wind Power Dispatch (48 Settlement Periods)
          </h3>
          <p className="text-xs text-stone-500 mt-1 font-mono">
            Delivery Date: <span className="text-stone-900 font-semibold">{targetDate}</span> • Gate Cutoff: <span className="text-stone-900 font-semibold">{cutoffTime} UTC</span> (D-1)
          </p>
        </div>

        {/* Legend & Display Toggles */}
        <div className="flex items-center gap-6 text-xs font-mono">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showActual}
              onChange={(e) => setShowActual(e.target.checked)}
              className="accent-[#1b3a2f] cursor-pointer"
            />
            <span className="inline-block w-3 h-1 bg-[#1b3a2f]"></span>
            <span className="text-stone-800">Actual Wind</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showForecast}
              onChange={(e) => setShowForecast(e.target.checked)}
              className="accent-[#64748b] cursor-pointer"
            />
            <span className="inline-block w-3 h-1 border-t-2 border-dashed border-[#64748b]"></span>
            <span className="text-stone-700">Day-Ahead Forecast</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showErrorSpread}
              onChange={(e) => setShowErrorSpread(e.target.checked)}
              className="accent-[#d97706] cursor-pointer"
            />
            <span className="inline-block w-2.5 h-2.5 bg-amber-500/40"></span>
            <span className="text-stone-700">Error Spread</span>
          </label>
        </div>
      </div>

      {/* Chart Canvas with breathing room */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 15, left: -5, bottom: 15 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1ede6" vertical={false} />

            {/* Subtle UK Evening Peak Highlight Area (16:00 to 19:00 UTC) */}
            <ReferenceArea
              x1="16:00"
              x2="19:00"
              fill="#fef3c7"
              fillOpacity={0.4}
              yAxisId="mw"
            />

            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: '#78716c', fontFamily: 'monospace' }}
              interval={3}
              tickLine={false}
              axisLine={{ stroke: '#e5e1d7' }}
            />
            <YAxis
              yAxisId="mw"
              tick={{ fontSize: 11, fill: '#78716c', fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e1d7' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MW`}
            />
            <YAxis
              yAxisId="err"
              orientation="right"
              tick={{ fontSize: 10, fill: '#a8a29e', fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-[#eeebe2] shadow-sm p-3.5 rounded text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between items-center border-b border-[#f2efe8] pb-1.5 gap-4">
                      <span className="font-bold text-stone-900">
                        {d.sp} ({d.time} UTC)
                      </span>
                      {33 <= d.spNumber && d.spNumber <= 38 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
                          UK Evening Peak
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-stone-500">Actual Wind:</span>
                      <span className="font-semibold text-[#1b3a2f]">{d.actual_mw.toLocaleString()} MW</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-stone-500">Day-Ahead Forecast:</span>
                      <span className="font-medium text-slate-700">{d.forecasted_mw.toLocaleString()} MW</span>
                    </div>
                    <div className="flex justify-between gap-6 border-t border-[#f2efe8] pt-1">
                      <span className="text-stone-500">Forecast Deviation:</span>
                      <span
                        className={`font-bold ${
                          d.error_mw > 0 ? 'text-amber-700' : 'text-blue-700'
                        }`}
                      >
                        {d.error_mw > 0 ? `+${d.error_mw.toLocaleString()}` : d.error_mw.toLocaleString()} MW
                      </span>
                    </div>
                  </div>
                );
              }}
            />

            {showErrorSpread && (
              <Bar
                yAxisId="err"
                dataKey="error_mw"
                name="Error Spread"
                fill="#d97706"
                fillOpacity={0.25}
                barSize={6}
              />
            )}
            {showActual && (
              <Line
                yAxisId="mw"
                type="monotone"
                dataKey="actual_mw"
                name="Actual Wind"
                stroke="#1b3a2f"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#1b3a2f' }}
              />
            )}
            {showForecast && (
              <Line
                yAxisId="mw"
                type="monotone"
                dataKey="forecasted_mw"
                name="Forecast"
                stroke="#64748b"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4, fill: '#64748b' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
