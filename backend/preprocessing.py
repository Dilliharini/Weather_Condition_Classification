"""
Image preprocessing utilities.

The trained model (weather_classifier.keras) already contains internal
preprocessing layers:
  - RandomFlip, RandomRotation, RandomZoom (data augmentation, inactive at inference)
  - Rescaling(1./127.5, offset=-1) (normalization)

Therefore this module does NOT apply any normalization, rescaling, or
augmentation. It only:
  1. Loads the image from raw bytes.
  2. Converts it to RGB.
  3. Resizes it to 224x224.
  4. Converts it to a NumPy float32 array (raw [0, 255] values).
  5. Adds the batch dimension -> shape (1, 224, 224, 3).
"""

import io

import numpy as np
from PIL import Image

import config


def load_image(file_bytes: bytes) -> Image.Image:
    """Load raw bytes into a PIL Image and convert to RGB."""
    img = Image.open(io.BytesIO(file_bytes))
    if config.RGB_MODE:
        img = img.convert("RGB")
    else:
        img = img.convert("L")
    return img


def preprocess_image(img: Image.Image) -> np.ndarray:
    """
    Preprocess a PIL image into a model-ready batch tensor.

    Only resizing and array conversion are performed — no normalization.
    The model handles rescaling internally via its Rescaling layer.
    """
    img = img.resize(config.IMAGE_SIZE)
    arr = np.array(img, dtype=np.float32)

    if arr.ndim == 2:
        # Grayscale — add channel dimension
        arr = np.expand_dims(arr, axis=-1)

    # Add batch dimension -> shape (1, H, W, C)
    arr = np.expand_dims(arr, axis=0)
    return arr


def image_to_data_url(img: Image.Image, format: str = "PNG") -> str:
    """Convert a PIL image to a base64 data URL for API responses."""
    import base64

    buf = io.BytesIO()
    img.save(buf, format=format)
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    mime = f"image/{format.lower()}"
    return f"data:{mime};base64,{encoded}"
