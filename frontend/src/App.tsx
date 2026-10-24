import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { TimeseriesChart } from './components/TimeseriesChart';
import { SettlementPeriodProfile } from './components/SettlementPeriodProfile';
import { ProcurementSimulator } from './components/ProcurementSimulator';
import { AiRiskGuard } from './components/AiRiskGuard';
import { MonthlyAnalysis } from './components/MonthlyAnalysis';
import {
  fetchDailyAnalytics,
  fetchHealth,
  fetchMonthlyAnalytics,
} from './api';
import {
  DailyResponse,
  HealthResponse,
  MonthlyResponse,
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'accuracy' | 'simulator' | 'risk' | 'monthly'>('accuracy');
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [selectedCutoff, setSelectedCutoff] = useState('11:00:00');

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [dailyData, setDailyData] = useState<DailyResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyResponse | null>(null);

  const [, setLoadingDaily] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll health on mount
  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((err) => console.error('Healthcheck failed', err));
  }, []);

  // Fetch daily data on date or cutoff change
  useEffect(() => {
    let isMounted = true;
    setLoadingDaily(true);
    fetchDailyAnalytics(selectedDate, selectedCutoff)
      .then((res) => {
        if (isMounted) {
          setDailyData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoadingDaily(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedCutoff]);

  // Fetch monthly data on cutoff change
  useEffect(() => {
    let isMounted = true;
    setLoadingMonthly(true);
    fetchMonthlyAnalytics('2026-01-01', '2026-01-31', selectedCutoff)
      .then((res) => {
        if (isMounted) setMonthlyData(res);
      })
      .catch((err) => console.error('Monthly fetch error', err))
      .finally(() => {
        if (isMounted) setLoadingMonthly(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCutoff]);

  const handleSelectDateFromMonthly = (date: string) => {
    setSelectedDate(date);
    setActiveTab('accuracy');
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-[#1c1917] flex flex-col font-sans selection:bg-[#1b3a2f] selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedCutoff={selectedCutoff}
        setSelectedCutoff={setSelectedCutoff}
        health={health}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-xs text-red-800 font-mono">
            Error: {error}
          </div>
        )}

        {/* TAB 1: ACCURACY EVALUATION */}
        {activeTab === 'accuracy' && (
          <div className="space-y-8">
            {dailyData && (
              <>
                <KpiCards
                  metrics={dailyData.metrics}
                  subtitle={`Performance Overview for Delivery Date: ${dailyData.date} (Cutoff: ${dailyData.cutoff_time_utc} UTC)`}
                />
                <TimeseriesChart
                  data={dailyData.settlement_data}
                  targetDate={dailyData.date}
                  cutoffTime={dailyData.cutoff_time_utc}
                />
              </>
            )}

            {monthlyData && (
              <SettlementPeriodProfile
                profile={monthlyData.settlement_period_profile}
                timeOfDay={monthlyData.time_of_day_analysis}
              />
            )}
          </div>
        )}

        {/* TAB 2: PROCUREMENT SIMULATOR */}
        {activeTab === 'simulator' && (
          <ProcurementSimulator
            selectedDate={selectedDate}
            selectedCutoff={selectedCutoff}
          />
        )}

        {/* TAB 3: AI RISK GUARD */}
        {activeTab === 'risk' && (
          <AiRiskGuard
            selectedDate={selectedDate}
            selectedCutoff={selectedCutoff}
          />
        )}

        {/* TAB 4: MONTHLY ANALYSIS */}
        {activeTab === 'monthly' && (
          <>
            {monthlyData ? (
              <MonthlyAnalysis
                data={monthlyData}
                onSelectDate={handleSelectDateFromMonthly}
              />
            ) : (
              <div className="py-20 text-center text-xs font-mono text-stone-500">
                {loadingMonthly
                  ? 'Aggregating monthly performance ledgers across January 2026...'
                  : 'No monthly data available'}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-[#eeebe2] bg-[#fbfaf8] py-6 text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-stone-900 font-medium">REint PowerDesk</span>
            <span>•</span>
            <span>UK National Grid Wholesale Electricity Market Intelligence</span>
          </div>
          <div className="font-mono text-stone-500 text-[11px]">
            Data: Elexon BMRS (FUELHH & WINDFOR) • Gate: {selectedCutoff} UTC
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
