import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001';

export interface Detection {
  bbox: number[];
  confidence: number;
  class: string;
  class_id: number;
}

export interface MLResponse {
  detections: Detection[];
  count: number;
  timestamp: string;
}

export class MLBridgeService {
  /**
   * Sends a base64 encoded frame to the ML service for processing
   */
  static async processFrame(base64Image: string, timestamp?: string): Promise<MLResponse> {
    try {
      const response = await axios.post(`${ML_API_URL}/process_frame`, {
        image: base64Image,
        timestamp: timestamp || new Date().toISOString()
      }, {
        timeout: 5000 // ML can be slow
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
