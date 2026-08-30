// Shared domain types for the Weather Condition Classification app.
// These types define the contract between the frontend UI and the
// inference service so the trained TensorFlow/Keras model backend can
// be connected without changing the UI layer.

export type WeatherClass = 'cloudy' | 'foggy' | 'rainy' | 'shine' | 'sunrise';

// The order here MUST match the class-index order the trained Keras model
// outputs. The model (weather_classifier.keras) was trained with these
// five classes in this exact order:
//   0 -> cloudy
//   1 -> foggy
//   2 -> rainy
//   3 -> shine
//   4 -> sunrise
export const WEATHER_CLASSES: WeatherClass[] = [
  'cloudy',
  'foggy',
  'rainy',
  'shine',
  'sunrise',
];

// Metadata describing each class for display purposes.
export interface WeatherClassInfo {
  label: WeatherClass;
  description: string;
  icon: 'Cloud' | 'CloudFog' | 'CloudRain' | 'Sun' | 'Sunrise';
}

export const WEATHER_CLASS_INFO: WeatherClassInfo[] = [
  {
    label: 'cloudy',
    description: 'Overcast or partly cloudy skies with diffuse light.',
    icon: 'Cloud',
  },
  {
    label: 'foggy',
    description: 'Fog or mist dramatically reducing visibility.',
    icon: 'CloudFog',
  },
  {
    label: 'rainy',
    description: 'Visible rain, wet surfaces, and low visibility.',
    icon: 'CloudRain',
  },
  {
    label: 'shine',
    description: 'Clear skies with strong sunlight and minimal cloud cover.',
    icon: 'Sun',
  },
  {
    label: 'sunrise',
    description: 'Sunrise scenes with warm horizon colors and early light.',
    icon: 'Sunrise',
  },
];

// A single class probability in a prediction result.
export interface ClassProbability {
  label: WeatherClass;
  probability: number; // 0..1
}

// The result returned by the inference service. The frontend renders
// this shape regardless of the backend implementation.
export interface PredictionResult {
  predictedClass: WeatherClass;
  confidence: number; // 0..1, probability of the top class
  probabilities: ClassProbability[];
  inferenceTimeMs: number;
  modelId: string;
}

// Grad-CAM explainability result returned by the backend.
export interface GradCamResult {
  originalImage: string; // data URL or remote URL
  heatmapImage: string; // data URL or remote URL of the overlay
  predictedClass: WeatherClass;
  confidence: number;
  probabilities?: ClassProbability[];
}

export type ModelArchitecture =
  | 'Custom CNN'
  | 'MobileNetV2'
  | 'EfficientNetB0';

export interface ModelInfo {
  id: string;
  name: string;
  architecture: ModelArchitecture;
  description: string;
  inputSize: number; // e.g. 224 for 224x224
  trainable: boolean;
}

export const MODELS: ModelInfo[] = [
  {
    id: 'custom-cnn',
    name: 'Custom CNN Baseline',
    architecture: 'Custom CNN',
    description:
      'A lightweight convolutional neural network built from scratch as a baseline. Several convolutional blocks with batch normalization and dropout, followed by a dense classifier head.',
    inputSize: 224,
    trainable: true,
  },
  {
    id: 'mobilenetv2',
    name: 'MobileNetV2 (Transfer Learning)',
    architecture: 'MobileNetV2',
    description:
      'Pre-trained MobileNetV2 backbone with ImageNet weights, used as a feature extractor. A custom classification head is trained on top while the base is initially frozen.',
    inputSize: 224,
    trainable: true,
  },
  {
    id: 'efficientnetb0',
    name: 'EfficientNetB0 (Transfer Learning)',
    architecture: 'EfficientNetB0',
    description:
      'Pre-trained EfficientNetB0 backbone with ImageNet weights. Offers a strong accuracy/efficiency trade-off. Custom head trained on top with optional fine-tuning of upper layers.',
    inputSize: 224,
    trainable: true,
  },
];

// The deployed model file that serves predictions. The backend loads
// this Keras model and exposes it through an inference API.
export const DEPLOYED_MODEL_FILE = 'weather_classifier.keras';

// A placeholder metric descriptor. Values are intentionally omitted —
// they will be populated only after real evaluation results are
// provided from the trained model.
export interface MetricPlaceholder {
  key: string;
  label: string;
  description: string;
  available: false;
}

export const METRIC_PLACEHOLDERS: MetricPlaceholder[] = [
  {
    key: 'accuracy',
    label: 'Accuracy',
    description: 'Overall fraction of correctly classified images.',
    available: false,
  },
  {
    key: 'precision',
    label: 'Precision (macro)',
    description: 'Average per-class precision across all weather classes.',
    available: false,
  },
  {
    key: 'recall',
    label: 'Recall (macro)',
    description: 'Average per-class recall across all weather classes.',
    available: false,
  },
  {
    key: 'f1',
    label: 'F1-score (macro)',
    description: 'Harmonic mean of precision and recall, averaged per class.',
    available: false,
  },
];
