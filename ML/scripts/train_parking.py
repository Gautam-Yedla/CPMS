# from ultralytics import YOLO
# import os

# if __name__ == '__main__':
#     # Initialize YOLO model from scratch using YOLOv11 small architecture for speed/accuracy balance
#     model = YOLO('yolo11n.pt') 

#     # Path to dataset configuration
#     data_yaml = r'D:\CPMS\ML\data\pklot_yolo\data.yaml'

#     print(f"Starting custom parking model training on {data_yaml}...")

#     # Train model
#     # Limiting to 5 epochs for relatively fast feedback - you can increase epochs later for better accuracy
#     results = model.train(
#         data=data_yaml,
#         epochs=5,
#         imgsz=640,
#         project=r'D:\CPMS\ML\models\training',
#         name='parking_native',
#         batch=16,
#         save=True
#     )
    
#     print("\nTraining completed!")
    
#     # After training, the best weights are saved in:
#     # D:\CPMS\ML\models\training\parking_native\weights\best.pt
    
#     import shutil
    
#     best_weights_src = r'D:\CPMS\ML\models\training\parking_native\weights\best.pt'
#     best_weights_dst = r'D:\CPMS\ML\models\checkpoints\parking-slots\best.pt'
    
#     os.makedirs(os.path.dirname(best_weights_dst), exist_ok=True)
    
#     if os.path.exists(best_weights_src):
#         # Move it to the API Bridge load path
#         shutil.copy(best_weights_src, best_weights_dst)
#         print(f"Custom model safely saved to {best_weights_dst}")
#         print("Ready for LIVE native dual-model inference!")
#     else:
#         print("Warning: expected best training weights not found. Check training logs.")









import os
import json
from ultralytics import YOLO

# ==========================================================
# CONFIGURATION
# ==========================================================
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # D:\CPMS
MODEL_PATH = os.path.join(BASE_DIR, r"ML\models\checkpoints\parking-slots\PK-best.pt")
SOURCE_PATH = os.path.join(BASE_DIR, r"ML\data\raw\Screenshot 2026-02-09 235514.png")
DATA_YAML = os.path.join(BASE_DIR, r"ML\data\pklot_yolo\data.yaml")
OUTPUT_DIR = os.path.join(BASE_DIR, r"ML\data\processed\PK_Test_Results")

os.makedirs(OUTPUT_DIR, exist_ok=True)

IMG_SIZE = 640
CONF_THRESHOLD = 0.25
RUN_VALIDATION = False                         # Set False if no labels
# ==========================================================


def main():

    print("Loading model...")
    model = YOLO(MODEL_PATH)

    print("Running inference...")
    results = model.predict(
        source=SOURCE_PATH,
        imgsz=IMG_SIZE,
        conf=CONF_THRESHOLD,
        save=True,
        save_txt=True,
        save_conf=True,
        save_json=True,
        project=OUTPUT_DIR,
        name="predictions",
        exist_ok=True
    )

    print("\nGenerating slot summary...")
    slot_summary = []

    for r in results:
        empty_count = 0
        occupied_count = 0

        if r.boxes is not None:
            for cls in r.boxes.cls:
                if int(cls) == 0:
                    empty_count += 1
                elif int(cls) == 1:
                    occupied_count += 1

        slot_summary.append({
            "image": r.path,
            "empty_slots": empty_count,
            "occupied_slots": occupied_count,
            "total_slots": empty_count + occupied_count
        })

    summary_path = os.path.join(OUTPUT_DIR, "slot_summary.json")
    with open(summary_path, "w") as f:
        json.dump(slot_summary, f, indent=4)

    print(f"Slot summary saved: {summary_path}")

    # ======================================================
    # VALIDATION (If labels exist)
    # ======================================================
    metrics_data = None

    if RUN_VALIDATION and os.path.exists(DATA_YAML):
        print("\nRunning validation for metrics...")
        try:
            metrics = model.val(
                data=DATA_YAML,
                split="test",
                imgsz=IMG_SIZE,
                conf=CONF_THRESHOLD,
                save_json=True
            )

            metrics_data = metrics.results_dict

            metrics_path = os.path.join(OUTPUT_DIR, "evaluation_metrics.json")
            with open(metrics_path, "w") as f:
                json.dump(metrics_data, f, indent=4)

            print(f"Metrics saved: {metrics_path}")

            print("\n=== FINAL METRICS ===")
            for k, v in metrics_data.items():
                print(f"{k}: {v}")
        except Exception as e:
            print(f"\nValidation failed: {e}")
            print("This usually happens when dataset labels are incompatible with the model task (e.g. Object Detection vs Segmentation).")

    print("\nProcess Completed Successfully.")
    print(f"All results saved inside: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()