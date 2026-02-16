from ultralytics import YOLO
import torch
import logging

class VehicleDetector:
    """
    Detects vehicles using YOLOv8, returning bounding boxes and class IDs.
    Filters out non-vehicle classes.
    """
    
    def __init__(self, config):
        self.config = config
        self.classes = config.get('model', {}).get('classes', [2, 3, 5, 7]) # Default: Car, Bike, Bus, Truck
        self.conf_threshold = config.get('model', {}).get('conf_threshold', 0.5)
        self.iou_threshold = config.get('model', {}).get('iou_threshold', 0.5)
        self.max_det = config.get('model', {}).get('max_det', 300)
        
        # Load Model
        self.model_path = config.get('model', {}).get('path', 'yolov8n.pt')
        self.model_type = config.get('model', {}).get('type', 'standard') # 'standard', 'obb', 'v10'
        self.device = config.get('model', {}).get('device', 'cpu')
        
        try:
            logging.info(f"Loading YOLO model from {self.model_path} on {self.device}")
            self.model = YOLO(self.model_path)
            self.model.to(self.device)
            # Ensure model classes are available
            logging.info(f"Model classes: {self.model.names}")
        except Exception as e:
            logging.error(f"Failed to load model: {e}")
            raise e
            
    def detect(self, source_img):
        """
        Runs inference on the image.
        Returns detection results list.
        """
        try:
            # Handle different prediction types
            if self.model_type == 'obb':
                results = self.model.predict(source_img, 
                                             stream=True, 
                                             conf=self.conf_threshold, 
                                             iou=self.iou_threshold, 
                                             max_det=self.max_det, 
                                             classes=self.classes,
                                             obb=True,
                                             verbose=False)
            else:
                results = self.model.predict(source_img, 
                                             stream=True, 
                                             conf=self.conf_threshold, 
                                             iou=self.iou_threshold, 
                                             max_det=self.max_det, 
                                             classes=self.classes,
                                             verbose=False)
                                 
            # Return list of detections from generator
            return list(results)
            
        except Exception as e:
            logging.error(f"Inference failed: {e}")
            return []

if __name__ == "__main__":
    # Test code
    import cv2
    import numpy as np
    
    # Dummy config
    mock_config = {'model': {'path': 'yolov8n.pt', 'device': 'cpu'}}
    detector = VehicleDetector(mock_config)
    
    # Dummy image
    img = np.zeros((640, 640, 3), dtype=np.uint8)
    res = detector.detect(img)
    print("Detection done", len(res))
