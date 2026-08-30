"""
Grad-CAM (Gradient-weighted Class Activation Mapping) utilities.

Generates a heatmap overlay highlighting the image regions most
influential to the model's prediction. The last convolutional layer
is auto-detected at runtime by inspecting the model architecture,
including nested sub-models like the MobileNetV2 base inside a
Sequential model.
"""

import logging

import numpy as np
from PIL import Image

import config

logger = logging.getLogger("weather-api.gradcam")


def generate_gradcam(
    model,
    preprocessed_array,
    predicted_class_index: int,
    original_image: Image.Image,
) -> Image.Image:
    """
    Generate a Grad-CAM heatmap overlay on the original image.

    Args:
        model: the loaded Keras model
        preprocessed_array: preprocessed input tensor (1, H, W, C)
        predicted_class_index: index of the predicted class
        original_image: the original PIL image for overlay sizing

    Returns:
        PIL image with the Grad-CAM heatmap overlaid on the original.
    """
    import tensorflow as tf
    import cv2

    # Auto-detect the last convolutional layer
    conv_layer, containing_model = _find_last_conv_layer(model)
    if conv_layer is None:
        raise RuntimeError(
            "Could not find a Conv2D layer in the model or any nested sub-model."
        )
    logger.info(
        "Grad-CAM using conv layer '%s' (output shape: %s) inside model '%s'",
        conv_layer.name,
        conv_layer.output_shape,
        containing_model.name,
    )

    # Build a model that outputs [conv_output, predictions]
    grad_model = _build_grad_model(model, conv_layer, containing_model)
    logger.info("Grad-CAM model built successfully")

    # Compute gradients of the predicted class w.r.t. the conv output
    with tf.GradientTape() as tape:
        conv_output, predictions = grad_model(preprocessed_array)
        loss = predictions[0][predicted_class_index]

    grads = tape.gradient(loss, conv_output)
    if grads is None:
        raise RuntimeError(
            "Gradients are None — could not compute gradients of the predicted "
            "class w.r.t. the conv layer output."
        )

    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2)).numpy()
    conv_output = conv_output[0].numpy()

    for i in range(pooled_grads.shape[0]):
        conv_output[:, :, i] *= pooled_grads[i]

    heatmap = np.mean(conv_output, axis=-1)
    heatmap = np.maximum(heatmap, 0)
    max_val = np.max(heatmap)
    if max_val > 0:
        heatmap /= max_val

    # Resize heatmap to original image size and apply JET color map
    original_size = original_image.size  # (width, height) for PIL
    heatmap_resized = cv2.resize(heatmap, original_size)
    heatmap_colored = cv2.applyColorMap(
        np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET
    )
    # cv2 outputs BGR; convert to RGB to match PIL
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

    # Overlay heatmap on the original image
    original_rgb = np.array(original_image.convert("RGB"))
    overlay = cv2.addWeighted(original_rgb, 0.6, heatmap_colored, 0.4, 0)

    return Image.fromarray(overlay)


def _find_last_conv_layer(model):
    """
    Find the last Conv2D layer in the model, including nested sub-models.

    Returns:
        (layer, containing_model) where containing_model is the model
        that directly contains the layer. Returns (None, model) if no
        Conv2D layer is found.
    """
    import tensorflow as tf

    for layer in reversed(model.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer, model
        # Check if this layer is a nested sub-model (e.g. MobileNetV2)
        if hasattr(layer, "layers") and len(layer.layers) > 0:
            result = _find_last_conv_layer(layer)
            if result[0] is not None:
                return result
    return None, model


def _build_grad_model(outer_model, conv_layer, containing_model):
    """
    Build a Keras model that outputs [conv_layer_output, predictions].

    Instead of extracting intermediate tensors (layer.output) from the
    loaded model's graph — which fails because those tensors are already
    bound to the original model — this function creates a fresh Input
    and calls each layer on it sequentially. The layers share the same
    trained weights but build new graph connections, which is the
    correct way to construct a Grad-CAM model from a loaded .keras file.
    """
    import tensorflow as tf

    # Find the position of the containing sub-model in the outer model.
    sub_model_idx = None
    for i, layer in enumerate(outer_model.layers):
        if layer is containing_model:
            sub_model_idx = i
            break

    if sub_model_idx is None:
        raise RuntimeError(
            "Could not find the sub-model containing the conv layer "
            "in the outer model."
        )

    # Find the index of the conv layer within the containing model.
    conv_idx = None
    for i, layer in enumerate(containing_model.layers):
        if layer is conv_layer:
            conv_idx = i
            break

    if conv_idx is None:
        raise RuntimeError(
            "Could not find the conv layer in the containing model."
        )

    logger.info(
        "Building grad model: sub_model at index %d, conv layer '%s' at "
        "index %d within sub-model",
        sub_model_idx,
        conv_layer.name,
        conv_idx,
    )

    # Create a fresh input tensor
    new_input = tf.keras.Input(shape=outer_model.input_shape[1:])

    # Apply layers before the sub-model (augmentation, rescaling, etc.)
    x = new_input
    for i in range(sub_model_idx):
        x = outer_model.layers[i](x)

    # Branch 1: call the sub-model's layers up to and including the conv
    # layer to get the convolutional feature map.
    conv_x = x
    for i in range(conv_idx + 1):
        conv_x = containing_model.layers[i](conv_x)
    conv_out = conv_x

    # Branch 2: call all of the sub-model's layers for the full feature
    # output, then apply the remaining outer model layers (global
    # pooling, dropout, dense, etc.) to get final predictions.
    full_x = x
    for layer in containing_model.layers:
        full_x = layer(full_x)
    for i in range(sub_model_idx + 1, len(outer_model.layers)):
        full_x = outer_model.layers[i](full_x)

    return tf.keras.Model(inputs=new_input, outputs=[conv_out, full_x])
