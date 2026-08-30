import {
  Layers,
  Smartphone,
  Zap,
  Image as ImageIcon,
  Shuffle,
  GitBranch,
  Target,
} from 'lucide-react';
import { MODELS } from '@/types/weather';
import type { ModelArchitecture } from '@/types/weather';

const ARCH_ICON: Record<ModelArchitecture, typeof Layers> = {
  'Custom CNN': Layers,
  MobileNetV2: Smartphone,
  EfficientNetB0: Zap,
};

const PIPELINE = [
  {
    icon: ImageIcon,
    title: 'Image Preprocessing',
    description:
      'Images are resized to 224×224 pixels, converted to RGB, and normalized to the [0, 1] range (or ImageNet mean/std normalization for transfer-learning models).',
  },
  {
    icon: Shuffle,
    title: 'Data Augmentation',
    description:
      'To improve generalization, the training set is augmented with random horizontal flips, rotations, zoom, brightness shifts, and width/height shifts.',
  },
  {
    icon: GitBranch,
    title: 'Training & Validation',
    description:
      'Models are trained with categorical cross-entropy loss and the Adam optimizer. A held-out validation set monitors generalization, with early stopping to prevent overfitting.',
  },
  {
    icon: Target,
    title: 'Evaluation Metrics',
    description:
      'Performance is measured with accuracy, precision, recall, F1-score, and a confusion matrix — reported per class and as macro averages.',
  },
];

export function ModelInfoView() {
  return (
    <div className="container-app animate-fade-in py-12">
      <h1 className="section-title">Model Information</h1>
      <p className="section-subtitle">
        Three architectures are explored and compared: a custom CNN baseline
        and two transfer-learning models built on pre-trained ImageNet
        backbones.
      </p>

      {/* Model cards */}
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {MODELS.map((model) => {
          const Icon = ARCH_ICON[model.architecture];
          return (
            <div key={model.id} className="card flex flex-col p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-950/50 text-sky-300">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="badge bg-slate-800 text-slate-300">
                  {model.architecture}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">
                {model.name}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                {model.description}
              </p>
              <div className="mt-4 flex items-center gap-4 border-t border-slate-800 pt-4 text-xs text-slate-500">
                <span>Input: {model.inputSize}×{model.inputSize}</span>
                <span
                  className={`badge ${
                    model.trainable
                      ? 'bg-emerald-950/40 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {model.trainable ? 'Fine-tunable' : 'Frozen'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline */}
      <h2 className="mt-16 text-xl font-semibold text-white">
        Training Pipeline
      </h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {PIPELINE.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-950/50 text-sky-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-sm font-semibold text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Architecture comparison note */}
      <div className="mt-12 card border-sky-800/30 bg-sky-950/10 p-6">
        <h3 className="text-sm font-semibold text-sky-200">
          Comparison Strategy
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          All three models are trained and evaluated on the same dataset split.
          Their accuracy, precision, recall, F1-score, and inference speed are
          compared to select the best candidate for deployment. Results will be
          published on the Results dashboard once training is complete — no
          metrics are shown until then.
        </p>
      </div>
    </div>
  );
}
