/*
  # Add position to cameras table

  1. Changes
    - Add `position` column to `cameras` table
    - Set default value to 0
    - Add index for performance
*/

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'cameras' 
    AND column_name = 'position'
  ) THEN 
    ALTER TABLE cameras ADD COLUMN position integer DEFAULT 0;
    CREATE INDEX idx_cameras_position ON cameras(position);
  END IF;
END $$;
