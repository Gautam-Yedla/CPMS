import json
import os
import time
import logging

class DataLogger:
    """
    Logs every detection made by the system for:
    - Historical analytics
    - Future prediction training
    - Audit logs
    """
    
    def __init__(self, config):
        self.config = config
        self.output_path = config.get('app', {}).get('history_log_path', 'data/processed/detections_history.jsonl')
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)
        logging.info(f"Data Logger initialized. Logging to {self.output_path}")

    def log_detections(self, detections, names):
        """
        Logs current detections to a JSONL file.
        Each line is a timestamped list of detections.
        """
        if detections is None or len(detections) == 0:
            return

        entry = {
            "timestamp": time.time(),
            "detections": []
        }

        # supervision.Detections attributes are numpy arrays
        # Extract: xyxy, confidence, class_id, tracker_id
        for i in range(len(detections.class_id)):
            det = {
                "class_name": names[int(detections.class_id[i])],
                "confidence": float(detections.confidence[i]),
                "bbox": detections.xyxy[i].tolist(),
                "tracker_id": int(detections.tracker_id[i]) if detections.tracker_id is not None else None
            }
            entry["detections"].append(det)

        with open(self.output_path, "a") as f:
            f.write(json.dumps(entry) + "\n")
