import cv2
import time
import logging
import numpy as np
from preprocessing.enhancement import FrameEnhancer

class StreamHandler:
    """
    Handles video input from multiple sources with fail-safe logic.
    Supports RTSP, Video Files, Webcams, and Images.
    Includes built-in frame enhancement.
    """
    
    def __init__(self, config):
        self.config = config
        self.primary_source = config.get('input', {}).get('sources', {}).get('primary')
        self.fallback_source = config.get('input', {}).get('sources', {}).get('fallback')
        
        self.current_source = 'primary'
        self.cap = None
        self.enhancer = FrameEnhancer(config)
        
        # Initialize primary source
        self._initialize_source(self.primary_source)

    def _initialize_source(self, source_config):
        path = source_config.get('path', 0)
        source_type = source_config.get('type', 'webcam')
        
        logging.info(f"Connecting to {self.current_source} source: {path} ({source_type})")
        
        try:
            if source_type == 'image':
                self.static_image = cv2.imread(str(path))
                if self.static_image is None:
                    raise ConnectionError(f"Failed to load image at {path}")
                self.cap = None
            else:
                self.cap = cv2.VideoCapture(path)
                if not self.cap.isOpened():
                    raise ConnectionError(f"Failed to open {path}")
                
                # Set resolution if webcam
                if source_type in ['webcam', 'rtsp']:
                    self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.config['input']['width'])
                    self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config['input']['height'])
                self.static_image = None
                
        except Exception as e:
            logging.error(f"Error initializing source: {e}")
            self._switch_to_fallback()

    def _switch_to_fallback(self):
        if self.current_source == 'fallback':
            logging.critical("Both primary and fallback sources failed! Exiting.")
            return

        logging.warning("Primary source failed. Switching to fallback...")
        if self.cap:
            self.cap.release()
            
        self.current_source = 'fallback'
        self._initialize_source(self.fallback_source)

    def read(self):
        # Handle Static Image
        if self.static_image is not None:
            if not hasattr(self, '_image_read_once'):
                self._image_read_once = False
            
            if self._image_read_once:
                return False, None
                
            self._image_read_once = True
            return True, self.enhancer.enhance(cv2.resize(self.static_image, 
                                                         (self.config['input']['width'], 
                                                          self.config['input']['height'])))

        if not self.cap or not self.cap.isOpened():
            self._switch_to_fallback()
            if (not self.cap or not self.cap.isOpened()) and self.static_image is None:
                 return True, self._create_error_frame("ALL SOURCES UNAVAILABLE")
            if self.static_image is not None:
                return self.read() # Recursive call to use static image if fallback was image

        ret, frame = self.cap.read()
        
        if not ret:
            logging.warning(f"Failed to read frame from {self.current_source}.")
            if self.config['input']['sources']['primary']['type'] in ['rtsp', 'webcam']:
                 self._switch_to_fallback()
                 if self.cap:
                     ret, frame = self.cap.read()
                     if not ret:
                          return True, self._create_error_frame(f"{self.current_source.upper()} FAIL")
            else:
                 # Video file finished
                 return False, None

        if ret and frame is not None:
             # Resize
             target_w = self.config['input']['width']
             target_h = self.config['input']['height']
             resized = cv2.resize(frame, (target_w, target_h))
             
             # Enhance
             enhanced = self.enhancer.enhance(resized)
             return True, enhanced
             
        return True, self._create_error_frame("FRAME ERROR")

    def _create_error_frame(self, message):
        """Creates a black frame with an error message."""
        width = self.config['input']['width']
        height = self.config['input']['height']
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        cv2.putText(frame, message, (width // 4, height // 2), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 3)
        cv2.putText(frame, "Ensure video file is in data/raw/", (width // 4, height // 2 + 60), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        return frame

    def release(self):
        if self.cap:
            self.cap.release()
