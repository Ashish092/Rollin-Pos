-- Create stores table
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    store_id VARCHAR(20) UNIQUE NOT NULL,
    branch VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('active', 'stopped', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Create policies for stores table
CREATE POLICY "Enable read access for all users" ON stores
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON stores
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON stores
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON stores
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample data for Nepal locations
INSERT INTO stores (store_id, branch, address, phone, email, status) VALUES
('RL-001', 'Damak', 'Main Street, Damak-1, Jhapa District, Nepal', '+977-985-1234567', 'damak@rolinkicks.com', 'active'),
('RL-002', 'Dharan', 'City Center, Dharan-1, Sunsari District, Nepal', '+977-985-1234568', 'dharan@rolinkicks.com', 'active'),
('RL-003', 'Birthmode', 'Birthmode Shopping Complex, Biratnagar-1, Morang District, Nepal', '+977-985-1234569', 'birthmode@rolinkicks.com', 'inactive');
