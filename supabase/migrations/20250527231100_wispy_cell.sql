/*
  # Create admin schema and initial data

  1. New Tables
    - `admin_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
  2. Security
    - Enable RLS on `admin_settings` table
    - Add policy for admin users only
    
  3. Initial Data
    - Insert default admin settings
*/

CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can manage settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Insert initial admin settings
INSERT INTO admin_settings (key, value) VALUES
  ('site_settings', jsonb_build_object(
    'site_name', 'StreamVista',
    'language', 'fr',
    'maintenance_mode', false,
    'registration_enabled', true,
    'trial_period_days', 60
  )),
  ('analytics_settings', jsonb_build_object(
    'tracking_enabled', true,
    'retention_days', 90
  )),
  ('subscription_tiers', jsonb_build_array(
    jsonb_build_object(
      'name', 'Basic',
      'price', 9.99,
      'features', array['Streaming HD', 'Un appareil', 'Annulation à tout moment']
    ),
    jsonb_build_object(
      'name', 'Premium',
      'price', 14.99,
      'features', array['Streaming 4K Ultra HD', 'Quatre appareils', 'Téléchargements hors ligne', 'Sans publicité']
    )
  ));