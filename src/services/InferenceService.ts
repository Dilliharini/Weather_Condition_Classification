// Inference service interface.
//
// This interface defines the contract the frontend relies on to get a
// prediction from a weather-classification model. The current
// implementation is the HTTP inference service (see ./httpInferenceService.ts)
// that communicates with the trained TensorFlow/Keras model backend.
// No frontend UI code needs to change to swap backends — just implement
// this same interface against a new provider and swap the provider used
// in `src/services/prediction.ts`.

import type { PredictionResult, GradCamResult } from '@/types/weather';

export interface InferenceService {
  /**
   * Run a classification on the given image file and return a
   * prediction result with probabilities for every weather class.
   */
  predict(image: File): Promise<PredictionResult>;

  /**
   * Request a Grad-CAM explanation for the given image. Returns the
   * original image plus a heatmap overlay highlighting the regions
   * most influential to the model's decision.
   */
  explain(image: File): Promise<GradCamResult>;
}
