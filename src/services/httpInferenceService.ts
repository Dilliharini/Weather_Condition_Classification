// HTTP inference service — connects the frontend to the trained
// TensorFlow/Keras model served by a backend API.
//
// This implementation POSTs the uploaded image to an inference endpoint
// and parses the real prediction probabilities from the response. The
// backend loads the `weather_classifier.keras` model and exposes it
// through a REST API.
//
// ---------------------------------------------------------------------------
// EXPECTED BACKEND RESPONSE SHAPE (JSON)
// ---------------------------------------------------------------------------
// The predict endpoint returns:
//
//   {
//     "predictedClass": "cloudy",          // top class label (string)
//     "confidence": 0.92,                  // top class probability (0..1)
//     "probabilities": {                   // keyed by class label:
//       "cloudy":  0.92,
//       "foggy":   0.03,
//       "rainy":   0.02,
//       "shine":   0.02,
//       "sunrise": 0.01
//     },
//     "inferenceTimeMs": 123
//   }
//
// The Grad-CAM (explain) endpoint returns:
//
//   {
//     "originalImage": "<data-url or remote url>",
//     "heatmapImage":  "<data-url or remote url of Grad-CAM overlay>",
//     "predictedClass": "cloudy",
//     "confidence": 0.92
//   }
//
// ---------------------------------------------------------------------------
// INTEGRATION POINT — backend URL
// ---------------------------------------------------------------------------
// Set the inference API base URL via the VITE_INFERENCE_URL environment
// variable (e.g. in your .env file):
//
//   VITE_INFERENCE_URL=https://your-model-server.example.com
//
// If left unset, the service falls back to a relative path so it works
// behind a proxy during development.
// ---------------------------------------------------------------------------

import type { InferenceService } from './InferenceService';
import type {
  PredictionResult,
  ClassProbability,
  GradCamResult,
  WeatherClass,
} from '@/types/weather';
import { WEATHER_CLASSES } from '@/types/weather';

const BASE_URL = import.meta.env.VITE_INFERENCE_URL ?? '';
const PREDICT_ENDPOINT = `${BASE_URL}/api/predict`;
const EXPLAIN_ENDPOINT = `${BASE_URL}/api/explain`;

// Validate that a string is one of our known weather classes.
function isWeatherClass(value: string): value is WeatherClass {
  return WEATHER_CLASSES.includes(value as WeatherClass);
}

// Shape of the raw predict endpoint response.
interface PredictResponse {
  predictedClass?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
  inferenceTimeMs?: number;
}

// Shape of the raw explain endpoint response.
interface ExplainResponse {
  originalImage?: string;
  heatmapImage?: string;
  predictedClass?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
}

export class HttpInferenceService implements InferenceService {
  async predict(image: File): Promise<PredictionResult> {
    const start = performance.now();

    const formData = new FormData();
    formData.append('file', image);

    let response: Response;
    try {
      response = await fetch(PREDICT_ENDPOINT, {
        method: 'POST',
        body: formData,
      });
    } catch {
      throw new Error(
        'Could not reach the model server. Please check that the backend is running.'
      );
    }

    if (!response.ok) {
      throw new Error(
        `The model server returned an error (status ${response.status}). Please try again.`
      );
    }

    let data: PredictResponse;
    try {
      data = (await response.json()) as PredictResponse;
    } catch {
      throw new Error('Received an invalid response from the model server.');
    }

    // Validate and normalize the probabilities object.
    let probabilities: ClassProbability[];
    if (
      data.probabilities &&
      typeof data.probabilities === 'object' &&
      !Array.isArray(data.probabilities)
    ) {
      const entries = Object.entries(data.probabilities);
      if (
        entries.length === WEATHER_CLASSES.length &&
        entries.every(
          ([label, prob]) =>
            typeof label === 'string' &&
            isWeatherClass(label) &&
            typeof prob === 'number',
        )
      ) {
        probabilities = entries.map(([label, prob]) => ({
          label: label as WeatherClass,
          probability: prob as number,
        }));
      } else {
        throw new Error(
          'The model server response did not include valid class probabilities.'
        );
      }
    } else {
      throw new Error(
        'The model server response did not include valid class probabilities.'
      );
    }

    probabilities.sort((a, b) => b.probability - a.probability);

    const predictedClass = probabilities[0].label;
    const confidence = probabilities[0].probability;
    const inferenceTimeMs =
      typeof data.inferenceTimeMs === 'number'
        ? data.inferenceTimeMs
        : Math.round(performance.now() - start);

    return {
      predictedClass,
      confidence,
      probabilities,
      inferenceTimeMs,
      modelId: 'weather_classifier.keras',
    };
  }

  async explain(image: File): Promise<GradCamResult> {
    const formData = new FormData();
    formData.append('file', image);

    let response: Response;
    try {
      response = await fetch(EXPLAIN_ENDPOINT, {
        method: 'POST',
        body: formData,
      });
    } catch {
      throw new Error(
        'Could not reach the Grad-CAM service. Please check that the backend is running.'
      );
    }

    if (!response.ok) {
      throw new Error(
        `The Grad-CAM service returned an error (status ${response.status}). Please try again.`
      );
    }

    let data: ExplainResponse;
    try {
      data = (await response.json()) as ExplainResponse;
    } catch {
      throw new Error('Received an invalid response from the Grad-CAM service.');
    }

    if (
      typeof data.originalImage !== 'string' ||
      typeof data.heatmapImage !== 'string' ||
      typeof data.predictedClass !== 'string' ||
      !isWeatherClass(data.predictedClass)
    ) {
      throw new Error(
        'The Grad-CAM service response was missing required fields.'
      );
    }

    // Parse optional probabilities dict into a sorted array.
    let probabilities: ClassProbability[] | undefined;
    if (
      data.probabilities &&
      typeof data.probabilities === 'object' &&
      !Array.isArray(data.probabilities)
    ) {
      const entries = Object.entries(data.probabilities);
      if (
        entries.length === WEATHER_CLASSES.length &&
        entries.every(
          ([label, prob]) =>
            typeof label === 'string' &&
            isWeatherClass(label) &&
            typeof prob === 'number',
        )
      ) {
        probabilities = entries
          .map(([label, prob]) => ({
            label: label as WeatherClass,
            probability: prob as number,
          }))
          .sort((a, b) => b.probability - a.probability);
      }
    }

    return {
      originalImage: data.originalImage,
      heatmapImage: data.heatmapImage,
      predictedClass: data.predictedClass,
      confidence: typeof data.confidence === 'number' ? data.confidence : 0,
      probabilities,
    };
  }
}
