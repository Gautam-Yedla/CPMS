import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001';

export interface Detection {
  type: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface MLResponse {
  vehicles: Detection[];
  parking?: {
    totalSlots: number;
    occupied: number;
    available: number;
    slots: any[];
  };
  local_results?: {
    pk_best: any;
    best: any;
    comparison: any;
  };
}

export class MLBridgeService {
  /**
   * Sends a base64 encoded frame to the ML service for processing
   */
  static async processFrame(base64Image: string, timestamp?: string, isUpload: boolean = false, detectionType: string = 'all'): Promise<MLResponse> {
    try {
      const response = await axios.post(`${ML_API_URL}/process_frame`, {
        image: base64Image,
        timestamp: timestamp || new Date().toISOString(),
        is_upload: isUpload,
        detection_type: detectionType
      }, {
        timeout: 60000 // Increased timeout to 60 seconds to allow Gemini API to respond
      });

      return response.data;
    } catch (error: any) {
      console.error('ML Bridge Error:', error.message);
      throw new Error(`Failed to process frame with ML service: ${error.message}`);
    }
  }

  /**
   * Checks health of the ML service
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${ML_API_URL}/health`);
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}
