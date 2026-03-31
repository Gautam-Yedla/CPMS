import os
import io
import json
import re
import logging
import time
import cv2
from PIL import Image
from google import genai
from google.genai import types

class VisionAIDetector:
    """
    Detects vehicles and infers feasible empty parking spaces using
    Cloud-based Vision AI API.
    
    Designed for UNMARKED parking lots — no painted lines or slot markings.
    Uses spatial reasoning to identify gaps where a vehicle could park.
    """
    def __init__(self, config):
        self.config = config
        self.api_key = os.environ.get("VISION_AI_API_KEY") or config.get("vision_ai", {}).get("api_key")
        self.model_name = config.get("vision_ai", {}).get("model_name", "gemini-2.0-flash")
        self.max_image_dim = config.get("vision_ai", {}).get("max_image_dimension", 2048)
        self.enable_thinking = config.get("vision_ai", {}).get("enable_thinking", True)
        
        # Build zone context string from config
        self.zone_context = self._build_zone_context(config)
        
        if not self.api_key:
            logging.warning("VISION_AI_API_KEY is not set. VisionAIDetector will be disabled.")
            self.client = None
        else:
            try:
                logging.info(f"Initializing Vision AI Client with model: {self.model_name}")
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logging.error(f"Failed to initialize Vision AI Client: {e}")
                self.client = None

        # --- REFINED SYSTEM INSTRUCTION ---
        self.system_instruction = """You are a highly precise autonomous parking lot analyst. Your objective is to perform deep spatial reasoning on surveillance images to map a parking environment, especially in lots with UNMARKED SPACES (no painted lines).

═══════════════════════════════════════
DETECTION OBJECTIVES
═══════════════════════════════════════

        # 1. IDENTIFY ALL PARKED VEHICLES:
        #    - This includes cars, motorcycles, trucks, buses, and bicycles.
        #    - For heavily crowded areas, distinguish between overlapping vehicles.
        #    - Use shadow patterns and tire positions to confirm vehicle existence in low-contrast, dark, or dirt areas.
        # 
        # 2. INFER ALL FEASIBLE EMPTY SLOTS (THE 'CAPACITY' RULE):
        #    - In unmarked lots, you must identify every single spot where a vehicle COULD fit without blocking access.
        #    - MANDATORY SUBDIVISION: If you detect an open area that can fit more than one vehicle, DO NOT return a single large box. You must subdivide it into multiple adjacent `car_space` or `motorcycle_space` boxes. 
        #    - AGGRESSIVE FOREGROUND DETECTION: Treat large open areas in the foreground (even if they looks like clearings or dirt paths) as feasible parking unless they are significantly narrow or blocked. Populate wide open foregrounds with a row of `car_space` detections.
        #    - Example: If an empty area can fit 3 cars, you MUST return 3 separate `car_space` JSON objects.
        #    - A area is FEASIBLE if:
        #      ✓ it is on a paved, gravel, or well-trodden dirt surface (if vehicles are already parked there, it is a valid surface).
        #      ✓ it is large enough (use parked vehicles as a size reference).
        #      ✓ it follows the orientation and alignment of nearby parked vehicles to create orderly rows.
        #      ✓ it provides clear ingress/egress.
        #    - A area is NOT FEASIBLE if:
        #      ✗ it is a narrow strictly-defined driving lane or exit/entry bottleneck.
        #      ✗ it contains a permanent obstacle.
        #      ✗ it is a soft garden, grass patch, or pedestrian-only zone.
        # 
        # ═══════════════════════════════════════
        # SPATIAL REASONING LOGIC
        # ═══════════════════════════════════════
        # 
        # - SCALE REFERENCE: Use the largest detected vehicle (e.g., a car) to estimate the dimensions of a `car_space`. Use it to "measure" the surrounding empty ground.
        # - GRID-BASED FILLING: For an empty dirt/gravel area, fill it with a grid of `car_space` boxes that match the angle of the nearest parked car.
        # - PERSPECTIVE: If the image is at a low angle, ensure boxes further away are smaller, following the lines of perspective.
        # - UNCERTAINTY: If a vehicle is 70% visible at the boundary, detect it but mark confidence lower (~0.6).

═══════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════
- Use a 1000x1000 normalized grid for bounding boxes.
- Return a JSON array where each object strictly follows the defined schema.
- Be extremely thorough; missing a vehicle is a critical failure. Identify every possible parking opportunity."""

    def _build_zone_context(self, config):
        """Build a text description of configured parking zones for prompt context."""
        zones = config.get('zones', [])
        if not zones:
            return ""
        
        parts = ["Known parking zones in this lot:"]
        for z in zones:
            parts.append(f"  - {z.get('name', 'Unknown')} (capacity ~{z.get('capacity', '?')} vehicles, type: {z.get('type', 'general')})")
        return "\n".join(parts)

    def _preprocess_image(self, image_np):
        """Enhance and resize image for optimal Vision AI analysis."""
        h, w = image_np.shape[:2]
        
        # Resize if too large (saves API bandwidth, improves speed)
        max_dim = self.max_image_dim
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            new_w, new_h = int(w * scale), int(h * scale)
            image_np = cv2.resize(image_np, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
        # Apply CLAHE for better contrast (helps in shadows/low-light)
        lab = cv2.cvtColor(image_np, cv2.COLOR_BGR2LAB)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        lab[:, :, 0] = clahe.apply(lab[:, :, 0])
        enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        
        return enhanced

    def detect(self, image_np, retry_count=2):
        """
        Runs inference on the provided image (NumPy array).
        Returns a list of parsed detection dictionaries.
        """
        if not self.client:
            logging.error("Vision AI client is not initialized.")
            return []

        # Preprocess for better detection
        processed = self._preprocess_image(image_np)
        original_h, original_w = image_np.shape[:2]
        
        # Convert to PIL
        img_rgb = cv2.cvtColor(processed, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(img_rgb)
        
        # Build the user prompt with optional zone context
        user_prompt = "Analyze this parking lot image. Detect ALL parked vehicles and ALL feasible empty parking spaces."
        if self.zone_context:
            user_prompt += f"\n\nAdditional context:\n{self.zone_context}"
        user_prompt += "\n\nReturn ONLY the JSON array — no explanation, no markdown."
        
        # --- NEW: JSON SCHEMA FOR ACCURACY ---
        schema = {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": [
                            "car", "motorcycle", "truck", "bus", "bicycle",
                            "car_space", "motorcycle_space", "large_vehicle_space"
                        ]
                    },
                    "confidence": {"type": "number"},
                    "boundingBox": {
                        "type": "object",
                        "properties": {
                            "ymin": {"type": "integer"},
                            "xmin": {"type": "integer"},
                            "ymax": {"type": "integer"},
                            "xmax": {"type": "integer"}
                        },
                        "required": ["ymin", "xmin", "ymax", "xmax"]
                    }
                },
                "required": ["type", "confidence", "boundingBox"]
            }
        }

        # Configure generation
        generation_config = types.GenerateContentConfig(
            temperature=0.0,  # Max consistency
            response_mime_type="application/json",
            response_schema=schema,
            system_instruction=self.system_instruction,
        )
        
        # Increase thinking budget for Gemini 2.0 Flash
        if self.enable_thinking:
            try:
                generation_config.thinking_config = types.ThinkingConfig(
                    thinking_budget=4096  # Doubled for more complex spatial analysis
                )
            except Exception:
                pass

        # Retry loop
        for attempt in range(retry_count + 1):
            try:
                start_time = time.time()
                
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=[pil_img, user_prompt],
                    config=generation_config
                )
                
                elapsed = round((time.time() - start_time) * 1000, 1)
                
                # Parse response
                detections = self._parse_response(response.text, original_w, original_h)
                
                # Log summary
                vehicles = [d for d in detections if d['type'] in ('car', 'motorcycle', 'truck', 'bus', 'bicycle')]
                spaces = [d for d in detections if d['type'].endswith('_space')]
                logging.info(
                    f"[VISION_AI] Detected {len(vehicles)} vehicles, {len(spaces)} feasible spaces "
                    f"({elapsed}ms, attempt {attempt + 1})"
                )
                
                return detections
                
            except Exception as e:
                import traceback
                error_detail = traceback.format_exc()
                logging.error(f"[VISION_AI] Attempt {attempt + 1} failed: {e}")
                logging.debug(f"[VISION_AI] Stack trace: {error_detail}")
                if attempt < retry_count:
                    time.sleep(1)  # Brief pause before retry
                    continue
                return []

    def _parse_response(self, text_response, img_w, img_h):
        """Parse the JSON response and convert bounding boxes to pixel coordinates."""
        # Clean response
        text_response = text_response.replace('```json', '').replace('```', '').strip()
        
        try:
            detections = json.loads(text_response)
        except json.JSONDecodeError:
            logging.warning("Initial JSON parse failed. Attempting repair.")
            # Truncate at the last valid bracket
            last_bracket = text_response.rfind(']')
            if last_bracket != -1:
                text_response = text_response[:last_bracket + 1]
            # Remove trailing commas before closing brackets
            text_response = re.sub(r',\s*]', ']', text_response)
            text_response = re.sub(r',\s*}', '}', text_response)
            try:
                detections = json.loads(text_response)
            except Exception as e:
                logging.error(f"Failed to repair JSON: {e}")
                logging.debug(f"Raw response was: {text_response[:500]}")
                return []

        if not isinstance(detections, list):
            logging.error(f"Expected list from Vision AI, got {type(detections)}")
            return []

        # Map normalized 0–1000 coordinates to actual pixel dimensions
        parsed = []
        
        # Map new types back to legacy types for backward compatibility
        vehicle_types = {'car', 'motorcycle', 'truck', 'bus', 'bicycle'}
        space_types = {'car_space', 'motorcycle_space', 'large_vehicle_space'}
        legacy_map = {
            'car': 'occupied_slot', 'motorcycle': 'occupied_slot',
            'truck': 'occupied_slot', 'bus': 'occupied_slot', 'bicycle': 'occupied_slot',
            'car_space': 'empty_slot', 'motorcycle_space': 'empty_slot',
            'large_vehicle_space': 'empty_slot'
        }
        
        for det in detections:
            box = det.get('boundingBox', {})
            det_type = det.get('type', 'unknown')
            
            if not all(k in box for k in ('xmin', 'ymin', 'xmax', 'ymax')):
                continue
            
            # Skip unknown types
            if det_type not in vehicle_types and det_type not in space_types:
                # Try to handle legacy format too
                if det_type in ('occupied_slot', 'empty_slot'):
                    pass  # Accept as-is
                else:
                    continue
            
            x1 = int((box['xmin'] / 1000.0) * img_w)
            y1 = int((box['ymin'] / 1000.0) * img_h)
            x2 = int((box['xmax'] / 1000.0) * img_w)
            y2 = int((box['ymax'] / 1000.0) * img_h)

            # Clamp to image bounds
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(img_w, x2), min(img_h, y2)
            
            # Skip degenerate boxes
            if x2 - x1 < 5 or y2 - y1 < 5:
                continue

            parsed.append({
                "type": det_type,
                "legacy_type": legacy_map.get(det_type, det_type),
                "confidence": min(1.0, max(0.0, det.get("confidence", 0.5))),
                "boundingBox": {
                    "x": x1,
                    "y": y1,
                    "width": x2 - x1,
                    "height": y2 - y1
                }
            })

        return parsed
