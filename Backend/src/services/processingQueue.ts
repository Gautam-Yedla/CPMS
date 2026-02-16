import { EventEmitter } from 'events';
import { MLBridgeService } from './mlBridge.js';
import { createClient } from '@supabase/supabase-js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Configure ffmpeg
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath as any);
}

// Helper to sanitize channel names for Supabase Realtime
const sanitizeChannelName = (name: string) => {
  return name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
};

interface Job {
  id: string;
  filename: string;
  buffer: Buffer;
  mimeType: string;
  location: string;
  userId: string;
  token: string;
}

class ProcessingQueue extends EventEmitter {
  private queue: Job[] = [];
  private isProcessing = false;

  constructor() {
    super();
    this.on('next', this.processNext.bind(this));
  }

  addJob(job: Job) {
    this.queue.push(job);
    console.log(`[Queue] Added job for ${job.filename}. Queue size: ${this.queue.length}`);
    if (!this.isProcessing) {
      this.emit('next');
    }
  }

  private async processNext() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const job = this.queue.shift()!;
    const sanitizedName = sanitizeChannelName(job.filename);
    
    console.log(`[Queue] Processing ${job.filename} (${job.mimeType}). Channel: streaming-${sanitizedName}`);

    // Initialize Supabase with user context
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${job.token}` } }
    });

    const channel = supabase.channel(`streaming-${sanitizedName}`);
    await channel.subscribe();

    try {
      // 1. BUFFREING: Wait 1 second to allow frontend to subscribe
      await new Promise(r => setTimeout(r, 1000));

      const isVideo = job.mimeType.startsWith('video/');
      let aggregatedDetections: any[] = [];
      let peakCounts: Record<string, number> = {};
      let framesProcessed = 1; // Default for images

      if (isVideo) {
        // Handle Video: Extract frames and stream
        const tempDir = path.join(os.tmpdir(), `cpms-${Date.now()}`);
        fs.mkdirSync(tempDir);
        const tempVideoPath = path.join(tempDir, job.filename);
        fs.writeFileSync(tempVideoPath, job.buffer);

        console.log(`[Queue] Extracting frames for ${job.filename}...`);
        
        await new Promise<void>((resolve, reject) => {
          ffmpeg(tempVideoPath)
            .fps(2) // 2 frames per second
            .save(path.join(tempDir, 'frame-%03d.jpg'))
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
        });

        const frames = fs.readdirSync(tempDir).filter(f => f.startsWith('frame-')).sort();
        framesProcessed = frames.length;
        console.log(`[Queue] Processing ${framesProcessed} frames...`);

        for (const [index, frameFile] of frames.entries()) {
          const framePath = path.join(tempDir, frameFile);
          const frameBuffer = fs.readFileSync(framePath);
          const base64 = frameBuffer.toString('base64');
          
          try {
            const mlResults = await MLBridgeService.processFrame(base64);
            
            // AGGREGATION FIX: Instead of raw list, track peak counts or unique occurrences
            // For the "Detected 2021 objects" fix, we'll store a Summary of counts per class
            const frameCounts: Record<string, number> = {};
            mlResults.detections.forEach(det => {
              frameCounts[det.class] = (frameCounts[det.class] || 0) + 1;
            });

            // Keep track of maximum number of each item seen at once
            Object.entries(frameCounts).forEach(([cls, count]) => {
              const currentPeak = peakCounts[cls];
              if (currentPeak === undefined || count > currentPeak) {
                peakCounts[cls] = count;
              }
            });

            // Broadcast frame + detections
            await channel.send({
              type: 'broadcast',
              event: 'frame',
              payload: {
                filename: job.filename,
                frame: `data:image/jpeg;base64,${base64}`,
                detections: mlResults.detections,
                current: index + 1,
                total: framesProcessed
              }
            });
          } catch (err) {
            console.error(`[Queue] ML Error on frame:`, err);
          }

          // Delay for UX
          await new Promise(r => setTimeout(r, 100));
        }

        // Final Aggregate Detections: Create a list based on peak counts
        // This is a heuristic to represent the "Uniques" better than simple concatenation
        Object.entries(peakCounts).forEach(([cls, count]) => {
          for (let i = 0; i < count; i++) {
            aggregatedDetections.push({ class: cls, confidence: 1.0 });
          }
        });

        // Cleanup
        fs.rmSync(tempDir, { recursive: true, force: true });
      } else {
        // Handle Image
        const base64 = job.buffer.toString('base64');
        const mlResults = await MLBridgeService.processFrame(base64);
        aggregatedDetections = mlResults.detections;

        await channel.send({
          type: 'broadcast',
          event: 'frame',
          payload: {
            filename: job.filename,
            frame: `data:${job.mimeType};base64,${base64}`,
            detections: mlResults.detections,
            current: 1,
            total: 1
          }
        });
      }

      // Finalize: Insert into database
      console.log(`[Queue] Inserting ${job.filename} into database with ${aggregatedDetections.length} detections...`);
      const { data, error } = await supabase
        .from('camera_detections')
        .insert({
          source_type: 'Upload',
          results: aggregatedDetections,
          metadata: {
            filename: job.filename,
            location: job.location,
            mimeType: job.mimeType,
            batch_id: job.id,
            is_video: isVideo,
            frames_processed: framesProcessed,
            peak_counts: peakCounts,
            is_summary: isVideo
          }
        })
        .select()
        .single();

      if (error) {
        console.error(`[Queue] Database insert error for ${job.filename}:`, error);
        throw error;
      }

      console.log(`[Queue] Finished ${job.filename}. Log ID: ${data.id}. Aggregated count: ${aggregatedDetections.length}`);      this.emit('completed', { filename: job.filename, results: aggregatedDetections });
    } catch (error: any) {
      console.error(`[Queue] Error processing ${job.filename}:`, error.message);
      this.emit('failed', { filename: job.filename, error: error.message });
    } finally {
      supabase.removeChannel(channel);
      this.emit('next');
    }
  }

  getQueueStatus() {
    return {
      pending: this.queue.length,
      isProcessing: this.isProcessing
    };
  }
}

export const processingQueue = new ProcessingQueue();
