-- UPDATE EXISTING CASH MANAGEMENT SCHEMA
-- Run this in Supabase SQL editor

BEGIN;

-- 1) Ensure transactions supports either store or savings account
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS savings_account_id INTEGER REFERENCES savings_accounts(id);

-- store_id may have been NOT NULL earlier; allow NULL now
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'store_id' AND is_nullable = 'NO'
  ) THEN
    EXECUTE 'ALTER TABLE transactions ALTER COLUMN store_id DROP NOT NULL';
  END IF;
END $$;

-- Replace the account type constraint (either store_id or savings_account_id, but not both)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_account_type;
ALTER TABLE transactions ADD CONSTRAINT check_account_type CHECK (
  (store_id IS NOT NULL AND savings_account_id IS NULL) OR
  (store_id IS NULL AND savings_account_id IS NOT NULL)
);

-- 2) Create transfers table to track transfer operations
CREATE TABLE IF NOT EXISTS transfers (
  id SERIAL PRIMARY KEY,
  transfer_reference VARCHAR(50) UNIQUE NOT NULL,
  from_type VARCHAR(20) NOT NULL CHECK (from_type IN ('store', 'savings')),
  from_id INTEGER NOT NULL,
  to_type VARCHAR(20) NOT NULL CHECK (to_type IN ('store', 'savings')),
  to_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  staff_email VARCHAR(255),
  outgoing_transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
  incoming_transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3) Enable RLS and policies for transfers
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if rerunning
DROP POLICY IF EXISTS "Enable read access for all users" ON transfers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON transfers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON transfers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON transfers;

CREATE POLICY "Enable read access for all users" ON transfers
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON transfers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON transfers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON transfers
  FOR DELETE USING (auth.role() = 'authenticated');

COMMIT;
