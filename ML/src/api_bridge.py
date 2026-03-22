import cv2
import json
import numpy as np
import base64
import logging
import time
import os
import sys
from typing import Any, Dict, List, Optional, Union
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from shapely.geometry import Polygon

try:
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False
    print("[WARN] ultralytics (YOLO) not found. Local models will be disabled.")

# Ensure the 'src' directory is in sys.path for Vercel/Serverless module discovery
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Load environment variables from .env file
load_dotenv()

# Import Gemini detector
try:
    from detection.gemini_detector import GeminiDetector
except ImportError:
    GeminiDetector = None
    print("[INIT] Failed to import GeminiDetector (is google-genai installed?)")

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load config
CONFIG_PATH = os.path.join(current_dir, '../configs/config.yaml')
logging.info(f"[DEBUG] Loading config from: {CONFIG_PATH}")

try:
    import yaml
    with open(CONFIG_PATH, 'r') as f:
        config = yaml.safe_load(f)
    logging.info("[DEBUG] Config loaded successfully.")
except Exception as e:
    logging.error(f"[ERROR] Failed to load config: {e}")
    config = {
        'gemini': {'enabled': True, 'model_name': 'gemini-1.5-flash'},
        'model': {'path': 'models/best.pt'}
    }

# ──────────────── MODEL INITIALIZATION ────────────────

gemini_model = None
try:
    if config.get('gemini', {}).get('enabled', False) and GeminiDetector:
        gemini_model = GeminiDetector(config)
        print("[INIT] Gemini model initialized successfully.")
except Exception as e:
    print(f"[INIT] Failed to initialize Gemini model: {e}")

vehicle_model = None
vehicle_model_path = os.path.join(current_dir, '../', config.get('model', {}).get('path', 'models/best.pt'))
if HAS_YOLO and os.path.exists(vehicle_model_path):
    try:
        vehicle_model = YOLO(vehicle_model_path)
        print(f"[INIT] Local vehicle model loaded: {vehicle_model_path}")
    except Exception as e:
        print(f"[INIT] Failed to load vehicle model: {e}")

pk_best_model = None
pk_best_path = os.path.join(current_dir, '../models/checkpoints/parking-slots/PK-best.pt')
if HAS_YOLO and os.path.exists(pk_best_path):
    try:
        pk_best_model = YOLO(pk_best_path)
        print(f"[INIT] PK-best parking model loaded: {pk_best_path}")
    except Exception as e:
        print(f"[INIT] Failed to load PK-best model: {e}")

best_model = None
best_path = os.path.join(current_dir, '../models/checkpoints/parking-slots/best.pt')
if HAS_YOLO and os.path.exists(best_path):
    try:
        best_model = YOLO(best_path)
        print(f"[INIT] Best parking model loaded: {best_path}")
    except Exception as e:
        print(f"[INIT] Failed to load best model: {e}")


# ──────────────── HELPER FUNCTIONS ────────────────

def _count_classes(detections: Any) -> Dict[str, int]:
    """Helper to count detections by class."""
    counts = {}
    if not isinstance(detections, list):
        return counts
    for det in detections:
        if isinstance(det, dict):
            cls = str(det.get("type", "unknown"))
            counts[cls] = counts.get(cls, 0) + 1
    return counts

def run_gemini_detection(frame: Any, detection_type: str) -> Dict[str, Any]:
    """Run Gemini detection and structure results."""
    start_time = time.time()
    vehicles = []
    slots = []
    occupied_count = 0
    available_count = 0
    is_parking_mode = detection_type in ['all', 'parking']
    is_vehicle_mode = detection_type in ['all', 'vehicles']

    if not gemini_model:
        return {"vehicles": [], "parking": None, "latency_ms": 0}

    try:
        gemini_results = gemini_model.detect(frame)
    except Exception as e:
        logging.error(f"[GEMINI] Detection failed: {e}")
        return {"vehicles": [], "parking": None, "latency_ms": 0, "error": str(e)}

    slot_idx = 1
    vehicle_types = {'car', 'motorcycle', 'truck', 'bus', 'bicycle', 'occupied_slot'}
    space_types = {'car_space', 'motorcycle_space', 'large_vehicle_space', 'empty_slot'}
    coco_class_map = {'car': 2, 'motorcycle': 3, 'bicycle': 1, 'bus': 5, 'truck': 7, 'occupied_slot': 2}

    for det in gemini_results:
        dtype = str(det.get('type', ''))
        legacy_type = str(det.get('legacy_type', dtype))
        box = det.get('boundingBox', {})
        x, y, w, h = int(box.get('x', 0)), int(box.get('y', 0)), int(box.get('width', 0)), int(box.get('height', 0))

        if dtype in vehicle_types or legacy_type == 'occupied_slot':
            occupied_count += 1
            slots.append({
                "slotId": slot_idx, "status": "occupied", 
                "vehicleType": dtype if dtype in vehicle_types else "unknown",
                "confidence": float(det.get('confidence', 0.5)),
                "coordinates": [{"x": x, "y": y}, {"x": x + w, "y": y}, {"x": x + w, "y": y + h}, {"x": x, "y": y + h}]
            })
            if is_vehicle_mode:
                v_det = det.copy()
                v_det['class_id'] = coco_class_map.get(dtype, 2)
                vehicles.append(v_det)
            slot_idx += 1
        elif dtype in space_types or legacy_type == 'empty_slot':
            available_count += 1
            slots.append({
                "slotId": slot_idx, "status": "empty",
                "spaceType": dtype if dtype in space_types else "car_space",
                "confidence": float(det.get('confidence', 0.5)),
                "coordinates": [{"x": x, "y": y}, {"x": x + w, "y": y}, {"x": x + w, "y": y + h}, {"x": x, "y": y + h}]
            })
            slot_idx += 1

    latency = (time.time() - start_time) * 1000.0
    parking_data = None
    if is_parking_mode and len(slots) > 0:
        parking_data = {"totalSlots": len(slots), "occupied": occupied_count, "available": available_count, "slots": slots}

    return {"vehicles": vehicles, "parking": parking_data, "latency_ms": latency}

def run_local_yolo_model(model: Any, model_name: str, frame: Any, conf_threshold: float = 0.25) -> Dict[str, Any]:
    """Run a local YOLO model and return structured results."""
    start_time = time.time()
    results_list = []
    if not model or not HAS_YOLO:
        return {"model": model_name, "detections": [], "count": 0, "latency_ms": 0.0, "error": "Model not loaded"}

    try:
        results = model.predict(frame, conf=conf_threshold, verbose=False)
        for r in results:
            boxes = r.boxes
            if boxes is not None:
                for i in range(len(boxes)):
                    box = boxes.xyxy[i].cpu().numpy()
                    conf = float(boxes.conf[i].cpu().numpy())
                    cls_id = int(boxes.cls[i].cpu().numpy())
                    cls_name = str(model.names.get(cls_id, f"class_{cls_id}"))
                    results_list.append({
                        "type": cls_name, "confidence": conf, "class_id": cls_id,
                        "boundingBox": {"x": int(box[0]), "y": int(box[1]), "width": int(box[2] - box[0]), "height": int(box[3] - box[1])}
                    })
    except Exception as e:
        logging.error(f"[{model_name}] Inference failed: {e}")
        return {"model": model_name, "detections": [], "count": 0, "latency_ms": 0.0, "error": str(e)}

    return {"model": model_name, "detections": results_list, "count": len(results_list), "latency_ms": (time.time() - start_time) * 1000.0}

def compare_local_models(pk_result: Any, best_result: Any) -> Dict[str, Any]:
    """Compare results from PK-best and Best models and log differences."""
    p_res = pk_result if isinstance(pk_result, dict) else {}
    b_res = best_result if isinstance(best_result, dict) else {}
    pk_count = int(p_res.get("count", 0))
    best_count = int(b_res.get("count", 0))
    
    agreement = 100.0
    if pk_count > 0 or best_count > 0:
        max_cnt = max(pk_count, best_count)
        min_cnt = min(pk_count, best_count)
        agreement = (float(min_cnt) / float(max_cnt)) * 100.0

    return {
        "pk_best": {"count": pk_count, "latency_ms": p_res.get("latency_ms", 0.0), "classes": _count_classes(p_res.get("detections", []))},
        "best": {"count": best_count, "latency_ms": b_res.get("latency_ms", 0.0), "classes": _count_classes(b_res.get("detections", []))},
        "agreement": round(agreement, 1)
    }


# ──────────────── API ROUTES ────────────────

@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "CPMS ML Bridge API is running", "version": "1.0.0"})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "models": {"gemini": gemini_model is not None, "pk_best": pk_best_model is not None, "best": best_model is not None}})

@app.route('/process_frame', methods=['POST'])
def process_frame():
    data = request.json
    if not data or 'image' not in data:
        return jsonify({"error": "No image data provided"}), 400

    try:
        img_data = base64.b64decode(data['image'])
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        return jsonify({"error": f"Failed to decode image: {str(e)}"}), 400

    detection_type = str(data.get('detection_type', 'all'))
    logging.info(f"[PROCESS] New frame — type='{detection_type}', shape={frame.shape}")

    gemini_res = None
    pk_res = None
    b_res = None

    with ThreadPoolExecutor(max_workers=3) as executor:
        f_gemini = executor.submit(run_gemini_detection, frame, detection_type)
        pk_conf = float(config.get('parking_model', {}).get('conf_threshold', 0.25))
        f_pk = executor.submit(run_local_yolo_model, pk_best_model, "PK-best", frame, pk_conf)
        f_b = executor.submit(run_local_yolo_model, best_model, "Best", frame, pk_conf)

        try:
            gemini_res = f_gemini.result(timeout=60)
            pk_res = f_pk.result(timeout=30)
            b_res = f_b.result(timeout=30)
        except Exception as e:
            logging.error(f"[ERROR] Parallel execution failed: {e}")

    # Final safe extraction
    g_res = gemini_res if gemini_res else {"vehicles": [], "parking": None, "latency_ms": 0.0}
    p_res = pk_res if pk_res else {"model": "PK-best", "detections": [], "count": 0, "latency_ms": 0.0}
    best_res = b_res if b_res else {"model": "Best", "detections": [], "count": 0, "latency_ms": 0.0}
    comp_data = compare_local_models(p_res, best_res)

    # Filtering for response
    final_vehicles = g_res.get('vehicles', [])
    final_parking = g_res.get('parking')
    if detection_type == 'parking': final_vehicles = []
    elif detection_type == 'vehicles': final_parking = None

    logging.info(f"[RESPONSE] vehicles={len(final_vehicles)}, parking={'yes' if final_parking else 'no'}, agreement={comp_data['agreement']}%")

    return jsonify({"vehicles": final_vehicles, "parking": final_parking, "local_results": {"pk_best": p_res, "best": best_res, "comparison": comp_data}})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"ML Bridge API starting on port {port}...")
    app.run(host='0.0.0.0', port=port)
