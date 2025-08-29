-- Create transactions table with transfer support
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    savings_account_id INTEGER REFERENCES savings_accounts(id),
    type VARCHAR(20) CHECK (type IN ('income', 'expense', 'transfer')) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    notes TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    staff_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure either store_id or savings_account_id is provided, but not both
    CONSTRAINT check_account_type CHECK (
        (store_id IS NOT NULL AND savings_account_id IS NULL) OR 
        (store_id IS NULL AND savings_account_id IS NOT NULL)
    )
);

-- Create transfers table to track transfer transactions
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
    outgoing_transaction_id INTEGER REFERENCES transactions(id),
    incoming_transaction_id INTEGER REFERENCES transactions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create cash_balance table for live balances
CREATE TABLE IF NOT EXISTS cash_balance (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) UNIQUE NOT NULL,
    current_balance DECIMAL(10,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create cash_history table for daily snapshots
CREATE TABLE IF NOT EXISTS cash_history (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) NOT NULL,
    date DATE NOT NULL,
    opening_balance DECIMAL(10,2) NOT NULL,
    closing_balance DECIMAL(10,2) NOT NULL,
    total_income DECIMAL(10,2) DEFAULT 0.00,
    total_expense DECIMAL(10,2) DEFAULT 0.00,
    total_transfer DECIMAL(10,2) DEFAULT 0.00,
    net_change DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, date)
);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_history ENABLE ROW LEVEL SECURITY;

-- Create policies for transactions table
CREATE POLICY "Enable read access for all users" ON transactions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON transactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON transactions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON transactions
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for transfers table
CREATE POLICY "Enable read access for all users" ON transfers
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON transfers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON transfers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON transfers
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for cash_balance table
CREATE POLICY "Enable read access for all users" ON cash_balance
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON cash_balance
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON cash_balance
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policies for cash_history table
CREATE POLICY "Enable read access for all users" ON cash_history
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON cash_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON cash_history
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Initialize cash balances for active stores (if they don't exist)
INSERT INTO cash_balance (store_id, current_balance) 
SELECT id, 5000.00 FROM stores WHERE status = 'active' AND id = 1
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO cash_balance (store_id, current_balance) 
SELECT id, 3000.00 FROM stores WHERE status = 'active' AND id = 2
ON CONFLICT (store_id) DO NOTHING;
