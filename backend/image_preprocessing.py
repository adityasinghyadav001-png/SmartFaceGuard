"""
Image Preprocessing Module.
Applies image enhancement algorithms: CLAHE, White Balance, Gamma Correction, and Bilateral Filtering.
"""

import cv2
import numpy as np

def apply_clahe(image: np.ndarray, clip_limit: float = 2.0, tile_grid_size: tuple = (8, 8)) -> np.ndarray:
    """Apply Contrast Limited Adaptive Histogram Equalization on L-channel of LAB space."""
    if image is None or image.size == 0:
        return image
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    cl = clahe.apply(l)
    enhanced_lab = cv2.merge((cl, a, b))
    return cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

def apply_white_balance_gray_world(image: np.ndarray) -> np.ndarray:
    """Apply Gray World Assumption algorithm for White Balance correction."""
    if image is None or image.size == 0:
        return image
    
    b, g, r = cv2.split(image.astype(np.float32))
    
    # Calculate means of each channel
    mean_b = np.mean(b)
    mean_g = np.mean(g)
    mean_r = np.mean(r)
    
    # Target average is the overall mean
    mean_gray = (mean_b + mean_g + mean_r) / 3.0
    if mean_gray == 0:
        return image

    # Scale channels
    b = np.clip(b * (mean_gray / (mean_b + 1e-6)), 0, 255)
    g = np.clip(g * (mean_gray / (mean_g + 1e-6)), 0, 255)
    r = np.clip(r * (mean_gray / (mean_r + 1e-6)), 0, 255)
    
    return cv2.merge((b, g, r)).astype(np.uint8)

def apply_gamma_correction(image: np.ndarray, gamma: float = 1.0) -> np.ndarray:
    """Apply power-law gamma correction to adjust brightness."""
    if image is None or image.size == 0 or gamma == 1.0:
        return image
    
    inv_gamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
    return cv2.LUT(image, table)

def apply_bilateral_filtering(image: np.ndarray, d: int = 5, sigma_color: float = 50.0, sigma_space: float = 50.0) -> np.ndarray:
    """Apply bilateral filtering for edge-preserving smoothing (noise reduction)."""
    if image is None or image.size == 0:
        return image
    return cv2.bilateralFilter(image, d, sigma_color, sigma_space)

def normalize_image(image: np.ndarray) -> np.ndarray:
    """Normalize pixel intensities to [0, 1] range."""
    if image is None or image.size == 0:
        return image
    return image.astype(np.float32) / 255.0

def enhance_image(image: np.ndarray) -> np.ndarray:
    """
    Automatically enhance the image by combining:
    1. White Balance
    2. Dynamic Gamma Correction
    3. CLAHE
    4. Bilateral Denoising
    """
    if image is None or image.size == 0:
        return image
    
    # 1. White Balance
    img_wb = apply_white_balance_gray_world(image)
    
    # 2. Dynamic Gamma based on average brightness
    gray = cv2.cvtColor(img_wb, cv2.COLOR_BGR2GRAY)
    mean_val = np.mean(gray)
    if mean_val < 90:
        # Image is too dark, apply gamma < 1.0 to brighten (e.g. 0.75)
        img_gamma = apply_gamma_correction(img_wb, 0.75)
    elif mean_val > 180:
        # Image is too bright, apply gamma > 1.0 to darken (e.g. 1.3)
        img_gamma = apply_gamma_correction(img_wb, 1.3)
    else:
        img_gamma = img_wb
        
    # 3. CLAHE for contrast enhancement
    img_clahe = apply_clahe(img_gamma, clip_limit=2.0)
    
    # 4. Bilateral Filtering for subtle noise reduction without destroying edge details
    img_clean = apply_bilateral_filtering(img_clahe, d=5, sigma_color=30.0, sigma_space=30.0)
    
    return img_clean
