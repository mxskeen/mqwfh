import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { SettlementPeriodProfileItem, TimeOfDayAnalysis } from '../types';

interface SettlementPeriodProfileProps {
  profile: SettlementPeriodProfileItem[];
  timeOfDay: TimeOfDayAnalysis;
}

export const SettlementPeriodProfile = ({
  profile,
  timeOfDay,
}: SettlementPeriodProfileProps) => {
  const chartData = profile.map((p) => {
    const hour = Math.floor((p.settlement_period - 1) / 2);
    const minute = (p.settlement_period - 1) % 2 === 0 ? '00' : '30';
    return {
      sp: `SP${p.settlement_period}`,
      time: `${hour.toString().padStart(2, '0')}:${minute}`,
      mae_mw: p.mae_mw,
      avg_error_mw: p.avg_error_mw,
      isPeak: p.is_evening_peak,
    };
  });

  return (
    <div className="space-y-6">
      {/* Time-of-Day Key Spreads with airy padding and clean typography */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Evening Peak */}
        <div className="bg-white p-5 rounded border border-[#eeebe2]">
          <div className="flex items-center justify-between border-b border-[#f2efe8] pb-2.5">
            <span className="text-xs uppercase tracking-wider text-amber-900 font-semibold font-mono">
              UK Evening Peak Risk
            </span>
            <span className="text-xs font-mono text-stone-500">SPs 33-38 (16:00 - 19:00 UTC)</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between font-mono">
            <div>
              <div className="text-xs text-stone-500 uppercase">Average Error</div>
              <div className="text-xl font-semibold text-stone-900 mt-0.5">
                {timeOfDay.evening_peak.mae_mw.toLocaleString()} <span className="text-xs font-normal text-stone-500">MW MAE</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-stone-500 uppercase">Mean Bias</div>
              <div className="text-xl font-semibold text-amber-700 mt-0.5">
                +{timeOfDay.evening_peak.bias_mw.toLocaleString()} <span className="text-xs font-normal text-stone-500">MW</span>
              </div>
            </div>
          </div>
        </div>

        {/* Night Off-Peak */}
        <div className="bg-white p-5 rounded border border-[#eeebe2]">
          <div className="flex items-center justify-between border-b border-[#f2efe8] pb-2.5">
            <span className="text-xs uppercase tracking-wider text-stone-700 font-semibold font-mono">
              Night Off-Peak Baseline
            </span>
            <span className="text-xs font-mono text-stone-500">SPs 1-14 (00:00 - 07:00 UTC)</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between font-mono">
            <div>
              <div className="text-xs text-stone-500 uppercase">Average Error</div>
              <div className="text-xl font-semibold text-stone-900 mt-0.5">
                {timeOfDay.night_offpeak.mae_mw.toLocaleString()} <span className="text-xs font-normal text-stone-500">MW MAE</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-stone-500 uppercase">Mean Bias</div>
              <div className="text-xl font-semibold text-stone-800 mt-0.5">
                +{timeOfDay.night_offpeak.bias_mw.toLocaleString()} <span className="text-xs font-normal text-stone-500">MW</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 48 Settlement Periods Profile Bar Chart */}
      <div className="bg-white p-6 rounded border border-[#eeebe2] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f2efe8] pb-3">
          <div>
            <h4 className="font-serif text-base font-medium text-[#1c1917]">
              Settlement Period Error Profile (January 2026 Distribution)
            </h4>
            <p className="text-xs text-stone-500 mt-0.5 font-mono">
              Mean Absolute Error and directional bias across all 48 half-hour settlement periods
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 bg-[#1b3a2f]"></span>
              <span className="text-stone-700">MAE (MW)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 bg-amber-600"></span>
              <span className="text-stone-700">Mean Bias (MW)</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1ede6" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#78716c', fontFamily: 'monospace' }}
                interval={3}
                tickLine={false}
                axisLine={{ stroke: '#e5e1d7' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#78716c', fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e1d7' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              />
              <ReferenceLine y={0} stroke="#cbd5e1" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-[#eeebe2] p-3 rounded text-xs space-y-1 font-mono">
                      <div className="font-bold text-stone-900">
                        {d.sp} ({d.time} UTC) {d.isPeak ? '• Evening Peak' : ''}
                      </div>
                      <div className="text-stone-600">MAE: {d.mae_mw.toLocaleString()} MW</div>
                      <div className="text-amber-700">Mean Bias: +{d.avg_error_mw.toLocaleString()} MW</div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="mae_mw" fill="#1b3a2f" fillOpacity={0.85} barSize={6} radius={[1, 1, 0, 0]} />
              <Bar dataKey="avg_error_mw" fill="#d97706" fillOpacity={0.75} barSize={6} radius={[1, 1, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
