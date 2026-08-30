import {
  Brain,
  ImageIcon,
  BarChart3,
  ArrowRight,
  Layers,
  Eye,
  Cpu,
} from 'lucide-react';
import type { View } from '@/types/navigation';
import { WEATHER_CLASS_INFO } from '@/types/weather';
import { WeatherIcon } from '@/components/WeatherIcon';

interface HomeViewProps {
  onNavigate: (view: View) => void;
}

export function HomeView({ onNavigate }: HomeViewProps) {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.15),_transparent_55%)]" />
        <div className="container-app relative py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="badge border border-sky-700/50 bg-sky-950/40 text-sky-300">
              <Cpu className="h-3.5 w-3.5" />
              Deep Learning · Computer Vision
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Weather Condition Classification
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              A deep-learning computer vision system that classifies weather
              conditions from images. Upload a photo and the trained model
              predicts whether it's cloudy, foggy, rainy, shine, or sunrise —
              with confidence scores and explainable AI insights.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => onNavigate('predict')}
                className="btn-primary w-full sm:w-auto"
              >
                Try Prediction
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onNavigate('model')}
                className="btn-ghost w-full sm:w-auto"
              >
                <Layers className="h-4 w-4" />
                Model Architecture
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Weather classes */}
      <section className="container-app py-12">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-slate-400">
          Five Weather Classes
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {WEATHER_CLASS_INFO.map((info) => (
            <div
              key={info.label}
              className="card flex flex-col items-center p-5 text-center transition-colors hover:border-slate-700"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-950/50 text-sky-300">
                <WeatherIcon condition={info.label} className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">
                {info.label}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {info.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="container-app py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={ImageIcon}
            title="Image Prediction"
            description="Upload a weather image and get a predicted condition with confidence and per-class probabilities."
            actionLabel="Open Predictor"
            onClick={() => onNavigate('predict')}
          />
          <FeatureCard
            icon={Layers}
            title="Model Information"
            description="Learn about the Custom CNN baseline, MobileNetV2, and EfficientNetB0 transfer-learning architectures."
            actionLabel="View Models"
            onClick={() => onNavigate('model')}
          />
          <FeatureCard
            icon={BarChart3}
            title="Results Dashboard"
            description="Accuracy, precision, recall, F1-score, and confusion matrix — populated once real training is complete."
            actionLabel="See Results"
            onClick={() => onNavigate('results')}
          />
          <FeatureCard
            icon={Eye}
            title="Explainable AI"
            description="Grad-CAM visualizations highlighting the image regions most influential to the model's decision."
            actionLabel="Explore Grad-CAM"
            onClick={() => onNavigate('explain')}
          />
          <FeatureCard
            icon={Brain}
            title="Transfer Learning"
            description="Pre-trained ImageNet backbones fine-tuned on a custom weather dataset for strong accuracy."
            actionLabel="Learn More"
            onClick={() => onNavigate('model')}
          />
        </div>
      </section>

      {/* Status banner */}
      <section className="container-app pb-16">
        <div className="card flex flex-col items-start gap-4 border-emerald-800/40 bg-emerald-950/20 p-6 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-900/40 text-emerald-300">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-200">
              Trained model connected
            </h3>
            <p className="mt-1 text-sm text-emerald-100/70">
              The inference layer is now connected to the trained
              TensorFlow/Keras model (weather_classifier.keras). Real
              predictions are served from the model backend. Evaluation
              metrics and Grad-CAM visualizations will appear once those
              endpoints are available.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: typeof ImageIcon;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  onClick,
}: FeatureCardProps) {
  return (
    <div className="card flex flex-col p-6 transition-colors hover:border-slate-700">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-950/50 text-sky-300">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
        {description}
      </p>
      <button
        onClick={onClick}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sky-400 hover:text-sky-300"
      >
        {actionLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
