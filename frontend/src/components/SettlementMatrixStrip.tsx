import React from 'react';
import { DailySettlementItem } from '../types';

interface SettlementMatrixStripProps {
  data: DailySettlementItem[];
  selectedSp: number | null;
  onSelectSp: (sp: number) => void;
}

export const SettlementMatrixStrip: React.FC<SettlementMatrixStripProps> = ({
  data,
  selectedSp,
  onSelectSp,
}) => {
  return (
    <div className="bg-white rounded border border-[#e5e1d7] p-3 space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-800 uppercase tracking-wider text-[11px]">
            48 Settlement Periods Matrix
          </span>
          <span className="text-stone-500 text-[10px]">Click any cell to scrub period</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-stone-500">
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded bg-stone-200"></span>
            <span>&lt; 500 MW (In-Spec)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded bg-amber-300"></span>
            <span>500-1500 MW (Warning)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded bg-amber-600"></span>
            <span>&gt; 1500 MW (Shortfall)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded border border-blue-500 bg-blue-100"></span>
            <span>Under-forecast</span>
          </div>
        </div>
      </div>

      {/* 48 Periods Grid */}
      <div className="grid grid-cols-12 sm:grid-cols-24 lg:grid-cols-48 gap-1">
        {data.map((item) => {
          const sp = item.settlement_period;
          const isSelected = selectedSp === sp;
          const isPeak = 33 <= sp && sp <= 38;
          const err = item.forecast_error;

          let bgClass = 'bg-stone-100 text-stone-700 hover:bg-stone-200';
          if (err > 1500) {
            bgClass = 'bg-amber-600 text-white font-semibold hover:bg-amber-700';
          } else if (err > 500) {
            bgClass = 'bg-amber-200 text-amber-900 font-medium hover:bg-amber-300';
          } else if (err < -500) {
            bgClass = 'bg-blue-100 text-blue-900 font-medium hover:bg-blue-200';
          }

          return (
            <button
              key={sp}
              onClick={() => onSelectSp(sp)}
              title={`SP ${sp} (${item.start_time.substring(11, 16)} UTC): Error ${err > 0 ? '+' : ''}${err.toLocaleString()} MW`}
              className={`h-9 flex flex-col items-center justify-center rounded text-[10px] font-mono transition-all cursor-pointer relative ${bgClass} ${
                isSelected ? 'ring-2 ring-stone-900 shadow-sm z-10' : ''
              } ${isPeak ? 'border-b-2 border-amber-800' : ''}`}
            >
              <span className="leading-none text-[9px] opacity-75">{sp.toString().padStart(2, '0')}</span>
              <span className="leading-none text-[10px] font-bold mt-0.5">
                {err > 0 ? `+${(err / 1000).toFixed(1)}k` : `${(err / 1000).toFixed(1)}k`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] font-mono text-stone-500 pt-0.5 px-0.5">
        <span>00:00 (SP 01)</span>
        <span className="text-stone-700">06:00 (SP 13)</span>
        <span className="text-stone-700">12:00 (SP 25)</span>
        <span className="text-amber-800 font-semibold">16:30 - 19:00 (SPs 33-38 UK Evening Peak)</span>
        <span>23:30 (SP 48)</span>
      </div>
    </div>
  );
};
