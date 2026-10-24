import React from 'react';
import { DailySettlementItem, RiskEvaluationResponse, SimulationResponse } from '../types';

interface TradingPanelProps {
  selectedSpItem: DailySettlementItem | null;
  riskEvaluation: RiskEvaluationResponse | null;
  simulation: SimulationResponse | null;
  riskProfile: 'conservative' | 'balanced' | 'aggressive';
  setRiskProfile: (p: 'conservative' | 'balanced' | 'aggressive') => void;
  loading: boolean;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({
  selectedSpItem,
  riskEvaluation,
  simulation,
  riskProfile,
  setRiskProfile,
  loading,
}) => {
  const isHighRisk = riskEvaluation?.risk_level === 'HIGH';
  const isModerateRisk = riskEvaluation?.risk_level === 'MODERATE';
  const hedgeRecommended = riskEvaluation?.hedge_buffer_recommended ?? false;
  const probPercent = riskEvaluation ? Math.round(riskEvaluation.probability_shortfall_risk * 100) : 0;

  // Selected settlement period simulation row
  const spSimRow = selectedSpItem && simulation
    ? simulation.hourly_schedule.find((s) => s.settlement_period === selectedSpItem.settlement_period)
    : simulation?.hourly_schedule[33]; // default to SP 34 (17:00 peak)

  return (
    <div className="bg-white rounded border border-[#e5e1d7] p-4 flex flex-col justify-between space-y-4">
      {/* Top Status & Risk Rating */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#f2efe8] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-stone-500 font-semibold font-mono">
              Desk Dispatch Signal
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200">
              {riskEvaluation?.provider.includes('mammoth') ? 'Mammoth-1' : 'Calibrated'}
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-tight ${
              isHighRisk
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : isModerateRisk
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-300'
            }`}
          >
            {hedgeRecommended ? 'HEDGE RECOMMENDED' : 'AUTO-EXECUTE BID'}
          </span>
        </div>

        {/* Shortfall Risk Gauge */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline font-mono text-xs">
            <span className="text-stone-500">Shortfall Probability:</span>
            <span className="font-bold text-stone-900 text-sm">{probPercent}%</span>
          </div>
          <div className="w-full bg-[#f2efe8] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isHighRisk ? 'bg-amber-600' : isModerateRisk ? 'bg-amber-500' : 'bg-emerald-700'
              }`}
              style={{ width: `${Math.min(100, probPercent)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-stone-500 font-mono">
            <span>Confidence: {riskEvaluation ? Math.round(riskEvaluation.confidence_score * 100) : 92}%</span>
            <span>Target Gate: 11:00 UTC D-1</span>
          </div>
        </div>

        {/* Risk Buffer Selector */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-mono mb-1.5">
            <span>Risk Tolerance Band:</span>
            <span className="font-medium text-stone-800 uppercase">{riskProfile}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
            {(['conservative', 'balanced', 'aggressive'] as const).map((profile) => (
              <button
                key={profile}
                onClick={() => setRiskProfile(profile)}
                className={`py-1 rounded text-center transition-colors cursor-pointer ${
                  riskProfile === profile
                    ? 'bg-[#1b3a2f] text-white font-medium'
                    : 'bg-[#f7f6f2] text-stone-700 hover:bg-[#eeebe2]'
                }`}
              >
                {profile === 'conservative' ? 'P95 Cons' : profile === 'balanced' ? 'P90 Bal' : 'P75 Aggr'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settlement Period Inspector Box */}
      <div className="bg-[#fbfaf8] border border-[#e5e1d7] rounded p-3 space-y-2">
        <div className="flex items-center justify-between border-b border-[#f2efe8] pb-1.5">
          <span className="text-[11px] font-mono font-semibold text-stone-800">
            {spSimRow
              ? `SP ${spSimRow.settlement_period.toString().padStart(2, '0')} (${spSimRow.start_time.substring(11, 16)} UTC)`
              : 'Hover / Click an SP'}
          </span>
          {spSimRow && 33 <= spSimRow.settlement_period && spSimRow.settlement_period <= 38 && (
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
              UK EVENING PEAK
            </span>
          )}
        </div>

        {spSimRow ? (
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-stone-500">Retail Demand:</span>
              <span className="font-medium text-stone-900">{spSimRow.demand_mw.toLocaleString()} MW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Wind Forecast:</span>
              <span className="font-medium text-slate-700">{spSimRow.forecast_wind_mw.toLocaleString()} MW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Actual Wind:</span>
              <span className="font-medium text-[#1b3a2f]">{spSimRow.actual_wind_mw.toLocaleString()} MW</span>
            </div>
            <div className="flex justify-between border-t border-[#f2efe8] pt-1">
              <span className="text-stone-500">Raw Shortfall:</span>
              <span className="font-medium text-stone-800">{spSimRow.raw_procurement_mw.toLocaleString()} MW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-800">Reserve Buffer:</span>
              <span className="font-bold text-amber-700">+{spSimRow.safety_buffer_mw.toLocaleString()} MW</span>
            </div>
            <div className="flex justify-between border-t border-[#e5e1d7] pt-1 bg-[#f2efe8] px-1.5 py-1 rounded">
              <span className="font-semibold text-[#1b3a2f]">Recommended Bid:</span>
              <span className="font-bold text-[#1b3a2f]">{spSimRow.recommended_procurement_mw.toLocaleString()} MW</span>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-stone-500 font-mono py-4 text-center">
            Click any bar on the 48-period curve to inspect.
          </div>
        )}
      </div>

      {/* Aggregate Day Summary */}
      {simulation && (
        <div className="pt-2 border-t border-[#f2efe8] space-y-1.5 text-xs font-mono">
          <div className="flex justify-between text-stone-500">
            <span>Total Day Demand:</span>
            <span className="text-stone-900 font-medium">{(simulation.totals.total_demand_mwh / 1000).toFixed(1)} GWh</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Forecast Wind:</span>
            <span className="text-stone-900 font-medium">{(simulation.totals.total_wind_forecast_mwh / 1000).toFixed(1)} GWh</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Reserve Energy:</span>
            <span className="text-amber-700 font-semibold">+{(simulation.totals.reserve_buffer_energy_mwh / 1000).toFixed(1)} GWh</span>
          </div>
          <div className="flex justify-between border-t border-[#eeebe2] pt-1 font-semibold text-[#1b3a2f]">
            <span>Day-Ahead Bid Total:</span>
            <span>{(simulation.totals.total_recommended_procurement_mwh / 1000).toFixed(1)} GWh</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center text-[10px] font-mono text-stone-500">
          Updating real-time dispatch signals...
        </div>
      )}
    </div>
  );
};
