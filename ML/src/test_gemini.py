import cv2
import yaml
import os
from dotenv import load_dotenv
from detection.gemini_detector import GeminiDetector

# Load environment variables
load_dotenv()

def test_gemini():
    # 1. Load config
    config_path = 'configs/config.yaml'
    print(f"Loading config from {config_path}...")
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
        
    # 2. Initialize Detector
    print("Initializing Gemini...")
    detector = GeminiDetector(config)
    
    if not detector.client:
        print("Failed to initialize Gemini. Check GEMINI_API_KEY.")
        return
        
    # 3. Load test image
    image_path = config['input']['sources']['primary']['path']
    print(f"Loading test image from {image_path}...")
    
    if image_path.endswith(('.mp4', '.avi', '.mov')):
        cap = cv2.VideoCapture(image_path)
        ret, frame = cap.read()
        cap.release()
        if not ret:
            print("Failed to read frame from video.")
            return
    else:
        frame = cv2.imread(image_path)
        if frame is None:
             print("Failed to read image. Trying fallback...")
             frame = cv2.imread('data/raw/parking_lot.jpg')
             if frame is None:
                  print("Could not find any test image.")
                  return
                   
    # 4. Run Inference
    print(f"Running Gemini inference (model: {detector.model_name})...")
    print("This may take a few seconds with chain-of-thought reasoning...\n")
    results = detector.detect(frame)
    
    # 5. Summarize Results
    vehicles = [r for r in results if r['type'] in ('car', 'motorcycle', 'truck', 'bus', 'bicycle', 'occupied_slot')]
    spaces = [r for r in results if r['type'].endswith('_space') or r['type'] == 'empty_slot']
    
    print(f"{'='*60}")
    print(f"  DETECTION SUMMARY")
    print(f"{'='*60}")
    print(f"  Total detections: {len(results)}")
    print(f"  Vehicles found:   {len(vehicles)}")
    print(f"  Empty spaces:     {len(spaces)}")
    print(f"{'='*60}")
    
    # Vehicle breakdown
    if vehicles:
        print(f"\n  VEHICLES:")
        type_counts = {}
        for v in vehicles:
            t = v['type']
            type_counts[t] = type_counts.get(t, 0) + 1
        for t, c in sorted(type_counts.items()):
            print(f"    {t}: {c}")
    
    # Space breakdown
    if spaces:
        print(f"\n  FEASIBLE SPACES:")
        type_counts = {}
        for s in spaces:
            t = s['type']
            type_counts[t] = type_counts.get(t, 0) + 1
        for t, c in sorted(type_counts.items()):
            print(f"    {t}: {c}")
    
    print(f"\n  DETAILED RESULTS:")
    for i, r in enumerate(results):
        box = r['boundingBox']
        print(f"    [{i+1}] {r['type']:20s} conf={r['confidence']:.2f}  "
              f"box=({box['x']}, {box['y']}, {box['width']}x{box['height']})")

    # 6. Draw on image and save
    for r in results:
        box = r['boundingBox']
        x, y, w, h = box['x'], box['y'], box['width'], box['height']
        
        # Color by type
        dtype = r['type']
        if dtype.endswith('_space') or dtype == 'empty_slot':
            color = (0, 255, 0)  # Green for empty spaces
        elif dtype in ('car', 'occupied_slot'):
            color = (255, 0, 0)  # Blue for cars
        elif dtype in ('motorcycle', 'bicycle'):
            color = (0, 255, 255)  # Yellow for two-wheelers
        elif dtype in ('truck', 'bus'):
            color = (0, 0, 255)  # Red for large vehicles
        else:
            color = (255, 255, 255)  # White fallback
        
        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
        label = f"{r['type']} {r['confidence']:.2f}"
        cv2.putText(frame, label, (x, y - 5), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    
    # Save annotated result
    save_path = "data/processed/gemini_test_result.jpg"
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    cv2.imwrite(save_path, frame)
    print(f"\n  Annotated image saved to: {save_path}")
    
    cv2.imshow("Gemini Test", frame)
    print("Press any key to close the window...")
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    test_gemini()
