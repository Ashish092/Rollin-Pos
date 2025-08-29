-- Create transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('income', 'expense')) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    notes TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    staff_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;



-- Create policies for transactions table
CREATE POLICY "Enable read access for all users" ON transactions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON transactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON transactions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON transactions
    FOR DELETE USING (auth.role() = 'authenticated');
