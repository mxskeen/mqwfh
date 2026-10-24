import { useState, useEffect } from 'react';
import { fetchRiskEvaluation } from '../api';
import { RiskEvaluationResponse } from '../types';

interface AiRiskGuardProps {
  selectedDate: string;
  selectedCutoff: string;
}

export const AiRiskGuard: React.FC<AiRiskGuardProps> = ({
  selectedDate,
  selectedCutoff,
}) => {
  const [data, setData] = useState<RiskEvaluationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStateJson, setShowStateJson] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchRiskEvaluation(selectedDate, selectedCutoff)
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
  }, [selectedDate, selectedCutoff]);

  if (loading) {
    return (
      <div className="bg-white p-8 rounded border border-[#eeebe2] text-center text-xs font-mono text-stone-500">
        Evaluating forecast state with decision model...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 p-4 rounded border border-red-200 text-xs text-red-800">
        {error || 'Unable to retrieve risk evaluation'}
      </div>
    );
  }

  const isHighRisk = data.risk_level === 'HIGH';
  const isModerateRisk = data.risk_level === 'MODERATE';

  return (
    <div className="space-y-6">
      {/* Model Overview Card */}
      <div className="bg-white p-6 rounded border border-[#eeebe2] space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#f2efe8] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-medium text-[#1c1917]">
                AI Decision Model & Trading Risk Guard
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#f2efe8] text-stone-700 border border-[#e5e1d7]">
                {data.provider}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Calibrated probabilistic decision gating for day-ahead procurement. Evaluates whether wind forecast volatility warrants an extra thermal reserve hedge.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded text-xs font-mono font-semibold ${
                isHighRisk
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : isModerateRisk
                  ? 'bg-stone-100 text-stone-800 border border-stone-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              Risk Status: {data.risk_level}
            </span>
          </div>
        </div>

        {/* Core Decision Probability Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Calibrated Probability Card */}
          <div className="bg-[#fbfaf8] p-4 rounded border border-[#eeebe2]">
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
              Calibrated Shortfall Probability
            </span>
            <div className="text-3xl font-mono font-bold text-[#1c1917] mt-1.5">
              {(data.probability_shortfall_risk * 100).toFixed(0)}%
            </div>
            {/* Visual Probability Bar */}
            <div className="w-full bg-[#eeebe2] h-2 rounded-full overflow-hidden mt-2.5">
              <div
                className={`h-full rounded-full ${
                  isHighRisk ? 'bg-amber-600' : isModerateRisk ? 'bg-stone-600' : 'bg-emerald-700'
                }`}
                style={{ width: `${Math.min(100, data.probability_shortfall_risk * 100)}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-stone-500 mt-1.5">
              Confidence score: {(data.confidence_score * 100).toFixed(0)}%
            </div>
          </div>

          {/* Action Recommendation Card */}
          <div className="bg-[#fbfaf8] p-4 rounded border border-[#eeebe2]">
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
              Trading Desk Action
            </span>
            <div className="text-lg font-serif font-semibold text-stone-900 mt-2">
              {data.hedge_buffer_recommended ? 'Procure Safety Reserve Buffer' : 'Standard Unhedged Order'}
            </div>
            <div className="text-xs text-stone-600 mt-1">
              {data.hedge_buffer_recommended
                ? 'High probability of delivery shortfall. Hedge in day-ahead auction.'
                : 'Forecast error is within acceptable variance bounds.'}
            </div>
          </div>

          {/* Buffer MW Recommendation */}
          <div className="bg-[#fbfaf8] p-4 rounded border border-[#eeebe2]">
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
              Suggested Reserve Buffer
            </span>
            <div className="text-3xl font-mono font-bold text-[#1b3a2f] mt-1.5">
              {data.recommended_buffer_mw > 0 ? `+${data.recommended_buffer_mw.toLocaleString()}` : '0'}{' '}
              <span className="text-xs font-normal text-stone-500">MW</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-2">
              Thermal peaker / interconnector reserve
            </div>
          </div>
        </div>

        {/* Identified Risk Factors */}
        <div className="pt-2">
          <span className="text-xs uppercase tracking-wider text-stone-500 font-medium">
            Active Risk Factors Identified:
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {data.risk_factors.length > 0 ? (
              data.risk_factors.map((factor, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center text-xs px-2.5 py-1 rounded bg-[#f2efe8] text-stone-800 border border-[#e5e1d7] font-mono"
                >
                  {factor}
                </span>
              ))
            ) : (
              <span className="text-xs text-stone-500 font-mono">No abnormal volatility flags detected.</span>
            )}
          </div>
        </div>

        {/* State JSON Inspector for Tech Lead Review */}
        <div className="pt-3 border-t border-[#f2efe8]">
          <button
            onClick={() => setShowStateJson(!showStateJson)}
            className="text-xs text-stone-500 hover:text-stone-800 underline font-mono cursor-pointer"
          >
            {showStateJson ? 'Hide Model State Payload' : 'Inspect Model State Payload (JSON)'}
          </button>

          {showStateJson && (
            <pre className="mt-2 p-3 bg-stone-900 text-stone-200 rounded text-[11px] font-mono overflow-x-auto">
              {JSON.stringify(data.state, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
