import yaml
import logging
from shapely.geometry import Polygon, Point

class ZoneManager:
    """
    Manages logical parking zones defined as polygons.
    
    Responsibilities:
    - Loads zone definitions (polygon coordinates) from config.
    - Checks if a tracked vehicle (point/box) is inside a specific zone.
    - Maintains separate counts for each zone (car, bike).
    """
    
    def __init__(self, config_path):
        self.config_path = config_path
        self.zones = {}
        
        self.load_zones()
        
    def load_zones(self):
        """
        Parses the configuration file and creates Polygon objects for each zone.
        """
        try:
            with open(self.config_path, 'r') as f:
                config_data = yaml.safe_load(f)
                
            zone_list = config_data.get('zones', [])
            
            for z in zone_list:
                zone_id = z.get('id')
                coords = z.get('coordinates', []) # List of [x, y]
                capacity = z.get('capacity', 0)
                
                if not zone_id or not coords:
                    continue
                    
                # Creating Polygon object for efficient containment check
                poly = Polygon(coords)
                
                self.zones[zone_id] = {
                    'name': z.get('name'),
                    'polygon': poly,
                    'capacity': capacity,
                    'count_car': 0,
                    'count_bike': 0,
                    'type': z.get('type', 'general')
                }
            
            logging.info(f"Loaded {len(self.zones)} zones from config.")
            
        except FileNotFoundError:
            logging.error(f"Config file not found: {self.config_path}")
        except yaml.YAMLError as exc:
            logging.error(f"Error parsing YAML: {exc}")

    def update_occupancy(self, detections):
        """
        Updates zone counts based on detection results.
        
        Args:
            detections: List of [x1, y1, x2, y2, track_id, class_id]
        Currently a simple count reset per frame is used for stateless validation.
        For tracking, we'd need ID persistence, but for simple occupancy:
        Count vehicles IN zone per frame.
        """
        
        # Reset counts for this frame update
        for zid in self.zones:
            self.zones[zid]['count_car'] = 0
            self.zones[zid]['count_bike'] = 0
            
        for detection in detections:
             # Detection format might vary based on tracker output
             # Assuming [x1, y1, x2, y2, id, class_id] or similar
             # If using supervision: detections.xyxy
             
             x1, y1, x2, y2 = detection[:4]
             class_id = int(detection[5])
             
             # Calculate center point for accurate zone assignment
             center_x = (x1 + x2) / 2
             center_y = (y1 + y2) / 2
             point = Point(center_x, center_y)
             
             # Check which zone it falls into
             for zid, zone_data in self.zones.items():
                 if zone_data['polygon'].contains(point):
                     if class_id == 2: # Car (COCO)
                         self.zones[zid]['count_car'] += 1
                     elif class_id == 3: # Motorcycle (COCO)
                         self.zones[zid]['count_bike'] += 1
                     # Assuming no overlap or first-match priority
                     break

    def get_status(self):
        """
        Returns a dictionary or JSON-serializable structure of current status.
        """
        status = {}
        for zid, data in self.zones.items():
            total = data['count_car'] + data['count_bike']
            status[zid] = {
                'name': data['name'],
                'occupancy': total,
                'capacity': data['capacity'],
                'available': max(0, data['capacity'] - total),
                'details': {
                    'cars': data['count_car'],
                    'bikes': data['count_bike']
                }
            }
        return status
