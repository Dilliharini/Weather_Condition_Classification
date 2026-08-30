"""
Configuration for the Weather Condition Classification backend.

The trained model (weather_classifier.keras) already contains internal
preprocessing layers, including:
  - RandomFlip, RandomRotation, RandomZoom (data augmentation)
  - Rescaling(1./127.5, offset=-1) (normalization)

Therefore the backend must NOT apply any normalization, rescaling, or
augmentation. It only needs to resize the image to 224x224, convert it
to RGB, and pass the raw [0, 255] pixel values to the model.
"""

from pathlib import Path

# ---------------------------------------------------------------------------
# Model configuration
# ---------------------------------------------------------------------------

# Path to the trained Keras model file. Place the .keras file at:
#   backend/models/weather_classifier.keras
MODEL_PATH = Path(__file__).parent / "models" / "weather_classifier.keras"

# ---------------------------------------------------------------------------
# Weather class labels — MUST match the order the model was trained on.
# Do NOT change this order; the model output index corresponds to these.
# ---------------------------------------------------------------------------
CLASS_LABELS = ["cloudy", "foggy", "rainy", "shine", "sunrise"]

# ---------------------------------------------------------------------------
# Image preprocessing configuration
#
# The model contains its own Rescaling(1./127.5, offset=-1) layer, so
# the backend must pass raw [0, 255] pixel values without any
# normalization. Only resize and RGB conversion are performed here.
# ---------------------------------------------------------------------------

# Target image size (height, width) the model expects.
IMAGE_SIZE = (224, 224)

# Convert images to RGB (3 channels) before inference.
RGB_MODE = True

# ---------------------------------------------------------------------------
# Server configuration
# ---------------------------------------------------------------------------
HOST = "0.0.0.0"
PORT = 8000

# ---------------------------------------------------------------------------
# Grad-CAM configuration (for the /api/explain endpoint)
#
# The name of the last convolutional layer in the model. This is needed
# to compute Grad-CAM activations. Update this to match your model's
# architecture. Common values:
#   - MobileNetV2:     "Conv_1" or "out_relu"
#   - EfficientNetB0:  "top_activation" or "block7a_project_conv"
#   - Custom CNN:      the name of your last Conv2D layer
# Leave as None until you know the exact layer name from your model.
# ---------------------------------------------------------------------------
GRADCAM_LAYER_NAME = None
