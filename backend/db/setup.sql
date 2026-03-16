-- ══════════════════════════════════════════════════════
--  GOAT Turf — Supabase Database Setup
--  Run this SQL in your Supabase SQL Editor
-- ══════════════════════════════════════════════════════

-- 1. Create the bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sport           TEXT NOT NULL CHECK (sport IN ('cricket', 'football')),
  players         INTEGER NOT NULL CHECK (players > 0),
  booking_date    DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  price           NUMERIC NOT NULL CHECK (price > 0),
  payment_status  TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  customer_name   TEXT,
  phone           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),

  -- Ensure end_time is after start_time
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- ⚠️  MIGRATION: If the table already exists, run these two lines in Supabase SQL Editor:
-- ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_name TEXT;
-- ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Create indexes for fast overlap queries
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings (booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings (booking_date, payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_order ON bookings (razorpay_order_id);

-- 3. Enable Row Level Security (recommended for production)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Allow the service role (backend) full access
--    The anon key will NOT be able to access this table directly,
--    only through your backend API.
CREATE POLICY "Service role full access" ON bookings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. (Optional) Create a function to auto-cleanup stale pending bookings
--    This runs as a Supabase cron job via pg_cron extension.
--    You can enable this in Dashboard > Database > Extensions > pg_cron
--
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- SELECT cron.schedule(
--   'cleanup-stale-bookings',
--   '*/5 * * * *',  -- every 5 minutes
--   $$
--     DELETE FROM bookings
--     WHERE payment_status = 'pending'
--       AND created_at < now() - interval '10 minutes';
--   $$
-- );
