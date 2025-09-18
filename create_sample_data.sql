-- Insert sample classes first
INSERT INTO classes (name, section, track, active) VALUES 
('1st Grade', 'A', 'Science', true),
('2nd Grade', 'A', 'Science', true),
('3rd Grade', 'B', 'Arts', true),
('4th Grade', 'A', 'Science', true),
('5th Grade', 'A', 'Science', true)
ON CONFLICT DO NOTHING;

-- Insert sample users
INSERT INTO users (name, email, password, role, type) VALUES 
('Admin User', 'admin@school.com', 'hashed_password', 'admin', 'residential'),
('Teacher One', 'teacher1@school.com', 'hashed_password', 'member', 'residential'),
('Teacher Two', 'teacher2@school.com', 'hashed_password', 'member', 'residential')
ON CONFLICT (email) DO NOTHING;

-- Insert sample students
INSERT INTO students (name, admission_number, class_id, is_hosteller, transport_chosen, guardian_name, guardian_phone, fee_status, status) VALUES 
('John Smith', 'ADM001', 1, true, false, 'Robert Smith', '+1234567890', 'Pending', 'active'),
('Jane Doe', 'ADM002', 1, false, true, 'Mary Doe', '+1234567891', 'Paid', 'active'),
('Mike Johnson', 'ADM003', 2, true, false, 'David Johnson', '+1234567892', 'Pending', 'active'),
('Sarah Wilson', 'ADM004', 2, false, false, 'Lisa Wilson', '+1234567893', 'Overdue', 'active'),
('Tom Brown', 'ADM005', 3, true, true, 'James Brown', '+1234567894', 'Paid', 'active'),
('Amy Davis', 'ADM006', 3, false, false, 'Susan Davis', '+1234567895', 'Pending', 'active'),
('Chris Miller', 'ADM007', 4, true, false, 'Mark Miller', '+1234567896', 'Paid', 'active'),
('Lisa Garcia', 'ADM008', 4, false, true, 'Maria Garcia', '+1234567897', 'Pending', 'active'),
('Kevin Lee', 'ADM009', 5, true, false, 'Peter Lee', '+1234567898', 'Overdue', 'active'),
('Emma Taylor', 'ADM010', 5, false, false, 'Jennifer Taylor', '+1234567899', 'Paid', 'active')
ON CONFLICT (admission_number) DO NOTHING;
