import { useState, useEffect } from 'react';
import { fetchSimulation } from '../api';
import { SimulationResponse } from '../types';

interface ProcurementSimulatorProps {
  selectedDate: string;
  selectedCutoff: string;
}

export const ProcurementSimulator: React.FC<ProcurementSimulatorProps> = ({
  selectedDate,
  selectedCutoff,
}) => {
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [data, setData] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchSimulation(selectedDate, selectedCutoff, riskProfile)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedCutoff, riskProfile]);

  return (
    <div className="space-y-6">
      {/* Overview & Risk Selector */}
      <div className="bg-white p-5 rounded border border-[#eeebe2] space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#f2efe8] pb-3">
          <div>
            <h3 className="font-serif text-lg font-medium text-[#1c1917]">
              Day-Ahead Procurement & Reserve Buffer Recommendation
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Determines optimal thermal procurement volume beyond wind generation to hedge balancing market exposure.
            </p>
          </div>

          {/* Risk Profile Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium">Risk Buffer:</span>
            <div className="flex rounded border border-[#e5e1d7] overflow-hidden text-xs font-mono">
              <button
                onClick={() => setRiskProfile('conservative')}
                className={`px-3 py-1 transition-colors ${
                  riskProfile === 'conservative'
                    ? 'bg-[#1b3a2f] text-white font-medium'
                    : 'bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                Conservative (P95)
              </button>
              <button
                onClick={() => setRiskProfile('balanced')}
                className={`px-3 py-1 transition-colors border-x border-[#e5e1d7] ${
                  riskProfile === 'balanced'
                    ? 'bg-[#1b3a2f] text-white font-medium'
                    : 'bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                Balanced (P90)
              </button>
              <button
                onClick={() => setRiskProfile('aggressive')}
                className={`px-3 py-1 transition-colors ${
                  riskProfile === 'aggressive'
                    ? 'bg-[#1b3a2f] text-white font-medium'
                    : 'bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                Aggressive (P75)
              </button>
            </div>
          </div>
        </div>

        {/* Commercial Totals Cards */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
            <div className="bg-[#fbfaf8] p-3 rounded border border-[#eeebe2]">
              <div className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
                Consumer Demand
              </div>
              <div className="text-lg font-mono font-semibold text-stone-900 mt-1">
                {(data.totals.total_demand_mwh / 1000).toFixed(1)} <span className="text-xs font-normal text-stone-500">GWh</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">Total retail requirement</div>
            </div>

            <div className="bg-[#fbfaf8] p-3 rounded border border-[#eeebe2]">
              <div className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
                Expected Wind
              </div>
              <div className="text-lg font-mono font-semibold text-[#1b3a2f] mt-1">
                {(data.totals.total_wind_forecast_mwh / 1000).toFixed(1)} <span className="text-xs font-normal text-stone-500">GWh</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">Day-ahead forecast</div>
            </div>

            <div className="bg-[#fbfaf8] p-3 rounded border border-[#eeebe2]">
              <div className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
                Raw Procurement
              </div>
              <div className="text-lg font-mono font-semibold text-slate-800 mt-1">
                {(data.totals.total_raw_procurement_mwh / 1000).toFixed(1)} <span className="text-xs font-normal text-stone-500">GWh</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">Unhedged shortfall</div>
            </div>

            <div className="bg-[#fbfaf8] p-3 rounded border border-[#eeebe2]">
              <div className="text-[11px] uppercase tracking-wider text-amber-800 font-medium">
                Safety Reserve Buffer
              </div>
              <div className="text-lg font-mono font-semibold text-amber-700 mt-1">
                +{(data.totals.reserve_buffer_energy_mwh / 1000).toFixed(1)} <span className="text-xs font-normal text-stone-500">GWh</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">Risk hedge allowance</div>
            </div>

            <div className="bg-[#f2efe8] p-3 rounded border border-[#e5e1d7] col-span-2 md:col-span-1">
              <div className="text-[11px] uppercase tracking-wider text-[#1b3a2f] font-semibold">
                Recommended Order
              </div>
              <div className="text-lg font-mono font-bold text-[#1b3a2f] mt-1">
                {(data.totals.total_recommended_procurement_mwh / 1000).toFixed(1)} <span className="text-xs font-normal">GWh</span>
              </div>
              <div className="text-[11px] text-stone-600 mt-0.5">Total Day-Ahead Bid</div>
            </div>
          </div>
        )}
      </div>

      {/* Hourly Schedule Table */}
      {data && (
        <div className="bg-white rounded border border-[#eeebe2] overflow-hidden">
          <div className="p-4 border-b border-[#f2efe8] flex items-center justify-between">
            <h4 className="font-serif text-sm font-medium text-stone-900">
              Half-Hour Settlement Dispatch Schedule (48 Periods)
            </h4>
            <span className="text-xs font-mono text-stone-500">All figures in MW</span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fbfaf8] text-stone-500 font-mono text-[11px] uppercase tracking-wider border-b border-[#eeebe2] sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3 text-right">Demand</th>
                  <th className="py-2.5 px-3 text-right">Wind Forecast</th>
                  <th className="py-2.5 px-3 text-right">Actual Wind</th>
                  <th className="py-2.5 px-3 text-right">Raw Need</th>
                  <th className="py-2.5 px-3 text-right text-amber-800">Buffer</th>
                  <th className="py-2.5 px-3 text-right text-[#1b3a2f] font-semibold">Recommended Bid</th>
                  <th className="py-2.5 px-3 text-right">Unhedged Shortfall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2efe8] font-mono">
                {data.hourly_schedule.map((row) => (
                  <tr key={row.settlement_period} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-2 px-3 text-stone-700">SP {row.settlement_period.toString().padStart(2, '0')}</td>
                    <td className="py-2 px-3 text-stone-500">{row.start_time.substring(11, 16)}</td>
                    <td className="py-2 px-3 text-right text-stone-800">{row.demand_mw.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-slate-700">{row.forecast_wind_mw.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-[#1b3a2f] font-medium">{row.actual_wind_mw.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-stone-600">{row.raw_procurement_mw.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-amber-700">+{row.safety_buffer_mw.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-[#1b3a2f] font-bold">{row.recommended_procurement_mw.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">
                      {row.unbuffered_shortfall_risk_mw > 0 ? (
                        <span className="text-red-700 font-medium">-{row.unbuffered_shortfall_risk_mw.toLocaleString()} MW</span>
                      ) : (
                        <span className="text-emerald-800">Covered</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-xs font-mono text-stone-500">
          Calculating day-ahead dispatch schedule and buffer margins...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-xs text-red-800">
          {error}
        </div>
      )}
    </div>
  );
};
