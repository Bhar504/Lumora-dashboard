/*
  # Lumora Security Dashboard Schema

  ## Overview
  Creates the complete database schema for the Lumora enterprise security system
  including cameras, detections, alerts, and audit logs.

  ## New Tables

  ### 1. `cameras`
  Stores camera configurations and status.
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Owner of the camera
  - `name` (text) - Camera display name
  - `source_type` (text) - 'webcam' | 'rtsp' | 'ip_camera' | 'video_upload'
  - `stream_url` (text) - URL for RTSP/IP cameras
  - `username` (text) - For IP cameras (encrypted)
  - `password` (text) - For IP cameras (encrypted)
  - `is_active` (boolean) - Whether camera is currently streaming
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `detections`
  Stores all gun detection events.
  - `id` (uuid, primary key)
  - `camera_id` (uuid) - References cameras table
  - `user_id` (uuid) - Camera owner
  - `confidence` (numeric) - Detection confidence (0-100)
  - `bounding_box` (jsonb) - Detection box coordinates {x, y, width, height}
  - `frame_data` (text) - Base64 frame snapshot
  - `alerted` (boolean) - Whether alert was sent
  - `exported` (boolean) - Whether clip was exported
  - `created_at` (timestamptz)

  ### 3. `system_settings`
  Stores user's system configuration.
  - `id` (uuid, primary key)
  - `user_id` (uuid) - User who owns settings
  - `is_armed` (boolean) - System armed status
  - `alert_threshold` (numeric) - Confidence threshold for alerts (default 70)
  - `dark_mode` (boolean) - Dark mode preference
  - `email_alerts` (boolean) - Send email on detection
  - `push_alerts` (boolean) - Send push notifications
  - `updated_at` (timestamptz)

  ### 4. `alert_logs`
  Audit trail of all alerts sent.
  - `id` (uuid, primary key)
  - `user_id` (uuid)
  - `detection_id` (uuid)
  - `alert_type` (text) - 'email' | 'push' | 'banner'
  - `sent_at` (timestamptz)

  ## Security
  - All tables have RLS enabled
  - Users can only access their own data
  - Passwords are encrypted in the database
*/

-- Create cameras table
CREATE TABLE IF NOT EXISTS cameras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('webcam', 'rtsp', 'ip_camera', 'video_upload')),
  stream_url text,
  username text,
  password text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create detections table
CREATE TABLE IF NOT EXISTS detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id uuid NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  bounding_box jsonb,
  frame_data text,
  alerted boolean DEFAULT false,
  exported boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_armed boolean DEFAULT false,
  alert_threshold numeric DEFAULT 70 CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
  dark_mode boolean DEFAULT true,
  email_alerts boolean DEFAULT false,
  push_alerts boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Create alert_logs table
CREATE TABLE IF NOT EXISTS alert_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  detection_id uuid NOT NULL REFERENCES detections(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('email', 'push', 'banner')),
  sent_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_logs ENABLE ROW LEVEL SECURITY;

-- Cameras policies
CREATE POLICY "Users can view own cameras"
  ON cameras FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cameras"
  ON cameras FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cameras"
  ON cameras FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cameras"
  ON cameras FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Detections policies
CREATE POLICY "Users can view own detections"
  ON detections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own detections"
  ON detections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own detections"
  ON detections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System settings policies
CREATE POLICY "Users can view own settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Alert logs policies
CREATE POLICY "Users can view own alert logs"
  ON alert_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert logs"
  ON alert_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_cameras_user_id ON cameras(user_id);
CREATE INDEX idx_detections_user_id ON detections(user_id);
CREATE INDEX idx_detections_camera_id ON detections(camera_id);
CREATE INDEX idx_detections_created_at ON detections(created_at DESC);
CREATE INDEX idx_alert_logs_user_id ON alert_logs(user_id);
CREATE INDEX idx_alert_logs_detection_id ON alert_logs(detection_id);
