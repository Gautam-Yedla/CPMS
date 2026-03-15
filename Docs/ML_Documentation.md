# CPMS Machine Learning Documentation

## 1. Introduction
The Machine Learning (ML) component is the "Eyes" of the Car Parking Management System (CPMS). It leverages state-of-the-art Computer Vision and Generative AI to automate vehicle detection, parking spot occupancy monitoring, and security auditing. Unlike traditional systems, CPMS uses a hybrid approach to handle complex outdoor environments where physical parking markings may be missing or faded.

---

## 2. System Architecture
The ML pipeline follows a **Hybrid Detection & Reasoning** model:

1. **Object Detection Layer**: Uses **YOLOv8** for real-time identification of vehicles (cars, motorcycles, buses, trucks) and pedestrians.
2. **Cognitive Reasoning Layer**: Integrates **Advanced Large Multimodal Models (LMM)** to perform high-level spatial reasoning. This layer identifies "implied" parking spots based on the relative position of vehicles and environmental context.
3. **Zone Intelligence**: Utilizes geometric polygons to define parking zones and virtual tripwires (Line Zones) for counting entries and exits.

---

## 3. Technology Stack

### Artificial Intelligence & Vision
| Technology | Role |
| :--- | :--- |
| **YOLOv8 (Ultralytics)** | Fast, efficient object detection and multi-object tracking. |
| **Advanced LMM** | Multimodal reasoning for complex scene understanding and vacancy detection. |
| **OpenCV** | Core image processing and stream manipulation. |
| **Supervision** | High-level CV utilities for zone management and visual annotations. |

### Core Software Environment
- **Python 3.10+**: Main programming language.
- **NumPy & Pandas**: Data manipulation and numerical operations.
- **PyYAML**: Configuration management.
- **Dotenv**: Secure environment variable handling (API keys).

---

## 4. Data Acquisition & Preprocessing
The system supports multiple input streams:
- **RTSP Streams**: Direct connection to IP security cameras.
- **Local Webcams**: For testing and localized monitoring.
- **Static Media/Uploads**: Processing recorded video or images.

**Preprocessing Steps**:
- Frame resizing for model compatibility.
- Colorspace conversion (BGR to RGB).
- Image enhancement for low-light or weather-impacted scenes.

---

## 5. Detection & Tracking Pipeline
### Inference Loop
The `main.py` entry point runs a continuous inference loop:
1. **Capture**: Grabs the latest frame from `StreamHandler`.
2. **Detection**: Runs the Hybrid Detector to find vehicles and infer parking spaces.
3. **Verification**: Compares detections against defined `PolygonZones`.
4. **Tracking**: Maintains object IDs (if enabled) to ensure accurate entry/exit counts via `LineZones`.

---

## 6. Zone Management
The system utilizes geometric definitions stored in `configs/config.yaml`:
- **Polygon Zones**: Specific areas defined by coordinates. The system counts "triggering anchors" (usually the bottom-center of a vehicle) within these zones to determine occupancy.
- **Line Zones (Gates)**: Virtual lines that trigger an `in_count` or `out_count` when an object crosses them.
- **Capacity Logic**: Dynamically calculates `Available = Capacity - Occupancy`.

---

## 7. Hybrid AI Reasoning Integration
One of CPMS's most advanced features is the **LMM-Only/Hybrid** mode:
- **Challenge**: Traditional detectors fail when parking lines are not visible.
- **Solution**: The LMM analyzes the entire scene and "reasons" where cars should be parked. It identifies "available_space" as a type of entity, allowing the system to report vacancies in unmarked lots.
- **Persistence**: Results are mapped back to standard detection formats, enabling the use of common visualization tools.

---

## 8. Deployment & Execution
### Execution Workflow
1. **Environment Setup**: `start_ml_service.bat` automatically creates a virtual environment and installs dependencies from `requirements.txt`.
2. **Service Start**: Launches `api_bridge.py`, which hosts a local interface for the Backend to query the latest `status.json`.
3. **Data Linkage**: The pipeline writes real-time statistics to `data/processed/status.json`, which is then ingested by the backend API.

---

## 9. Visual Output & Analytics
The ML component produces several outputs:
- **Real-time Monitor**: An annotated CV2 window showing detections and occupancy stats ($Ongoing$).
- **Annotated Snapshots**: `annotated_result.jpg` is saved periodically for security audits.
- **Inference Metrics**: Latency (ms) and confidence scores are logged for performance monitoring.

---

## 10. Conclusion
The CPMS ML module provides a sophisticated and flexible AI layer. By combining the speed of YOLOv8 with the reasoning power of Advanced Large Multimodal Models, it achieves a high level of accuracy and adaptability, making it suitable for diverse university parking scenarios.
