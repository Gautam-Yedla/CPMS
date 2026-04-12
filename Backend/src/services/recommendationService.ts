import { supabase } from '../lib/supabase.js';
import fs from 'fs';
import path from 'path';

interface Zone {
  id: string;
  camera_id: string;
  name: string;
  type: string;
  coordinates: number[][];
  capacity: number;
}

interface Slot {
  id: string;
  camera_id: string;
  zone_id: string;
  slot_number: string;
  coordinates: number[][];
}

interface Gate {
  id: string;
  camera_id: string;
  name: string;
  type: string;
  line_coords: number[][];
}

interface ZoneStatus {
  id: string;
  name?: string;
  occupancy: number;
  capacity: number;
}

interface AppStatus {
  zones: ZoneStatus[];
}

export class RecommendationService {
  private static STATUS_FILE = path.join(process.cwd(), '../ML/data/processed/status.json');

  private static getCentroid(coords: number[][]): { x: number; y: number } {
    if (!coords || coords.length === 0) return { x: 0, y: 0 };
    let x = 0, y = 0;
    coords.forEach(c => {
      x += c[0] || 0;
      y += c[1] || 0;
    });
    return { x: x / coords.length, y: y / coords.length };
  }

  private static isPointInPolygon(point: { x: number; y: number }, polygon: number[][]): boolean {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i]?.[0] ?? 0;
      const yi = polygon[i]?.[1] ?? 0;
      const xj = polygon[j]?.[0] ?? 0;
      const yj = polygon[j]?.[1] ?? 0;
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) isInside = !isInside;
    }
    return isInside;
  }

  private static getDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  static async getBestSlot(userRole: string) {
    try {
      const isFaculty = ['faculty', 'admin', 'security'].includes(userRole.toLowerCase());

      // 1. Fetch Dynamic Layout from DB
      const { data: gates } = await supabase.from('parking_gates').select('*').eq('type', 'entry');
      const { data: zones } = await supabase.from('parking_zones').select('*');
      const { data: slots } = await supabase.from('parking_slots').select('*');
      const { data: cameras } = await supabase.from('cameras').select('id, name').eq('is_active', true);

      if (!gates || !zones || !slots) {
        console.warn('Database geometry tables not populated yet. Falling back to empty search.');
        return null;
      }

      // 2. Load Real-time Occupancy from ML service
      let status: AppStatus = { zones: [] };
      try {
        status = JSON.parse(fs.readFileSync(this.STATUS_FILE, 'utf-8'));
      } catch (err) {
        console.warn('ML Status file not readable, using defaults.');
      }

      // 3. Process Zones and calculate congestion weights
      const processedZones = zones.map(z => {
        const s = status.zones.find(sz => sz.id === z.id);
        const congestion = s ? (s.occupancy / s.capacity) : 0;
        return {
          ...z,
          center: this.getCentroid(z.coordinates),
          weight: 1 + (congestion * 2) 
        };
      });

      // 4. Global Search across all cameras/connections
      const results: any[] = [];
      
      slots.forEach(slot => {
        const slotCenter = this.getCentroid(slot.coordinates);
        const parentZone = processedZones.find(z => z.id === slot.zone_id);
        const camera = cameras?.find(c => c.id === slot.camera_id);
        const entryGate = gates.find(g => g.camera_id === slot.camera_id);

        if (!parentZone || !camera || !entryGate) return;

        // Skip reserved zones for students
        if (parentZone.type === 'reserved' && !isFaculty) return;

        // Skip full zones (Optional but better UX)
        const zoneStatus = status.zones.find(sz => sz.id === parentZone.id);
        if (zoneStatus && zoneStatus.occupancy >= zoneStatus.capacity) return;

        const entryNode = {
          x: (entryGate.line_coords[0][0] + entryGate.line_coords[1][0]) / 2,
          y: (entryGate.line_coords[0][1] + entryGate.line_coords[1][1]) / 2
        };

        const distToZone = this.getDistance(entryNode, parentZone.center);
        const distToSlot = this.getDistance(parentZone.center, slotCenter);
        const totalDistance = distToZone + distToSlot;
        const weightedScore = totalDistance * parentZone.weight;

        results.push({
          id: slot.slot_number,
          zone: parentZone.name,
          camera: camera.name,
          distance: Math.round(totalDistance),
          score: weightedScore,
          path: [entryGate.name, parentZone.name, `Slot ${slot.slot_number}`]
        });
      });

      if (results.length === 0) return null;

      // Sort by the smartest choice (Weighted Distance)
      results.sort((a, b) => a.score - b.score);

      // XAI: Explainable AI Logic
      const bestSlot = results[0];
      const worstSlot = results[results.length - 1];
      const bestZone = processedZones.find(z => z.name === bestSlot.zone);
      
      const reasons = [];
      if (bestZone) {
          const s = status.zones.find(sz => sz.name === bestZone.name);
          const congestionPercentage = s ? Math.round((s.occupancy / s.capacity) * 100) : 0;
          
          if (congestionPercentage < 50) {
             reasons.push(`${100 - congestionPercentage}% lower congestion area`);
          } else {
             reasons.push('Best available path under heavy congestion');
          }
      }

      if (bestSlot.distance < worstSlot.distance) {
          reasons.push(`${Math.round(worstSlot.distance - bestSlot.distance)}m closer than furthest alternatives`);
      }

      if (isFaculty && bestSlot.zone.toLowerCase().includes('reserved')) {
          reasons.push('Authorized for premium Faculty/Staff access');
      } else {
          reasons.push('Valid access for your designated Role');
      }

      bestSlot.reasons = reasons;

      return {
        recommended: bestSlot,
        alternatives: results.slice(1, 4)
      };
    } catch (err) {
      console.error('Dynamic Recommendation Error:', err);
      throw err;
    }
  }
}
