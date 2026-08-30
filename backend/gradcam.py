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
        "Grad-CAM using conv layer '%s' (output shape: %s)",
        conv_layer.name,
        conv_layer.output_shape,
    )

    # Build a model that outputs [conv_output, predictions]
    grad_model = _build_grad_model(model, conv_layer, containing_model)

    # Compute gradients of the predicted class w.r.t. the conv output
    with tf.GradientTape() as tape:
        conv_output, predictions = grad_model(preprocessed_array)
        loss = predictions[0][predicted_class_index]

    grads = tape.gradient(loss, conv_output)
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

    Handles the case where the conv layer is inside a nested sub-model
    (e.g. MobileNetV2 inside a Sequential model) by replaying the outer
    model's layers up to the sub-model, then branching.
    """
    import tensorflow as tf

    if containing_model is outer_model:
        # Simple case: conv layer is directly in the outer model
        return tf.keras.Model(
            inputs=outer_model.inputs,
            outputs=[conv_layer.output, outer_model.output],
        )

    # Complex case: conv layer is in a nested sub-model.
    # Build a sub-model from the containing model's input to the conv layer.
    conv_submodel = tf.keras.Model(
        inputs=containing_model.input,
        outputs=conv_layer.output,
    )

    # Find the position of the containing model in the outer model.
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

    # Build a new functional model by replaying the outer layers.
    new_input = tf.keras.Input(shape=outer_model.input_shape[1:])
    x = new_input
    # Run through layers before the sub-model (augmentation, rescaling, etc.)
    for i in range(sub_model_idx):
        x = outer_model.layers[i](x)
    # Branch 1: conv output through the sub-model up to the conv layer
    conv_out = conv_submodel(x)
    # Branch 2: full predictions through the sub-model and remaining layers
    x_full = containing_model(x)
    for i in range(sub_model_idx + 1, len(outer_model.layers)):
        x_full = outer_model.layers[i](x_full)

    return tf.keras.Model(inputs=new_input, outputs=[conv_out, x_full])
