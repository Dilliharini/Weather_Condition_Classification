"""
FastAPI backend for the Weather Condition Classification application.

Endpoints:
  POST /api/predict  — classify a weather image
  POST /api/explain  — generate Grad-CAM visualization (prepared)
  GET  /api/health   — health check
  GET  /api/classes  — list weather class labels

Run with:
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import logging
import time
import traceback

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import config
from preprocessing import load_image, preprocess_image, image_to_data_url
from model_loader import get_model, predict_batch

# ---------------------------------------------------------------------------
# Logging — surface real exceptions in Render logs
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("weather-api")

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Weather Condition Classification API",
    description="Deep learning API for classifying weather conditions from images.",
    version="1.0.0",
)

# CORS — allow the frontend to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    model_loaded = False
    try:
        get_model()
        model_loaded = True
    except Exception as exc:
        logger.exception("Health check — model load failed")
        return {
            "status": "ok",
            "model_loaded": False,
            "model_path": str(config.MODEL_PATH),
            "error": str(exc),
        }
    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "model_path": str(config.MODEL_PATH),
    }


@app.get("/api/classes")
async def get_classes():
    """Return the weather class labels in model output order."""
    return {
        "classes": config.CLASS_LABELS,
        "image_size": list(config.IMAGE_SIZE),
        "normalization": "model_internal",
    }


# ---------------------------------------------------------------------------
# POST /api/predict
# ---------------------------------------------------------------------------

@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    """
    Classify an uploaded weather image.

    Accepts JPG, JPEG, or PNG image files. Returns the predicted class,
    confidence, and per-class probabilities.
    """
    # Validate file type
    allowed_types = {"image/jpeg", "image/jpg", "image/png"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a JPG, JPEG, or PNG image.",
        )

    # Read and validate file size (10 MB max)
    file_bytes = await file.read()
    max_size = 10 * 1024 * 1024
    if len(file_bytes) > max_size:
        raise HTTPException(
            status_code=400,
            detail="File is too large. Maximum allowed size is 10 MB.",
        )
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    # Load and preprocess the image
    try:
        img = load_image(file_bytes)
    except Exception as exc:
        logger.exception("load_image failed")
        raise HTTPException(
            status_code=400,
            detail=f"Could not read the image file. It may be corrupted. ({exc})",
        )

    try:
        preprocessed = preprocess_image(img)
    except Exception as exc:
        logger.exception("preprocess_image failed")
        raise HTTPException(
            status_code=500,
            detail=f"Image preprocessing failed: {exc}",
        )

    # Run inference
    start_time = time.time()
    try:
        probabilities = predict_batch(preprocessed)
    except RuntimeError as exc:
        logger.exception("predict_batch RuntimeError")
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("predict_batch failed")
        raise HTTPException(
            status_code=500,
            detail=f"Model inference failed: {exc}",
        )
    inference_time_ms = int((time.time() - start_time) * 1000)

    # Build response — probabilities as a dict keyed by class label
    prob_dict = {
        config.CLASS_LABELS[i]: float(probabilities[i])
        for i in range(len(config.CLASS_LABELS))
    }

    # Find the predicted class (highest probability)
    predicted_index = max(
        range(len(probabilities)), key=lambda i: probabilities[i]
    )
    predicted_class = config.CLASS_LABELS[predicted_index]
    confidence = float(probabilities[predicted_index])

    return {
        "predictedClass": predicted_class,
        "confidence": confidence,
        "probabilities": prob_dict,
        "inferenceTimeMs": inference_time_ms,
    }


# ---------------------------------------------------------------------------
# POST /api/explain (Grad-CAM — prepared for future use)
# ---------------------------------------------------------------------------

@app.post("/api/explain")
async def explain(file: UploadFile = File(...)):
    """
    Generate a Grad-CAM visualization for an uploaded weather image.

    This endpoint is prepared for Grad-CAM visualization. It requires
    GRADCAM_LAYER_NAME to be configured in config.py and the model to
    be loaded. Once configured, it returns the original image, the
    Grad-CAM heatmap overlay, the predicted class, and confidence.
    """
    # Validate file type
    allowed_types = {"image/jpeg", "image/jpg", "image/png"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a JPG, JPEG, or PNG image.",
        )

    # Read and validate file size
    file_bytes = await file.read()
    max_size = 10 * 1024 * 1024
    if len(file_bytes) > max_size:
        raise HTTPException(
            status_code=400,
            detail="File is too large. Maximum allowed size is 10 MB.",
        )
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    # Load and preprocess the image
    try:
        img = load_image(file_bytes)
    except Exception as exc:
        logger.exception("load_image failed")
        raise HTTPException(
            status_code=400,
            detail=f"Could not read the image file. It may be corrupted. ({exc})",
        )

    try:
        preprocessed = preprocess_image(img)
    except Exception as exc:
        logger.exception("preprocess_image failed")
        raise HTTPException(
            status_code=500,
            detail=f"Image preprocessing failed: {exc}",
        )

    # Run prediction first
    try:
        probabilities = predict_batch(preprocessed)
    except RuntimeError as exc:
        logger.exception("predict_batch RuntimeError")
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("predict_batch failed")
        raise HTTPException(
            status_code=500,
            detail=f"Model inference failed: {exc}",
        )

    predicted_class_index = max(range(len(probabilities)), key=lambda i: probabilities[i])
    predicted_class = config.CLASS_LABELS[predicted_class_index]
    confidence = float(probabilities[predicted_class_index])

    # Generate Grad-CAM heatmap
    try:
        from gradcam import generate_gradcam
        model = get_model()
        heatmap_img = generate_gradcam(
            model, preprocessed, predicted_class_index, img
        )
        original_data_url = image_to_data_url(img, "PNG")
        heatmap_data_url = image_to_data_url(heatmap_img, "PNG")
    except RuntimeError as exc:
        logger.exception("generate_gradcam RuntimeError")
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("generate_gradcam failed")
        raise HTTPException(
            status_code=500,
            detail=f"Grad-CAM generation failed: {exc}",
        )

    prob_dict = {
        config.CLASS_LABELS[i]: float(probabilities[i])
        for i in range(len(config.CLASS_LABELS))
    }

    return {
        "originalImage": original_data_url,
        "heatmapImage": heatmap_data_url,
        "predictedClass": predicted_class,
        "confidence": confidence,
        "probabilities": prob_dict,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.HOST, port=config.PORT)
