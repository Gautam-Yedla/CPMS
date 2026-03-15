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

class GeminiDetector:
    """
    Detects vehicles and infers feasible empty parking spaces using
    Google's Gemini Vision API.
    
    Designed for UNMARKED parking lots — no painted lines or slot markings.
    Uses spatial reasoning to identify gaps where a vehicle could park.
    """
    def __init__(self, config):
        self.config = config
        self.api_key = os.environ.get("GEMINI_API_KEY") or config.get("gemini", {}).get("api_key")
        self.model_name = config.get("gemini", {}).get("model_name", "gemini-3.1-flash-lite-preview")
        self.max_image_dim = config.get("gemini", {}).get("max_image_dimension", 1536)
        self.enable_thinking = config.get("gemini", {}).get("enable_thinking", True)
        
        # Build zone context string from config
        self.zone_context = self._build_zone_context(config)
        
        if not self.api_key:
            logging.warning("GEMINI_API_KEY is not set. GeminiDetector will be disabled.")
            self.client = None
        else:
            try:
                logging.info(f"Initializing Gemini Client with model: {self.model_name}")
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logging.error(f"Failed to initialize Gemini Client: {e}")
                self.client = None

        self.system_instruction = """You are an expert parking lot analyst AI. Your task is to analyze aerial or surveillance camera images of parking areas and identify:

1. ALL PARKED VEHICLES — every vehicle visible in the image
2. ALL FEASIBLE EMPTY PARKING SPACES — areas where a vehicle COULD realistically park

CRITICAL CONTEXT: This parking lot has NO PAINTED LINES or slot markings. You must use SPATIAL REASONING to determine where vehicles are and where empty spaces exist.

═══════════════════════════════════════
VEHICLE DETECTION RULES
═══════════════════════════════════════

Detect EVERY vehicle visible in the image. For each vehicle:
- Classify its type: "car", "motorcycle", "truck", "bus", or "bicycle"
- Draw a TIGHT bounding box around the entire vehicle body
- Estimate confidence based on how clearly visible the vehicle is
- Do NOT miss partially visible vehicles at image edges — include them with lower confidence

═══════════════════════════════════════
FEASIBLE EMPTY SPACE DETECTION RULES
═══════════════════════════════════════

Since there are NO painted parking lines, use these spatial reasoning criteria to identify feasible empty parking spaces:

A space is FEASIBLE if ALL of these conditions are met:
  ✓ The area is paved surface (asphalt, concrete, gravel) — NOT grass, dirt paths, or sidewalks
  ✓ The gap is large enough for at least one standard vehicle (~2m wide × ~4.5m long for cars, ~1m × ~2m for motorcycles)
  ✓ A vehicle could physically ENTER the space (not blocked on all sides)
  ✓ The space is ALIGNED with the parking pattern of nearby vehicles (same row/angle)
  ✓ The space is NOT a driving lane, driveway, entrance/exit road, or pedestrian path

A space is NOT feasible if:
  ✗ It's too narrow (less than ~1.5m gap between two vehicles)
  ✗ It's a driving/access lane that vehicles use to navigate the lot
  ✗ It contains obstacles (poles, barriers, curbs, trees, debris)
  ✗ It's on unpaved/non-parking surface (grass, garden, sidewalk)

For each feasible space, estimate what vehicle type fits best:
  - "car_space" — fits a standard car (~2m × 4.5m)
  - "motorcycle_space" — fits a motorcycle but NOT a car (~1m × 2m)
  - "large_vehicle_space" — fits a truck or bus (~3m × 7m+)

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════

Return ONLY a valid JSON array. Each element must have:
- "type": one of "car", "motorcycle", "truck", "bus", "bicycle", "car_space", "motorcycle_space", "large_vehicle_space"
- "confidence": float between 0.0 and 1.0
- "boundingBox": {"ymin": int, "xmin": int, "ymax": int, "xmax": int} — normalized to a 1000×1000 grid

Example output:
[
    {"type": "car", "confidence": 0.95, "boundingBox": {"ymin": 100, "xmin": 200, "ymax": 300, "xmax": 450}},
    {"type": "car_space", "confidence": 0.80, "boundingBox": {"ymin": 100, "xmin": 460, "ymax": 300, "xmax": 700}},
    {"type": "motorcycle", "confidence": 0.88, "boundingBox": {"ymin": 350, "xmin": 150, "ymax": 420, "xmax": 220}}
]

IMPORTANT: Be thorough. Count EVERY vehicle AND every feasible space. Missing detections is worse than a slightly wrong bounding box."""

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
        """Enhance and resize image for optimal Gemini analysis."""
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
            logging.error("Gemini client is not initialized.")
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
        
        # Configure generation
        generation_config = types.GenerateContentConfig(
            temperature=0.1,
            response_mime_type="application/json",
            system_instruction=self.system_instruction,
        )
        
        # Enable thinking for better reasoning if supported
        if self.enable_thinking:
            try:
                generation_config.thinking_config = types.ThinkingConfig(
                    thinking_budget=2048
                )
            except Exception:
                # Thinking not supported for this model version — skip silently
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
                    f"[GEMINI] Detected {len(vehicles)} vehicles, {len(spaces)} feasible spaces "
                    f"({elapsed}ms, attempt {attempt + 1})"
                )
                
                return detections
                
            except Exception as e:
                logging.error(f"[GEMINI] Attempt {attempt + 1} failed: {e}")
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
            logging.error(f"Expected list from Gemini, got {type(detections)}")
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
