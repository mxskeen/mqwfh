import { HealthResponse } from '../types';

interface HeaderProps {
  activeTab: 'accuracy' | 'simulator' | 'risk' | 'monthly';
  setActiveTab: (tab: 'accuracy' | 'simulator' | 'risk' | 'monthly') => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedCutoff: string;
  setSelectedCutoff: (cutoff: string) => void;
  health: HealthResponse | null;
}

export const CUTOFF_OPTIONS = [
  { label: '11:00 UTC (Day-Ahead Gate)', value: '11:00:00' },
  { label: '08:00 UTC (Early Window)', value: '08:00:00' },
  { label: '17:00 UTC (Post-Auction)', value: '17:00:00' },
  { label: '23:00 UTC (Pre-Delivery)', value: '23:00:00' },
];

export const DATES_JAN_2026 = Array.from({ length: 31 }, (_, i) => {
  const day = (i + 1).toString().padStart(2, '0');
  return `2026-01-${day}`;
});

export const Header = ({
  activeTab,
  setActiveTab,
  selectedDate,
  setSelectedDate,
  selectedCutoff,
  setSelectedCutoff,
  health,
}: HeaderProps) => {
  return (
    <header className="border-b border-[#eeebe2] bg-[#fbfaf8]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Tier 1: Brand & Status with generous breathing room */}
        <div className="h-20 flex items-center justify-between border-b border-[#f2efe8]">
          <div className="flex items-center gap-4">
            <span className="font-serif text-2xl tracking-tight font-medium text-[#1c1917]">
              REint PowerDesk
            </span>
            <span className="text-xs text-stone-500 font-sans border-l border-stone-200 pl-4 py-0.5">
              UK Wholesale Electricity Market Intelligence
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#f2efe8] border border-[#e5e1d7] text-xs font-mono text-stone-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span>
              <span>{health ? 'BMRS Stream Active' : 'Connecting...'}</span>
            </div>
            <span className="text-xs text-stone-500 font-mono">January 2026</span>
          </div>
        </div>

        {/* Tier 2: Spacious Navigation & Clear Date / Gate Controls */}
        <div className="h-14 flex items-center justify-between">
          <nav className="flex items-center gap-8 text-sm">
            <button
              onClick={() => setActiveTab('accuracy')}
              className={`transition-colors py-3 font-medium cursor-pointer ${
                activeTab === 'accuracy'
                  ? 'text-[#1c1917] border-b-2 border-[#1b3a2f]'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Accuracy Evaluation
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`transition-colors py-3 font-medium cursor-pointer ${
                activeTab === 'simulator'
                  ? 'text-[#1c1917] border-b-2 border-[#1b3a2f]'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Procurement Simulator
            </button>
            <button
              onClick={() => setActiveTab('risk')}
              className={`transition-colors py-3 font-medium cursor-pointer ${
                activeTab === 'risk'
                  ? 'text-[#1c1917] border-b-2 border-[#1b3a2f]'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              AI Risk Guard
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`transition-colors py-3 font-medium cursor-pointer ${
                activeTab === 'monthly'
                  ? 'text-[#1c1917] border-b-2 border-[#1b3a2f]'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Monthly Analysis
            </button>
          </nav>

          <div className="flex items-center gap-5 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-stone-500">Delivery:</span>
              <select
                aria-label="Delivery Date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-[#e5e1d7] rounded px-2.5 py-1 text-xs text-stone-800 focus:outline-none focus:border-[#1b3a2f]"
              >
                {DATES_JAN_2026.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-stone-500">Gate:</span>
              <select
                aria-label="Gate Closure"
                value={selectedCutoff}
                onChange={(e) => setSelectedCutoff(e.target.value)}
                className="bg-white border border-[#e5e1d7] rounded px-2.5 py-1 text-xs text-stone-800 focus:outline-none focus:border-[#1b3a2f]"
              >
                {CUTOFF_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
