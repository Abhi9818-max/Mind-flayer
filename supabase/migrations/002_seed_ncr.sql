-- Seed data for Delhi/NCR region
-- Initial dominions and territories

-- Insert NCR region
INSERT INTO regions (id, name, country, state_province) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'NCR', 'India', 'Delhi/NCR');

-- Insert NCR dominion
INSERT INTO dominions (id, name, region_id) VALUES
    ('660e8400-e29b-41d4-a716-446655440000', 'NCR Dominion', '550e8400-e29b-41d4-a716-446655440000');

-- Insert territories (colleges)
INSERT INTO territories (id, name, dominion_id, email_domain) VALUES
    -- Delhi Central
    ('770e8400-e29b-41d4-a716-446655440001', 'DU North Campus', '660e8400-e29b-41d4-a716-446655440000', 'du.ac.in'),
    ('770e8400-e29b-41d4-a716-446655440002', 'DU South Campus', '660e8400-e29b-41d4-a716-446655440000', 'du.ac.in'),
    ('770e8400-e29b-41d4-a716-446655440003', 'JNU', '660e8400-e29b-41d4-a716-446655440000', 'jnu.ac.in'),
    ('770e8400-e29b-41d4-a716-446655440004', 'Jamia Millia Islamia', '660e8400-e29b-41d4-a716-446655440000', 'jmi.ac.in'),
    
    -- Noida
    ('770e8400-e29b-41d4-a716-446655440005', 'Amity University', '660e8400-e29b-41d4-a716-446655440000', 'amity.edu'),
    ('770e8400-e29b-41d4-a716-446655440006', 'JIIT Noida', '660e8400-e29b-41d4-a716-446655440000', 'jiit.ac.in'),
    ('770e8400-e29b-41d4-a716-446655440007', 'GBU', '660e8400-e29b-41d4-a716-446655440000', 'gbu.ac.in'),
    ('770e8400-e29b-41d4-a716-446655440008', 'Sharda University', '660e8400-e29b-41d4-a716-446655440000', 'sharda.ac.in'),
    
    -- Gurgaon
    ('770e8400-e29b-41d4-a716-446655440009', 'GD Goenka', '660e8400-e29b-41d4-a716-446655440000', 'gdgoenka.ac.in'),
    ('770e8400-e29b-41d4-a716-446655440010', 'Sushant University', '660e8400-e29b-41d4-a716-446655440000', 'sushantuniversity.edu.in'),
    ('770e8400-e29b-41d4-a716-446655440011', 'MDU Rohtak', '660e8400-e29b-41d4-a716-446655440000', 'mdu.ac.in'),
    
    -- Greater Noida
    ('770e8400-e29b-41d4-a716-446655440012', 'Bennett University', '660e8400-e29b-41d4-a716-446655440000', 'bennett.edu.in'),
    ('770e8400-e29b-41d4-a716-446655440013', 'GL Bajaj', '660e8400-e29b-41d4-a716-446655440000', 'glbitm.org'),
    ('770e8400-e29b-41d4-a716-446655440014', 'NIET', '660e8400-e29b-41d4-a716-446655440000', 'niet.co.in'),
    ('770e8400-e29b-41d4-a716-446655440015', 'Galgotias University', '660e8400-e29b-41d4-a716-446655440000', 'galgotiasuniversity.edu.in');
