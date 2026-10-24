import { MetricKPIs } from '../types';

interface KpiCardsProps {
  metrics: MetricKPIs;
  subtitle?: string;
}

export const KpiCards = ({ metrics, subtitle }: KpiCardsProps) => {
  const isOverforecast = metrics.mean_bias > 50;
  const isUnderforecast = metrics.mean_bias < -50;

  return (
    <div className="space-y-3">
      {subtitle && (
        <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
          <span>{subtitle}</span>
          <span>{metrics.count} settlement periods</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* MAE */}
        <div className="bg-white p-5 rounded border border-[#eeebe2]">
          <div className="text-xs uppercase tracking-wider text-stone-500 font-medium">
            Mean Absolute Error
          </div>
          <div className="text-2xl font-mono font-semibold text-[#1c1917] mt-2">
            {metrics.mae.toLocaleString()} <span className="text-xs font-normal text-stone-500">MW</span>
          </div>
          <div className="text-xs text-stone-500 mt-1">Average forecast variance</div>
        </div>

        {/* RMSE */}
        <div className="bg-white p-5 rounded border border-[#eeebe2]">
          <div className="text-xs uppercase tracking-wider text-stone-500 font-medium">
            Root Mean Square Error
          </div>
          <div className="text-2xl font-mono font-semibold text-[#1c1917] mt-2">
            {metrics.rmse.toLocaleString()} <span className="text-xs font-normal text-stone-500">MW</span>
          </div>
          <div className="text-xs text-stone-500 mt-1">Penalizes large deviance</div>
        </div>

        {/* Mean Bias */}
        <div className="bg-white p-5 rounded border border-[#eeebe2]">
          <div className="text-xs uppercase tracking-wider text-stone-500 font-medium">
            Directional Bias
          </div>
          <div
            className={`text-2xl font-mono font-semibold mt-2 ${
              isOverforecast ? 'text-amber-700' : isUnderforecast ? 'text-blue-700' : 'text-[#1c1917]'
            }`}
          >
            {metrics.mean_bias > 0 ? `+${metrics.mean_bias.toLocaleString()}` : metrics.mean_bias.toLocaleString()}{' '}
            <span className="text-xs font-normal text-stone-500">MW</span>
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {isOverforecast ? 'Systematic Over-forecast' : isUnderforecast ? 'Under-forecast' : 'Balanced'}
          </div>
        </div>

        {/* WAPE */}
        <div className="bg-white p-5 rounded border border-[#eeebe2]">
          <div className="text-xs uppercase tracking-wider text-stone-500 font-medium">
            WAPE Error
          </div>
          <div className="text-2xl font-mono font-semibold text-[#1c1917] mt-2">
            {metrics.wape.toFixed(1)}%
          </div>
          <div className="text-xs text-stone-500 mt-1">Weighted percentage error</div>
        </div>
      </div>
    </div>
  );
};
