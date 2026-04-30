const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '0pipinLoopyme030new',
    database: process.env.DB_NAME || 'amoxicillin_health',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

async function getConnection() {
    if (!pool) {
        pool = mysql.createPool(dbConfig);
    }
    return pool;
}

async function initializeDatabase() {
    try {
        // First create connection without database to create it
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        // Create database if it doesn't exist
        await connection.query('CREATE DATABASE IF NOT EXISTS amoxicillin_health');
        await connection.end();

        // Now get the pool for the actual database
        const pool = await getConnection();

        // Create tables
        await pool.query(`
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
            )
        `);

        await pool.query(`
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
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS medicines (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                stock INT DEFAULT 0,
                unit VARCHAR(50),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS inquiries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patientId INT,
                doctorId INT,
                message TEXT NOT NULL,
                status ENUM('pending', 'answered', 'closed') DEFAULT 'pending',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patientId) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (doctorId) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await pool.query(`
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
            )
        `);

        await pool.query(`
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
            )
        `);

        // Insert seed data
        await insertSeedData(pool);

        console.log('✅ Database initialized successfully');
        return true;
    } catch (error) {
        console.error('Database initialization error:', error.message);
        console.log('⚠️  MySQL not available. Application will run in demo mode with JSON files.');
        console.log('To enable full functionality:');
        console.log('1. Ensure MySQL Server is running');
        console.log('2. Database will be created automatically on first run');
        return false;
    }
}

async function insertSeedData(pool) {
    try {
        // Insert sample users
        await pool.query(`
            INSERT IGNORE INTO users (name, email, phone, role, password, doctorId, ktp) VALUES
            ('Boi', 'dadas@gmail.com', '08123456789', 'doctor', 'terserah', '135246', NULL),
            ('Boi', 'dummy1@gmail.com', '08123456789', 'doctor', 'helloworld', '135246', NULL),
            ('Emily', 'Emily@gmail.com', '081111111111', 'patient', 'whatever', NULL, '123456789'),
            ('Gpw', 'grace.wijaya2@gmail.com', '082161231919', 'patient', '123456', NULL, '210289200202')
        `);

        // Insert sample medicines
        await pool.query(`
            INSERT IGNORE INTO medicines (name, description, stock, unit) VALUES
            ('Amoxicillin 500mg', 'Antibiotic for bacterial infections', 100, 'capsules'),
            ('Paracetamol 500mg', 'Pain reliever and fever reducer', 200, 'tablets'),
            ('Ibuprofen 400mg', 'Anti-inflammatory pain reliever', 150, 'tablets')
        `);

        console.log('✅ Seed data inserted successfully');
    } catch (error) {
        console.log('ℹ️  Seed data insertion skipped (may already exist)');
    }
}

module.exports = {
    getConnection,
    initializeDatabase
};