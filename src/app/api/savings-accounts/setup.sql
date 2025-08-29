-- Create savings_accounts table
CREATE TABLE IF NOT EXISTS savings_accounts (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- 'bank', 'mobile_money', 'digital_wallet', 'other'
    bank_name VARCHAR(255),
    account_number VARCHAR(100),
    current_balance DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create savings_transactions table for savings account transactions
CREATE TABLE IF NOT EXISTS savings_transactions (
    id SERIAL PRIMARY KEY,
    savings_account_id INTEGER REFERENCES savings_accounts(id) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('deposit', 'withdrawal', 'transfer_out', 'transfer_in')) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    staff_email VARCHAR(255),
    related_transaction_id INTEGER, -- For linking transfer pairs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for savings_accounts table
CREATE POLICY "Enable read access for all users" ON savings_accounts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON savings_accounts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON savings_accounts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON savings_accounts
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for savings_transactions table
CREATE POLICY "Enable read access for all users" ON savings_transactions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON savings_transactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON savings_transactions
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert sample savings accounts
INSERT INTO savings_accounts (account_id, account_name, account_type, bank_name, account_number, current_balance, status) VALUES
('SAV-001', 'NIC Asia Bank', 'bank', 'NIC Asia Bank', '1234567890', 50000.00, 'active'),
('SAV-002', 'Nabil Bank', 'bank', 'Nabil Bank', '0987654321', 75000.00, 'active'),
('SAV-003', 'eSewa Wallet', 'digital_wallet', 'eSewa', 'esewa123', 15000.00, 'active'),
('SAV-004', 'Khalti Wallet', 'digital_wallet', 'Khalti', 'khalti456', 25000.00, 'active'),
('SAV-005', 'Nepal Bank', 'bank', 'Nepal Bank', 'nepal789', 100000.00, 'active');
