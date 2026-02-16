import cv2
import yaml
import logging
import time
import argparse
import json
import os
import supervision as sv
import numpy as np
from ultralytics import YOLO

# Local Modules
from input_processing.stream_handler import StreamHandler
from detection.vehicle_detector import VehicleDetector
from zones.manager import ZoneManager 
from training.data_collector import DataCollector
from training.data_logger import DataLogger

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def main():
    parser = argparse.ArgumentParser(description="CPMS Level 1 - Main Pipeline")
    parser.add_argument('--config', type=str, default='configs/config.yaml', help='Path to config file')
    args = parser.parse_args()

    # Need absolute path mostly if running from different cwd
    config_path = args.config
    
    # Load Configuration
    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
    except Exception as e:
        logging.error(f"Failed to load config: {e}")
        return

    # 1. Initialize Input (includes Preprocessing/Enhancement)
    stream = StreamHandler(config)
    
    # 2. Initialize Model (Detection & Tracking)
    model = YOLO(config['model']['path'])
    
    # 2b. Initialize Training Tools
    collector = DataCollector(config)
    logger = DataLogger(config)
    
    # 3. Initialize Zone Manager (Polygon Zones)
    # We reconstruct this here to leverage supervision's optimized tools directly
    zones_list = config.get('zones', [])
    sv_zones = []
    
    for z in zones_list:
        points = np.array(z['coordinates'])
        # removed frame_resolution_wh argument
        polygon_zone = sv.PolygonZone(polygon=points, triggering_anchors=(sv.Position.BOTTOM_CENTER,))
        # removed text_scale, text_thickness
        annotator = sv.PolygonZoneAnnotator(
            zone=polygon_zone, 
            color=sv.Color.from_hex('#FF0000'), 
            thickness=2, 
            display_in_zone_count=True
        )
        sv_zones.append({
            'id': z['id'],
            'name': z['name'],
            'capacity': z['capacity'],
            'zone': polygon_zone,
            'annotator': annotator
        })

    # 4. Initialize Entry/Exit Gates (Line Zones)
    gate_list = config.get('gates', [])
    sv_gates = []
    total_entered = 0
    total_exited = 0
    
    for g in gate_list:
        start = sv.Point(g['start'][0], g['start'][1])
        end = sv.Point(g['end'][0], g['end'][1])
        line_zone = sv.LineZone(start=start, end=end)
        # removed text_scale, kept text_thickness if supported (it is)
        annotator = sv.LineZoneAnnotator(thickness=2, text_thickness=1)
        sv_gates.append({
            'id': g['id'],
            'type': g['type'],
            'zone': line_zone,
            'annotator': annotator
        })

    # Annotators
    # Create custom color palette based on config
    color_map_config = config['model'].get('color_map', {})
    # Map COCO indices to colors
    # 1:bicycle, 2:car, 3:motorcycle, 5:bus, 7:truck
    # Default to white if not found
    color_palette = sv.ColorPalette([
        sv.Color.from_hex(color_map_config.get('bicycle', '#FFFFFF')),    # index 0 in palette? No, ColorPalette is just a list.
        sv.Color.from_hex(color_map_config.get('car', '#FFFFFF')),
        sv.Color.from_hex(color_map_config.get('motorcycle', '#FFFFFF')),
        sv.Color.from_hex(color_map_config.get('bus', '#FFFFFF')),
        sv.Color.from_hex(color_map_config.get('truck', '#FFFFFF')),
    ])
    
    # Actually, a better way is to create a palette that matches class_ids or use custom_color_lookup
    # Since we only detect [1, 2, 3, 5, 7], we can create a palette where index matches class_id
    # Max index is 7, so need 8 colors
    full_colors = [sv.Color.from_hex('#FFFFFF')] * 8
    full_colors[1] = sv.Color.from_hex(color_map_config.get('bicycle', '#00FF00'))
    full_colors[2] = sv.Color.from_hex(color_map_config.get('car', '#0000FF'))
    full_colors[3] = sv.Color.from_hex(color_map_config.get('motorcycle', '#FFFF00'))
    full_colors[5] = sv.Color.from_hex(color_map_config.get('bus', '#FFA500'))
    full_colors[7] = sv.Color.from_hex(color_map_config.get('truck', '#FF0000'))
    
    custom_palette = sv.ColorPalette(colors=full_colors)

    box_annotator = sv.BoxAnnotator(
        thickness=2,
        color=custom_palette
    )
    # Added LabelAnnotator for drawing labels
    label_annotator = sv.LabelAnnotator(
        text_scale=0.5, 
        text_thickness=1,
        color=custom_palette
    )
    
    logging.info("Pipeline started. Press 'q' to quit.")

    # JSON Output Path
    status_path = config.get('app', {}).get('status_output_path', 'data/processed/status.json')
    os.makedirs(os.path.dirname(status_path), exist_ok=True)

    while True:
        success, frame = stream.read()
        if not success:
            break
            
        # 5. Inference & Tracking
        # persist=True enables the ByteTrack/BoT-SORT tracker
        results = model.track(frame, 
                              persist=True, 
                              conf=config['model']['conf_threshold'],
                              iou=config['model']['iou_threshold'],
                              imgsz=config['model'].get('imgsz', 640),
                              classes=config['model']['classes'],
                              verbose=False)[0]

        # Convert to supervision Detections
        detections = sv.Detections.from_ultralytics(results)
        
        # Ensure we have tracker IDs
        if results.boxes.id is not None:
             detections.tracker_id = results.boxes.id.cpu().numpy().astype(int)
        
        # 5b. Continuous Training - Data Collection
        collector.collect(frame, detections)
        logger.log_detections(detections, model.model.names)
        
        # 6. Process Logic
        
        # GATES (Entry/Exit)
        for gate in sv_gates:
            gate['zone'].trigger(detections=detections)
            # Annotate line
            gate['annotator'].annotate(frame=frame, line_counter=gate['zone'])
            
            # The LineZone in supervision maintains in_count and out_count
            # We assign these based on the gate type defined in config.yaml
            # If gate is an 'entry' gate, we look at crossings that incremented the in/out counters.
            # In simple terms, LineZone counts how many objects crossed in either direction.
            pass 
            
        
        # ZONES (Occupancy)
        zone_status = []
        for zone_item in sv_zones:
            zone_obj = zone_item['zone']
            zone_obj.trigger(detections=detections)
            zone_item['annotator'].annotate(scene=frame)
            
            occupancy = zone_obj.current_count
            capacity = zone_item['capacity']
            availability = max(0, capacity - occupancy)
            
            # Draw custom text
            cv2.putText(frame, f"{zone_item['name']}: {occupancy}/{capacity}", 
                        (int(zone_obj.polygon[0][0]), int(zone_obj.polygon[0][1] - 10)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            zone_status.append({
                'id': zone_item['id'],
                'name': zone_item['name'],
                'occupancy': int(occupancy),
                'capacity': int(capacity),
                'available': int(availability)
            })

        # 7. Visualization
        labels = []
        if detections.tracker_id is not None:
            labels = [
                f"#{tracker_id} {model.model.names[class_id]} {confidence:0.2f}"
                for confidence, class_id, tracker_id
                in zip(detections.confidence, detections.class_id, detections.tracker_id)
            ]
        
        # Separate annotate calls
        frame = box_annotator.annotate(scene=frame, detections=detections)
        frame = label_annotator.annotate(scene=frame, detections=detections, labels=labels)
        
        last_valid_frame = frame.copy()
        
        # 8. Output Status (JSON)
        # Gather stats from all gates
        entry_stats = sum([g['zone'].in_count for g in sv_gates if g['type'] == 'entry']) + \
                      sum([g['zone'].out_count for g in sv_gates if g['type'] == 'entry'])
        
        exit_stats = sum([g['zone'].in_count for g in sv_gates if g['type'] == 'exit']) + \
                     sum([g['zone'].out_count for g in sv_gates if g['type'] == 'exit'])

        system_status = {
            'timestamp': time.time(),
            'zones': zone_status,
            'gates': {
                'total_entered': int(entry_stats), 
                'total_exited': int(exit_stats)
            }
        }
        
        with open(status_path, 'w') as f:
            json.dump(system_status, f)

        # Display
        try:
             cv2.imshow("CPMS Level 1 Monitor", frame)
             if cv2.waitKey(1) & 0xFF == ord('q'):
                 break
        except:
             pass

    # Save final frame if it's an image for easier checking
    if (stream.static_image is not None or config['app'].get('save_annotated_video', False)) and 'last_valid_frame' in locals():
        save_dir = os.path.abspath(os.path.dirname(status_path))
        save_path = os.path.join(save_dir, "annotated_result.jpg")
        cv2.imwrite(save_path, last_valid_frame)
        logging.info(f"Annotated result saved to: {save_path}")

    stream.release()
    cv2.destroyAllWindows()
    logging.info("Pipeline stopped.")

if __name__ == "__main__":
    main()
