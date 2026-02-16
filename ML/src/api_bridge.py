import cv2
import json
import numpy as np
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import yaml
import os

app = Flask(__name__)
CORS(app)

# Load config
CONFIG_PATH = os.path.join(os.path.dirname(__file__), '../configs/config.yaml')
print(f"[DEBUG] Loading config from: {CONFIG_PATH}")
with open(CONFIG_PATH, 'r') as f:
    config = yaml.safe_load(f)
print("[DEBUG] Config loaded successfully.")

# Load Model
print(f"[DEBUG] Loading model from: {os.path.join(os.path.dirname(__file__), '../', config['model']['path'])}")
model = YOLO(os.path.join(os.path.dirname(__file__), '../', config['model']['path']))
print("[DEBUG] Model loaded successfully.")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "model": config['model']['path']})

@app.route('/process_frame', methods=['POST'])
def process_frame():
    data = request.json
    if not data or 'image' not in data:
        return jsonify({"error": "No image data provided"}), 400

    # Decode base64 image
    try:
        img_data = base64.b64decode(data['image'])
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        return jsonify({"error": f"Failed to decode image: {str(e)}"}), 400

    # Inference
    results = model.predict(
        frame,
        conf=config['model']['conf_threshold'],
        iou=config['model']['iou_threshold'],
        imgsz=config['model'].get('imgsz', 640),
        classes=config['model']['classes'],
        verbose=False
    )[0]

    # Format results
    detections = []
    for box in results.boxes:
        coords = box.xyxy[0].tolist()
        conf = float(box.conf[0])
        cls = int(box.cls[0])
        name = model.names[cls]
        
        detections.append({
            "bbox": coords,
            "confidence": conf,
            "class": name,
            "class_id": cls
        })

    return jsonify({
        "detections": detections,
        "count": len(detections),
        "timestamp": data.get('timestamp')
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"ML Bridge API starting on port {port}...")
    app.run(host='0.0.0.0', port=port)
