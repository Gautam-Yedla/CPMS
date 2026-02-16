import cv2
import numpy as np
import logging

class FrameEnhancer:
    """
    Applies image enhancement techniques to improve detection quality
    under varying lighting conditions (shadows, low light).
    """
    
    def __init__(self, config):
        self.config = config.get('preprocessing', {})
        self.enable_clahe = self.config.get('enable_clahe', True)
        self.gamma = self.config.get('gamma_correction', 1.0)
        
        # CLAHE (Contrast Limited Adaptive Histogram Equalization) setup
        # Great for local contrast improvement (shadows)
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        
    def enhance(self, frame):
        """
        Applies enhancement pipeline: Normalize -> Gamma -> CLAHE (on V channel).
        """
        if frame is None:
            return None
            
        enhanced = frame.copy()
        
        # Gamma Correction
        if self.gamma != 1.0:
            invGamma = 1.0 / self.gamma
            table = np.array([((i / 255.0) ** invGamma) * 255
                              for i in np.arange(0, 256)]).astype("uint8")
            enhanced = cv2.LUT(enhanced, table)

        # CLAHE
        # We convert to LAB color space, apply CLAHE to L channel, then convert back
        if self.enable_clahe:
            lab = cv2.cvtColor(enhanced, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            l_enhanced = self.clahe.apply(l)
            lab_enhanced = cv2.merge((l_enhanced, a, b))
            enhanced = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
            
        return enhanced
