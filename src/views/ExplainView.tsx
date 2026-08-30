import { useCallback, useRef, useState } from 'react';
import {
  Upload,
  Loader2,
  AlertCircle,
  RotateCcw,
  Eye,
  Flame,
  Info,
} from 'lucide-react';
import type { GradCamResult } from '@/types/weather';
import { getInferenceService } from '@/services/prediction';
import {
  validateImageFile,
  fileToDataUrl,
  ACCEPTED_IMAGE_TYPES,
} from '@/utils/fileValidation';
import { WeatherIcon } from '@/components/WeatherIcon';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function ExplainView() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [result, setResult] = useState<GradCamResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setOriginalUrl(null);
    setResult(null);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError.message);
      setStatus('error');
      setOriginalUrl(null);
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
      setOriginalUrl(url);
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

  const handleExplain = async () => {
    if (!selectedFile) return;
    setStatus('loading');
    setError(null);
    setResult(null);
    try {
      const service = getInferenceService();
      const res = await service.explain(selectedFile);
      setResult(res);
      setStatus('success');
    } catch (err) {
      setError(
        err instanceof Error
          ? `Grad-CAM request failed: ${err.message}`
          : 'Grad-CAM request failed unexpectedly. Please try again.'
      );
      setStatus('error');
    }
  };

  return (
    <div className="container-app animate-fade-in py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="section-title">Explainable AI — Grad-CAM</h1>
        <p className="section-subtitle">
          Grad-CAM highlights the regions of an image that most influenced the
          model's classification, helping interpret and trust its decisions.
        </p>

        {/* Info banner */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-sky-800/30 bg-sky-950/10 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
          <p className="text-sm text-slate-300">
            This section calls the Grad-CAM endpoint of the model backend.
            When the backend returns a heatmap overlay, it is displayed
            alongside the original image, the predicted class, and the
            confidence score.
          </p>
        </div>

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
            <Eye className="h-4 w-4" />
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
            aria-label="Upload image for Grad-CAM"
          />
        </div>

        {/* Error */}
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
        {originalUrl && (
          <div className="mt-8 animate-slide-up">
            <div className="card overflow-hidden p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={originalUrl}
                    alt="Selected for Grad-CAM"
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(0)} KB`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExplain}
                    disabled={status === 'loading'}
                    className="btn-primary"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Flame className="h-4 w-4" />
                        Generate Grad-CAM
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
        )}

        {/* Loading */}
        {status === 'loading' && (
          <div className="mt-6 animate-pulse-soft card p-6">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Computing Grad-CAM activation map...
            </div>
          </div>
        )}

        {/* Results */}
        {status === 'success' && result && (
          <div className="mt-6 animate-slide-up space-y-6">
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-white">
                Grad-CAM Visualization
              </h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                    Original image
                  </p>
                  <img
                    src={result.originalImage}
                    alt="Original"
                    className="h-56 w-full rounded-xl object-cover"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                    Grad-CAM heatmap
                  </p>
                  <img
                    src={result.heatmapImage}
                    alt="Grad-CAM heatmap overlay"
                    className="h-56 w-full rounded-xl object-cover"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-950/50 text-sky-300">
                    <WeatherIcon
                      condition={result.predictedClass}
                      className="h-6 w-6"
                    />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Predicted class
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {result.predictedClass}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Confidence
                  </p>
                  <p className="text-lg font-semibold text-sky-400">
                    {result.confidence > 0
                      ? `${(result.confidence * 100).toFixed(1)}%`
                      : '—'}
                  </p>
                </div>
              </div>

              {result.probabilities && result.probabilities.length > 0 && (
                <div className="mt-6 border-t border-slate-800 pt-6">
                  <h3 className="text-sm font-semibold text-white">
                    Class probabilities
                  </h3>
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
              )}

              <p className="mt-6 text-xs leading-relaxed text-slate-500">
                Warmer colors (red, yellow) in the heatmap highlight the image
                regions that most strongly influenced the model's prediction.
                Cooler colors (blue) indicate regions with minimal contribution.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
