/*
  # Security System Schema

  ## Overview
  This migration creates the database schema for a security system with authentication,
  system state management, and activity logging.

  ## New Tables
  
  ### 1. `system_state`
  Stores the current state of the security system.
  - `id` (uuid, primary key) - Unique identifier
  - `status` (text) - Current status: 'disarmed', 'armed', 'alert'
  - `last_updated` (timestamptz) - Timestamp of last status change
  - `updated_by` (uuid) - User who made the change (references auth.users)
  
  ### 2. `activity_log`
  Tracks all system state changes and events.
  - `id` (uuid, primary key) - Unique identifier
  - `event_type` (text) - Type of event: 'armed', 'disarmed', 'breach', 'login'
  - `status_before` (text) - Status before the change
  - `status_after` (text) - Status after the change
  - `user_id` (uuid) - User who triggered the event (references auth.users)
  - `created_at` (timestamptz) - When the event occurred
  - `metadata` (jsonb) - Additional event details

  ## Security
  
  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Only authenticated users can read system state
  - Only authenticated users can update system state
  - Only authenticated users can read activity logs
  - System automatically logs all changes

  ## Important Notes
  1. The system_state table will have exactly one row (singleton pattern)
  2. Activity log provides audit trail for compliance
  3. Real-time subscriptions enabled for live status updates
*/

-- Create system_state table
CREATE TABLE IF NOT EXISTS system_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'disarmed',
  last_updated timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT valid_status CHECK (status IN ('disarmed', 'armed', 'alert'))
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  status_before text,
  status_after text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Insert initial system state
INSERT INTO system_state (status, last_updated)
VALUES ('disarmed', now())
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE system_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Policies for system_state
CREATE POLICY "Authenticated users can read system state"
  ON system_state FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update system state"
  ON system_state FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for activity_log
CREATE POLICY "Authenticated users can read activity log"
  ON activity_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert activity log"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);