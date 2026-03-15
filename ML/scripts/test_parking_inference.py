import os
from ultralytics import YOLO
import cv2

def test_inference():
    # Load the trained model
    model_path = r'D:\CPMS\ML\models\checkpoints\parking-slots\best.pt'
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}")
        return

    print(f"Loading model from {model_path}...")
    model = YOLO(model_path)

    # Use a test image
    test_image_dir = r'D:\CPMS\ML\data\pklot_yolo\images\test'
    test_images = [f for f in os.listdir(test_image_dir) if f.endswith(('.jpg', '.png'))]
    
    if not test_images:
        print(f"Error: No test images found in {test_image_dir}")
        return

    test_image_path = os.path.join(test_image_dir, test_images[0])
    print(f"Running inference on {test_image_path}...")

    # Run inference
    results = model(test_image_path, conf=0.25)
    
    # Analyze and print results
    for r in results:
        boxes = r.boxes
        print("\n--- Detection Results ---")
        print(f"Total detections: {len(boxes)}")
        
        counts = {}
        for box in boxes:
            # Class ID and Name
            cls_id = int(box.cls[0])
            cls_name = model.names[cls_id]
            conf = float(box.conf[0])
            
            # Print individual prediction (comment out if too noisy for large images)
            # print(f"Detected: {cls_name} with confidence {conf:.2f}")
            
            counts[cls_name] = counts.get(cls_name, 0) + 1
            
        print("\nSummary:")
        for name, count in counts.items():
            print(f"- {name}: {count}")

        # Save annotated image
        output_dir = r'D:\CPMS\ML\results'
        os.makedirs(output_dir, exist_ok=True)
        
        # 'plot()' generates the BGR numpy array with drawn boxes
        annotated_frame = r.plot()
        
        output_path = os.path.join(output_dir, "test_prediction.jpg")
        cv2.imwrite(output_path, annotated_frame)
        print(f"\nSaved annotated image to {output_path}")

if __name__ == '__main__':
    test_inference()
