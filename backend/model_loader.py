"""
Model loading and inference utilities.

Loads the trained Keras model lazily on first request so the server
starts quickly and only loads the model when needed.
"""

import logging
from functools import lru_cache

import config

logger = logging.getLogger("weather-api.model_loader")


@lru_cache(maxsize=1)
def get_model():
    """
    Load and cache the trained Keras model.

    The model is loaded lazily on first call and cached for subsequent
    requests. If the model file is not yet present at the configured path,
    a clear error is raised.
    """
    try:
        import tensorflow as tf
    except ImportError as exc:
        raise RuntimeError(
            "TensorFlow is not installed. Run: pip install -r requirements.txt"
        ) from exc

    if not config.MODEL_PATH.exists():
        raise RuntimeError(
            f"Model file not found at {config.MODEL_PATH}. "
            "Please add weather_classifier.keras to the backend/models/ folder."
        )

    logger.info("Loading Keras model from %s", config.MODEL_PATH)
    try:
        model = tf.keras.models.load_model(str(config.MODEL_PATH))
    except Exception as exc:
        logger.exception("Failed to load Keras model")
        raise RuntimeError(f"Failed to load model: {exc}") from exc

    logger.info("Model loaded successfully. Input shape: %s", model.input_shape)
    return model


def predict_batch(preprocessed_array) -> list[float]:
    """
    Run inference on a single preprocessed image batch.

    Args:
        preprocessed_array: numpy array of shape (1, H, W, C)

    Returns:
        List of probabilities, one per class, in the order defined by
        config.CLASS_LABELS.
    """
    model = get_model()
    logger.info(
        "Running predict on input shape=%s dtype=%s",
        preprocessed_array.shape,
        preprocessed_array.dtype,
    )
    try:
        predictions = model.predict(preprocessed_array, verbose=0)
    except Exception as exc:
        logger.exception("model.predict() failed")
        raise RuntimeError(f"model.predict() failed: {exc}") from exc

    # Keras may return shape (1, num_classes) for softmax output
    # or (1, 1) for a single sigmoid output.
    if predictions.shape[-1] == 1:
        # Binary or single-output — expand to match class count
        probabilities = predictions[0].tolist()
    else:
        probabilities = predictions[0].tolist()

    return probabilities
