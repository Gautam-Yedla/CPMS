-- Camera Management & Stream ML Logs Schema

-- Cameras Table
CREATE TABLE IF NOT EXISTS public.cameras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT CHECK (type IN ('RTSP', 'Webcam', 'Upload')) DEFAULT 'RTSP',
  url TEXT, -- RTSP URL or identifier
  status TEXT CHECK (status IN ('Online', 'Offline', 'Error')) DEFAULT 'Offline',
  last_heartbeat TIMESTAMPTZ,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Camera Processing Logs (ML Detections)
CREATE TABLE IF NOT EXISTS public.camera_detections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  source_type TEXT CHECK (source_type IN ('Live', 'Upload')) NOT NULL,
  results JSONB NOT NULL, -- Full ML inference results
  metadata JSONB DEFAULT '{}'::jsonb, -- Confidence, version, etc.
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camera_detections ENABLE ROW LEVEL SECURITY;

-- Policies for Cameras
CREATE POLICY "Admins can manage all cameras"
  ON public.cameras
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Operators and Viewers can view cameras"
  ON public.cameras
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'security', 'faculty')
  ));

-- Policies for Detections
CREATE POLICY "Admins and Security can view detections"
  ON public.camera_detections
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'security')
  ));

CREATE POLICY "Authorized users can insert detections"
  ON public.camera_detections
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'security')
  ));
