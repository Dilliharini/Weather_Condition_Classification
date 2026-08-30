import {
  Target,
  Crosshair,
  RefreshCw,
  Grid3x3,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { METRIC_PLACEHOLDERS, WEATHER_CLASSES } from '@/types/weather';

const METRIC_ICONS: Record<string, typeof Target> = {
  accuracy: Target,
  precision: Crosshair,
  recall: RefreshCw,
  f1: Target,
};

const GRAPH_PLACEHOLDERS = [
  { key: 'train-acc', label: 'Training Accuracy', icon: TrendingUp },
  { key: 'val-acc', label: 'Validation Accuracy', icon: TrendingUp },
  { key: 'train-loss', label: 'Training Loss', icon: TrendingDown },
  { key: 'val-loss', label: 'Validation Loss', icon: TrendingDown },
];

export function ResultsView() {
  return (
    <div className="container-app animate-fade-in py-12">
      <h1 className="section-title">Results Dashboard</h1>
      <p className="section-subtitle">
        Evaluation metrics and training curves will appear here once the
        models are trained and evaluated on a real dataset.
      </p>

      {/* Awaiting results banner */}
      <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-800/40 bg-amber-950/20 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        <div>
          <p className="text-sm font-semibold text-amber-200">
            Awaiting actual model-training results
          </p>
          <p className="mt-1 text-sm text-amber-100/70">
            No metrics, confusion matrix, or training curves are shown here
            because the models have not yet been trained. This dashboard is
            fully prepared to display real results as soon as they are
            available. No values are fabricated or hard-coded.
          </p>
        </div>
      </div>

      {/* Metric placeholders */}
      <h2 className="mt-12 text-xl font-semibold text-white">
        Evaluation Metrics
      </h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {METRIC_PLACEHOLDERS.map((metric) => {
          const Icon = METRIC_ICONS[metric.key] ?? Target;
          return (
            <div
              key={metric.key}
              className="card flex flex-col items-center p-6 text-center"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-slate-500">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-300">
                {metric.label}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {metric.description}
              </p>
              <div className="mt-4 flex h-10 w-full items-center justify-center rounded-lg border border-dashed border-slate-700 text-xs text-slate-600">
                Not yet available
              </div>
            </div>
          );
        })}
      </div>

      {/* Confusion matrix placeholder */}
      <h2 className="mt-12 text-xl font-semibold text-white">
        Confusion Matrix
      </h2>
      <div className="mt-6 card p-6">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Grid3x3 className="h-4 w-4" />
          A 5×5 confusion matrix will be rendered here once predictions are
          evaluated on the test set.
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-center text-xs">
            <thead>
              <tr>
                <th className="border-b border-slate-800 p-2 text-slate-500">
                  Actual \ Predicted
                </th>
                {WEATHER_CLASSES.map((cls) => (
                  <th
                    key={cls}
                    className="border-b border-slate-800 p-2 font-medium text-slate-400"
                  >
                    {cls}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEATHER_CLASSES.map((row) => (
                <tr key={row}>
                  <th className="border-b border-slate-800 p-2 text-left font-medium text-slate-400">
                    {row}
                  </th>
                  {WEATHER_CLASSES.map((col) => (
                    <td
                      key={col}
                      className="border-b border-l border-slate-800/60 p-2"
                    >
                      <span className="text-slate-700">—</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Training curves placeholders */}
      <h2 className="mt-12 text-xl font-semibold text-white">
        Training &amp; Validation Curves
      </h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {GRAPH_PLACEHOLDERS.map((graph) => {
          const Icon = graph.icon;
          return (
            <div key={graph.key} className="card p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Icon className="h-4 w-4 text-sky-400" />
                {graph.label}
              </div>
              <div className="mt-4 flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40">
                <div className="text-center">
                  <Icon className="mx-auto h-6 w-6 text-slate-700" />
                  <p className="mt-2 text-xs text-slate-600">
                    Chart will be displayed after training
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
