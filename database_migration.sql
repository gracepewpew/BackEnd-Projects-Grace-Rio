-- Amoxicillin Health Database Migration Script
-- Run this script to initialize the database for the Smart Health Management System

-- Create database
CREATE DATABASE IF NOT EXISTS amoxicillin_health;
USE amoxicillin_health;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role ENUM('doctor', 'patient', 'nurse') NOT NULL,
    password VARCHAR(255) NOT NULL,
    doctorId VARCHAR(50),
    ktp VARCHAR(50),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Health records table
CREATE TABLE IF NOT EXISTS health_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    height DECIMAL(5,2) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    bmi DECIMAL(5,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    userId INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Medicines table
CREATE TABLE IF NOT EXISTS medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    stock INT DEFAULT 0,
    unit VARCHAR(50),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patientId INT,
    doctorId INT,
    message TEXT NOT NULL,
    status ENUM('pending', 'answered', 'closed') DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctorId) REFERENCES users(id) ON DELETE CASCADE
);

-- Visits/Appointments table
CREATE TABLE IF NOT EXISTS kunjungan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patientId INT,
    doctorId INT,
    diagnosis TEXT,
    prescription TEXT,
    visitDate DATETIME NOT NULL,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctorId) REFERENCES users(id) ON DELETE CASCADE
);

-- Medicine adjustments table
CREATE TABLE IF NOT EXISTS adjustments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicineId INT,
    adjustmentType ENUM('add', 'subtract') NOT NULL,
    quantity INT NOT NULL,
    reason TEXT,
    performedBy INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicineId) REFERENCES medicines(id) ON DELETE CASCADE,
    FOREIGN KEY (performedBy) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed data for testing
INSERT INTO users (name, email, phone, role, password, doctorId, ktp) VALUES
('Boi', 'dadas@gmail.com', '08123456789', 'doctor', 'terserah', '135246', NULL),
('Boi', 'dummy1@gmail.com', '08123456789', 'doctor', 'helloworld', '135246', NULL),
('Emily', 'Emily@gmail.com', '081111111111', 'patient', 'whatever', NULL, '123456789');

INSERT INTO medicines (name, description, stock, unit) VALUES
('Amoxicillin 500mg', 'Antibiotic for bacterial infections', 100, 'capsules'),
('Paracetamol 500mg', 'Pain reliever and fever reducer', 200, 'tablets'),
('Ibuprofen 400mg', 'Anti-inflammatory pain reliever', 150, 'tablets');

INSERT INTO health_records (name, age, height, weight, bmi, category, userId) VALUES
('Emily', 25, 165.0, 55.0, 20.20, 'Normal', 3),
('John Doe', 30, 170.0, 70.0, 24.22, 'Normal', NULL),
('Jane Smith', 35, 160.0, 80.0, 31.25, 'Obesitas', NULL);

-- Sample inquiries
INSERT INTO inquiries (patientId, doctorId, message, status) VALUES
(3, 1, 'Saya mengalami demam tinggi dan batuk', 'pending'),
(3, 2, 'Apakah saya perlu vaksin flu?', 'answered');

-- Sample appointments
INSERT INTO kunjungan (patientId, doctorId, diagnosis, prescription, visitDate, status) VALUES
(3, 1, 'Common cold', 'Amoxicillin 500mg - 3x sehari', '2024-12-20 10:00:00', 'scheduled'),
(3, 2, 'Routine checkup', 'Paracetamol if needed', '2024-12-15 14:00:00', 'completed');

COMMIT;