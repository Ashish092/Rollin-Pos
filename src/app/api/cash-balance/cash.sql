
-- Create cash_balance table for live balances
CREATE TABLE cash_balance (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) UNIQUE NOT NULL,
    current_balance DECIMAL(10,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create cash_history table for daily snapshots
CREATE TABLE cash_history (
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

ALTER TABLE cash_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_history ENABLE ROW LEVEL SECURITY;


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


-- Initialize cash balances for active stores
INSERT INTO cash_balance (store_id, current_balance) VALUES
(1, 5000.00), -- Damak
(2, 3000.00); -- Dharan
