import cv2
import json
import numpy as np
import base64
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import os
import yaml
from dotenv import load_dotenv
from shapely.geometry import Polygon

# Load environment variables from .env file
load_dotenv()

# Import Gemini detector
from detection.gemini_detector import GeminiDetector

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load config
CONFIG_PATH = os.path.join(os.path.dirname(__file__), '../configs/config.yaml')
print(f"[DEBUG] Loading config from: {CONFIG_PATH}")
with open(CONFIG_PATH, 'r') as f:
    config = yaml.safe_load(f)
print("[DEBUG] Config loaded successfully.")

# ──────────────── MODEL INITIALIZATION ────────────────

# 1. Gemini Model (Primary — shown in UI)
gemini_model = None
try:
    if config.get('gemini', {}).get('enabled', False):
        gemini_model = GeminiDetector(config)
        print("[INIT] Gemini model initialized successfully.")
except ImportError:
    print("[INIT] Failed to import/initialize GeminiDetector (is google-genai installed?)")

# 2. Local YOLO Vehicle Model (yolo11l — for comparison logging)
vehicle_model = None
vehicle_model_path = os.path.join(os.path.dirname(__file__), '../', config['model']['path'])
if os.path.exists(vehicle_model_path):
    try:
        vehicle_model = YOLO(vehicle_model_path)
        print(f"[INIT] Local vehicle model loaded: {vehicle_model_path}")
    except Exception as e:
        print(f"[INIT] Failed to load vehicle model: {e}")
else:
    print(f"[INIT] Vehicle model not found at: {vehicle_model_path}")

# 3. Local Parking Model — PK-best.pt
pk_best_model = None
pk_best_path = os.path.join(os.path.dirname(__file__), '../models/checkpoints/parking-slots/PK-best.pt')
if os.path.exists(pk_best_path):
    try:
        pk_best_model = YOLO(pk_best_path)
        print(f"[INIT] PK-best parking model loaded: {pk_best_path}")
    except Exception as e:
        print(f"[INIT] Failed to load PK-best model: {e}")
else:
    print(f"[INIT] PK-best model not found at: {pk_best_path}")

# 4. Local Parking Model — best.pt
best_model = None
best_path = os.path.join(os.path.dirname(__file__), '../models/checkpoints/parking-slots/best.pt')
if os.path.exists(best_path):
    try:
        best_model = YOLO(best_path)
        print(f"[INIT] Best parking model loaded: {best_path}")
    except Exception as e:
        print(f"[INIT] Failed to load best model: {e}")
else:
    print(f"[INIT] Best model not found at: {best_path}")


# ──────────────── HELPER FUNCTIONS ────────────────

def run_gemini_detection(frame, detection_type):
    """Run Gemini detection and structure results.
    
    The improved Gemini detector returns:
    - Vehicle types: car, motorcycle, truck, bus, bicycle
    - Space types: car_space, motorcycle_space, large_vehicle_space
    - Legacy types via 'legacy_type' field for backward compatibility
    """
    start_time = time.time()
    vehicles = []
    slots = []
    occupied_count = 0
    available_count = 0
    is_parking_mode = detection_type in ['all', 'parking']
    is_vehicle_mode = detection_type in ['all', 'vehicles']

    if not gemini_model:
        logging.error("[GEMINI] Model not initialized.")
        return {"vehicles": [], "parking": None, "latency_ms": 0}

    gemini_results = gemini_model.detect(frame)
    slot_idx = 1

    # Vehicle sub-types and space sub-types from the new prompt
    vehicle_types = {'car', 'motorcycle', 'truck', 'bus', 'bicycle', 'occupied_slot'}
    space_types = {'car_space', 'motorcycle_space', 'large_vehicle_space', 'empty_slot'}
    
    # COCO class ID mapping for vehicle sub-types
    coco_class_map = {
        'car': 2, 'motorcycle': 3, 'bicycle': 1,
        'bus': 5, 'truck': 7, 'occupied_slot': 2
    }

    for det in gemini_results:
        det['source'] = 'gemini'
        dtype = det.get('type', '')
        legacy_type = det.get('legacy_type', dtype)

        if dtype in vehicle_types or legacy_type == 'occupied_slot':
            # This is a detected vehicle
            occupied_count += 1
            
            box = det.get('boundingBox', {})
            x, y, w, h = box.get('x', 0), box.get('y', 0), box.get('width', 0), box.get('height', 0)
            
            slots.append({
                "slotId": slot_idx,
                "status": "occupied",
                "vehicleType": dtype if dtype in vehicle_types else "unknown",
                "confidence": det.get('confidence', 0.5),
                "coordinates": [
                    {"x": x, "y": y},
                    {"x": x + w, "y": y},
                    {"x": x + w, "y": y + h},
                    {"x": x, "y": y + h}
                ]
            })
            
            if is_vehicle_mode:
                v_det = det.copy()
                v_det['type'] = dtype
                v_det['class_id'] = coco_class_map.get(dtype, 2)
                vehicles.append(v_det)
            
            slot_idx += 1
            
        elif dtype in space_types or legacy_type == 'empty_slot':
            # This is a feasible empty parking space
            available_count += 1
            
            box = det.get('boundingBox', {})
            x, y, w, h = box.get('x', 0), box.get('y', 0), box.get('width', 0), box.get('height', 0)
            
            slots.append({
                "slotId": slot_idx,
                "status": "empty",
                "spaceType": dtype if dtype in space_types else "car_space",
                "confidence": det.get('confidence', 0.5),
                "coordinates": [
                    {"x": x, "y": y},
                    {"x": x + w, "y": y},
                    {"x": x + w, "y": y + h},
                    {"x": x, "y": y + h}
                ]
            })
            slot_idx += 1

    total_slots = len(slots)
    latency = round((time.time() - start_time) * 1000, 1)

    parking_data = None
    if is_parking_mode and total_slots > 0:
        parking_data = {
            "totalSlots": total_slots,
            "occupied": occupied_count,
            "available": available_count,
            "slots": slots
        }

    return {"vehicles": vehicles, "parking": parking_data, "latency_ms": latency}


def run_local_yolo_model(model, model_name, frame, conf_threshold=0.25):
    """Run a local YOLO model and return structured results."""
    start_time = time.time()
    results_list = []

    if not model:
        return {"model": model_name, "detections": [], "count": 0, "latency_ms": 0, "error": "Model not loaded"}

    try:
        results = model.predict(frame, conf=conf_threshold, verbose=False)
        for r in results:
            boxes = r.boxes
            if boxes is not None:
                for i in range(len(boxes)):
                    box = boxes.xyxy[i].cpu().numpy()
                    conf = float(boxes.conf[i].cpu().numpy())
                    cls_id = int(boxes.cls[i].cpu().numpy())
                    cls_name = model.names.get(cls_id, f"class_{cls_id}")

                    results_list.append({
                        "type": cls_name,
                        "confidence": round(conf, 3),
                        "class_id": cls_id,
                        "boundingBox": {
                            "x": int(box[0]),
                            "y": int(box[1]),
                            "width": int(box[2] - box[0]),
                            "height": int(box[3] - box[1])
                        }
                    })
    except Exception as e:
        logging.error(f"[{model_name}] Inference failed: {e}")
        return {"model": model_name, "detections": [], "count": 0, "latency_ms": 0, "error": str(e)}

    latency = round((time.time() - start_time) * 1000, 1)
    return {
        "model": model_name,
        "detections": results_list,
        "count": len(results_list),
        "latency_ms": latency
    }


def compare_local_models(pk_result, best_result):
    """Compare results from PK-best and Best models and log differences."""
    comparison = {
        "pk_best": {
            "count": pk_result["count"],
            "latency_ms": pk_result["latency_ms"],
            "classes": {}
        },
        "best": {
            "count": best_result["count"],
            "latency_ms": best_result["latency_ms"],
            "classes": {}
        },
        "agreement": 0.0
    }

    # Count by class for each model
    for det in pk_result["detections"]:
        cls = det["type"]
        comparison["pk_best"]["classes"][cls] = comparison["pk_best"]["classes"].get(cls, 0) + 1

    for det in best_result["detections"]:
        cls = det["type"]
        comparison["best"]["classes"][cls] = comparison["best"]["classes"].get(cls, 0) + 1

    # Simple agreement metric: how similar are the total counts
    if pk_result["count"] > 0 or best_result["count"] > 0:
        max_count = max(pk_result["count"], best_result["count"])
        min_count = min(pk_result["count"], best_result["count"])
        comparison["agreement"] = round(min_count / max_count * 100, 1) if max_count > 0 else 100.0
    else:
        comparison["agreement"] = 100.0

    return comparison


# ──────────────── API ROUTES ────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "models": {
            "gemini": gemini_model is not None,
            "vehicle_yolo": vehicle_model is not None,
            "pk_best": pk_best_model is not None,
            "best": best_model is not None
        }
    })


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

    detection_type = data.get('detection_type', 'all')
    
    logging.info(f"{'='*60}")
    logging.info(f"[PROCESS] New frame — detection_type='{detection_type}', shape={frame.shape}")

    # ──── Run ALL models in parallel ────
    gemini_result = None
    pk_best_result = None
    best_result = None

    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {}

        # Always run Gemini (primary)
        futures['gemini'] = executor.submit(run_gemini_detection, frame, detection_type)

        # Always run local models for comparison logging
        pk_conf = config.get('parking_model', {}).get('conf_threshold', 0.25)
        futures['pk_best'] = executor.submit(run_local_yolo_model, pk_best_model, "PK-best", frame, pk_conf)
        futures['best'] = executor.submit(run_local_yolo_model, best_model, "Best", frame, pk_conf)

        for key, future in futures.items():
            try:
                if key == 'gemini':
                    gemini_result = future.result(timeout=60)
                elif key == 'pk_best':
                    pk_best_result = future.result(timeout=30)
                elif key == 'best':
                    best_result = future.result(timeout=30)
            except Exception as e:
                logging.error(f"[{key.upper()}] Model execution failed: {e}")

    # Fallback if any model failed
    if gemini_result is None:
        gemini_result = {"vehicles": [], "parking": None, "latency_ms": 0}
    if pk_best_result is None:
        pk_best_result = {"model": "PK-best", "detections": [], "count": 0, "latency_ms": 0, "error": "Execution failed"}
    if best_result is None:
        best_result = {"model": "Best", "detections": [], "count": 0, "latency_ms": 0, "error": "Execution failed"}

    # ──── Terminal Logging ────
    logging.info(f"[GEMINI]  Vehicles: {len(gemini_result['vehicles'])}, "
                 f"Parking: {gemini_result['parking']['totalSlots'] if gemini_result['parking'] else 'N/A'} slots, "
                 f"Latency: {gemini_result['latency_ms']}ms")

    logging.info(f"[PK-BEST] Detections: {pk_best_result['count']}, "
                 f"Classes: {', '.join(f'{k}={v}' for k, v in _count_classes(pk_best_result['detections']).items()) or 'none'}, "
                 f"Latency: {pk_best_result['latency_ms']}ms")

    logging.info(f"[BEST]    Detections: {best_result['count']}, "
                 f"Classes: {', '.join(f'{k}={v}' for k, v in _count_classes(best_result['detections']).items()) or 'none'}, "
                 f"Latency: {best_result['latency_ms']}ms")

    # Compare local models
    comparison = compare_local_models(pk_best_result, best_result)
    logging.info(f"[COMPARE] PK-best={pk_best_result['count']} vs Best={best_result['count']}, "
                 f"Agreement: {comparison['agreement']}%")
    logging.info(f"{'='*60}")

    # ──── Build response ────
    # UI gets only Gemini results; local_results stored in DB via backend
    
    # Explicit enforcement: ensure mode-specific filtering
    final_vehicles = gemini_result["vehicles"]
    final_parking = gemini_result["parking"]
    
    if detection_type == 'parking':
        final_vehicles = []  # Parking-only: no vehicle detections
    elif detection_type == 'vehicles':
        final_parking = None  # Vehicles-only: no parking data

    logging.info(f"[RESPONSE] detection_type='{detection_type}' → "
                 f"vehicles={len(final_vehicles)}, "
                 f"parking={'yes (' + str(final_parking['totalSlots']) + ' slots)' if final_parking else 'no'}")

    response = {
        "vehicles": final_vehicles,
        "parking": final_parking,
        "local_results": {
            "pk_best": pk_best_result,
            "best": best_result,
            "comparison": comparison
        }
    }

    return jsonify(response)


def _count_classes(detections):
    """Helper to count detections by class."""
    counts = {}
    for det in detections:
        cls = det.get("type", "unknown")
        counts[cls] = counts.get(cls, 0) + 1
    return counts


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"ML Bridge API starting on port {port}...")
    print(f"  Gemini:  {'Ready' if gemini_model else 'Disabled'}")
    print(f"  Vehicle: {'Ready' if vehicle_model else 'Not loaded'}")
    print(f"  PK-best: {'Ready' if pk_best_model else 'Not loaded'}")
    print(f"  Best:    {'Ready' if best_model else 'Not loaded'}")
    app.run(host='0.0.0.0', port=port)
