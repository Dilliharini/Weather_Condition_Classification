// Prediction service provider.
//
// This is the single place the rest of the app imports to get an
// InferenceService. It returns the HTTP inference service that
// communicates with the trained TensorFlow/Keras model backend.
//
// The backend is expected to load `weather_classifier.keras` and expose
// prediction + Grad-CAM endpoints. Set VITE_INFERENCE_URL in your .env
// file to point at the model server's base URL.

import type { InferenceService } from './InferenceService';
import { HttpInferenceService } from './httpInferenceService';

let instance: InferenceService | null = null;

export function getInferenceService(): InferenceService {
  if (!instance) {
    instance = new HttpInferenceService();
  }
  return instance;
}
