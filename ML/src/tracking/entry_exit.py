import supervision as sv
import numpy as np
import logging

class GateManager:
    """
    Manages entry and exit gates using virtual lines.
    Tracks vehicle crossings and updates counts.
    """
    
    def __init__(self, config):
        self.config = config
        self.gates = []
        
        self.entry_count = 0
        self.exit_count = 0
        
        self._load_gates()
        
    def _load_gates(self):
        """Initializes LineZones from config."""
        gate_configs = self.config.get('gates', [])
        
        for gate_conf in gate_configs:
            start = gate_conf.get('start', [0, 0])
            end = gate_conf.get('end', [100, 100])
            gate_id = gate_conf.get('id', 'unknown')
            gate_type = gate_conf.get('type', 'entry') # 'entry' or 'exit'
            
            # Supervision LineZone
            line_start = sv.Point(start[0], start[1])
            line_end = sv.Point(end[0], end[1])
            
            line_zone = sv.LineZone(start=line_start, end=line_end)
            annotator = sv.LineZoneAnnotator(thickness=2, text_thickness=1)
            
            self.gates.append({
                'id': gate_id,
                'type': gate_type,
                'zone': line_zone,
                'annotator': annotator
            })
            
        logging.info(f"Loaded {len(self.gates)} gates.")

    def update(self, detections, frame):
        """
        Updates line crossing counts based on tracked detections.
        """
        for gate in self.gates:
            gate_zone = gate['zone']
            
            # Trigger line crossing check
            gate_zone.trigger(detections=detections)
            
            # Aggregate counts (LineZone tracks both IN and OUT directions relative to line vector)
            # Simplification: Assume 'in' direction of line is the desired flow
            # Or just sum both for total crossings if direction is ambiguous
            if gate['type'] == 'entry':
                 self.entry_count += gate_zone.in_count + gate_zone.out_count
            elif gate['type'] == 'exit':
                 self.exit_count += gate_zone.in_count + gate_zone.out_count

            # Annotate
            gate['annotator'].annotate(frame, line_counter=gate_zone)

    def get_stats(self):
        return {
            'total_entered': self.entry_count,
            'total_exited': self.exit_count
        }
