import cv2
import os
import time
import uuid
import logging

class DataCollector:
    """
    Collects frames for continuous training based on triggers:
    - Low detection confidence
    - Manual trigger (via backend/API)
    - Periodic sampling
    """
    
    def __init__(self, config):
        self.config = config
        self.output_dir = config.get('training', {}).get('collector_path', 'data/raw/new_samples')
        self.conf_threshold = config.get('training', {}).get('sampling_conf_threshold', 0.4)
        
        os.makedirs(self.output_dir, exist_ok=True)
        logging.info(f"Data Collector initialized. Saving samples to {self.output_dir}")

    def collect(self, frame, detections):
        """
        Inspects detections and saves the frame if it meets collection criteria.
        """
        should_collect = False
        
        # Criteria 1: Low confidence detections (uncertain samples)
        if hasattr(detections, 'confidence') and len(detections.confidence) > 0:
            min_conf = min(detections.confidence)
            if min_conf < self.conf_threshold:
                should_collect = True
                reason = f"low_conf_{min_conf:.2f}"
        
        # Criteria 2: Empty detections in active zones (potential missed vehicles)
        # (This would need zone context to be more effective)

        if should_collect:
            self._save_sample(frame, reason)

    def _save_sample(self, frame, reason):
        filename = f"sample_{int(time.time())}_{reason}_{uuid.uuid4().hex[:6]}.jpg"
        save_path = os.path.join(self.output_dir, filename)
        
        # Prevent spamming (throttle collection)
        # Check if we've saved something in the last 2 seconds
        # (Simple implementation: use static variable or class level timer)
        if not hasattr(self, '_last_save_time'):
            self._last_save_time = 0
            
        if time.time() - self._last_save_time > 2.0:
            cv2.imwrite(save_path, frame)
            self._last_save_time = time.time()
            logging.debug(f"Collected training sample: {filename}")
