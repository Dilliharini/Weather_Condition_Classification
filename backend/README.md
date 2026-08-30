# Weather Condition Classification — Backend

FastAPI backend that serves predictions from the trained TensorFlow/Keras
model (`weather_classifier.keras`).

## Setup

```bash
cd backend
pip install -r requirements.txt
```

## Add your model

Place the trained model file at:

```
backend/models/weather_classifier.keras
```

## Configure preprocessing

Open `config.py` and update the image preprocessing values to match
your Google Colab training notebook:

- `IMAGE_SIZE` — the target image size (e.g. `(224, 224)`)
- `RGB_MODE` — `True` for RGB, `False` for grayscale
- `NORMALIZATION_MODE` — `"rescale"`, `"imagenet"`, or `"none"`
- `GRADCAM_LAYER_NAME` — the last convolutional layer name (for Grad-CAM)

## Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

| Method | Path             | Description                          |
|--------|------------------|--------------------------------------|
| GET    | /api/health      | Health check + model status          |
| GET    | /api/classes     | List weather class labels            |
| POST   | /api/predict     | Classify an uploaded weather image   |
| POST   | /api/explain     | Grad-CAM visualization (future)      |

## Weather Classes

The model outputs these classes in this exact order:

| Index | Label   |
|-------|---------|
| 0     | Cloudy  |
| 1     | Foggy   |
| 2     | Rainy   |
| 3     | Shine   |
| 4     | Sunrise |
