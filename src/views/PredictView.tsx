import { useCallback, useRef, useState } from 'react';
import {
  Upload,
  FileImage,
  Loader2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Clock,
} from 'lucide-react';
import type { PredictionResult } from '@/types/weather';
import { getInferenceService } from '@/services/prediction';
import {
  validateImageFile,
  fileToDataUrl,
  ACCEPTED_IMAGE_TYPES,
} from '@/utils/fileValidation';
import { WeatherIcon } from '@/components/WeatherIcon';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function PredictView() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setPreviewUrl(null);
    setSelectedFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError.message);
      setStatus('error');
      setPreviewUrl(null);
      setSelectedFile(null);
      setResult(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setResult(null);
    setStatus('idle');

    try {
      const url = await fileToDataUrl(file);
      setPreviewUrl(url);
    } catch {
      setError('Could not load the image preview. Please try another file.');
      setStatus('error');
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handlePredict = async () => {
    if (!selectedFile) return;
    setStatus('loading');
    setError(null);
    setResult(null);
    try {
      const service = getInferenceService();
      const res = await service.predict(selectedFile);
      setResult(res);
      setStatus('success');
    } catch (err) {
      setError(
        err instanceof Error
          ? `Prediction failed: ${err.message}`
          : 'Prediction failed unexpectedly. Please try again.'
      );
      setStatus('error');
    }
  };

  return (
    <div className="container-app animate-fade-in py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="section-title">Image Prediction</h1>
        <p className="section-subtitle">
          Upload a weather photo and run a classification. JPG, JPEG, and PNG
          files up to 10 MB are supported.
        </p>

        {/* Upload zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`mt-8 card flex flex-col items-center justify-center border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
            isDragging ? 'border-sky-500 bg-sky-950/20' : 'border-slate-700'
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-950/50 text-sky-300">
            <Upload className="h-7 w-7" />
          </div>
          <p className="mt-4 text-sm text-slate-300">
            Drag and drop an image here, or
          </p>
          <button
            onClick={() => inputRef.current?.click()}
            className="btn-ghost mt-3"
          >
            <FileImage className="h-4 w-4" />
            Browse files
          </button>
          <p className="mt-4 text-xs text-slate-500">
            Accepted formats: JPG, JPEG, PNG · Max size: 10 MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            onChange={handleInputChange}
            className="sr-only"
            aria-label="Upload weather image"
          />
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-xl border border-red-800/50 bg-red-950/30 p-4 text-sm text-red-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Preview + actions */}
        {previewUrl && (
          <div className="mt-8 animate-slide-up">
            <div className="card overflow-hidden">
              <div className="flex flex-col gap-6 p-6 sm:flex-row">
                <div className="flex-1">
                  <img
                    src={previewUrl}
                    alt="Uploaded weather preview"
                    className="h-56 w-full rounded-xl object-cover sm:h-64"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-center gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Selected file
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-slate-200">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(0)} KB`
                        : ''}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={handlePredict}
                      disabled={status === 'loading'}
                      className="btn-primary"
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Predicting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Predict Weather
                        </>
                      )}
                    </button>
                    <button onClick={reset} className="btn-ghost">
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {status === 'loading' && (
          <div className="mt-6 animate-pulse-soft card p-6">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Running inference on the uploaded image...
            </div>
            <div className="mt-4 space-y-3">
              <div className="h-4 w-3/4 rounded bg-slate-800" />
              <div className="h-4 w-1/2 rounded bg-slate-800" />
              <div className="h-4 w-2/3 rounded bg-slate-800" />
            </div>
          </div>
        )}

        {/* Results */}
        {status === 'success' && result && (
          <div className="mt-6 animate-slide-up space-y-6">
            {/* Top prediction */}
            <div className="card p-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-950/50 text-sky-300">
                    <WeatherIcon
                      condition={result.predictedClass}
                      className="h-8 w-8"
                    />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Predicted condition
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {result.predictedClass}
                    </p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Confidence
                  </p>
                  <p className="text-3xl font-bold text-sky-400">
                    {(result.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Inference time: {result.inferenceTimeMs} ms
              </div>
            </div>

            {/* All probabilities */}
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-white">
                Prediction probabilities
              </h2>
              <div className="mt-4 space-y-3">
                {result.probabilities.map((prob) => {
                  const pct = prob.probability * 100;
                  const isTop = prob.label === result.predictedClass;
                  return (
                    <div key={prob.label}>
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={`flex items-center gap-2 ${
                            isTop ? 'font-medium text-white' : 'text-slate-400'
                          }`}
                        >
                          <WeatherIcon
                            condition={prob.label}
                            className="h-4 w-4"
                          />
                          {prob.label}
                        </span>
                        <span
                          className={`font-mono ${
                            isTop ? 'text-sky-300' : 'text-slate-500'
                          }`}
                        >
                          {pct.toFixed(2)}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isTop ? 'bg-sky-500' : 'bg-slate-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
