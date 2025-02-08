/*
  # Social Media Analytics Schema

  1. New Tables
    - `platform_metrics`
      - Daily metrics for each platform (Instagram, YouTube, Google)
      - Stores followers, engagement, views, etc.
    
    - `engagement_data`
      - Hourly engagement data across platforms
      - Used for time-series analysis
    
    - `audience_demographics`
      - Demographic breakdown of the audience
      - Age groups and their percentages

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read data
    - Add policies for system to write data
*/

-- Platform Metrics Table
CREATE TABLE IF NOT EXISTS platform_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  followers integer DEFAULT 0,
  engagement_rate decimal DEFAULT 0,
  total_posts integer DEFAULT 0,
  growth_rate decimal DEFAULT 0,
  subscribers integer DEFAULT 0,
  avg_views integer DEFAULT 0,
  search_impressions integer DEFAULT 0,
  click_rate decimal DEFAULT 0,
  avg_position decimal DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Engagement Data Table
CREATE TABLE IF NOT EXISTS engagement_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  engagement_count integer DEFAULT 0,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Audience Demographics Table
CREATE TABLE IF NOT EXISTS audience_demographics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  age_group text NOT NULL,
  percentage decimal NOT NULL,
  platform text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_demographics ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read data
CREATE POLICY "Allow authenticated users to read platform metrics"
  ON platform_metrics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read engagement data"
  ON engagement_data
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read demographics"
  ON audience_demographics
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample data for platform metrics
INSERT INTO platform_metrics (platform, followers, engagement_rate, total_posts, growth_rate)
VALUES 
  ('instagram', 12500, 4.8, 48, 15),
  ('youtube', 8200, 3.5, 86, 8),
  ('google', 0, 3.2, 0, 12);

-- Insert sample engagement data
INSERT INTO engagement_data (platform, engagement_count, timestamp)
SELECT
  platform,
  (random() * 1000 + 2000)::integer as engagement_count,
  now() - (interval '1 hour' * generate_series(0, 167))
FROM
  unnest(ARRAY['instagram', 'youtube', 'google']) as platform;

-- Insert sample demographics data
INSERT INTO audience_demographics (age_group, percentage, platform)
VALUES 
  ('Gen Z', 35, 'instagram'),
  ('Millennials', 40, 'instagram'),
  ('Gen X', 15, 'instagram'),
  ('Boomers', 10, 'instagram'),
  ('Gen Z', 30, 'youtube'),
  ('Millennials', 45, 'youtube'),
  ('Gen X', 15, 'youtube'),
  ('Boomers', 10, 'youtube'),
  ('Gen Z', 25, 'google'),
  ('Millennials', 35, 'google'),
  ('Gen X', 25, 'google'),
  ('Boomers', 15, 'google');