const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
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
        const connection = await getConnection();

        // Create database if it doesn't exist
        await connection.execute('CREATE DATABASE IF NOT EXISTS amoxicillin_health');
        await connection.execute('USE amoxicillin_health');

        // Create users table
        await connection.execute(`
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

        // Create health_records table
        await connection.execute(`
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

        // Create medicines table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS medicines (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                stock INT DEFAULT 0,
                unit VARCHAR(50),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create inquiries table
        await connection.execute(`
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

        // Create kunjungan (visits) table
        await connection.execute(`
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

        // Create adjustments table
        await connection.execute(`
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
        await insertSeedData(connection);

        console.log('Database initialized successfully');
        return true;
    } catch (error) {
        console.error('Database initialization error:', error.message);
        console.log('⚠️  MySQL not available. Application will run in demo mode with JSON files.');
        console.log('To enable full functionality:');
        console.log('1. Install MySQL Server');
        console.log('2. Create database: CREATE DATABASE amoxicillin_health;');
        console.log('3. Run migration script: mysql -u root amoxicillin_health < database_migration.sql');
        return false;
    }
}

async function insertSeedData(connection) {
    try {
        // Insert sample users
        await connection.execute(`
            INSERT IGNORE INTO users (name, email, phone, role, password, doctorId, ktp) VALUES
            ('Boi', 'dadas@gmail.com', '08123456789', 'doctor', 'terserah', '135246', NULL),
            ('Boi', 'dummy1@gmail.com', '08123456789', 'doctor', 'helloworld', '135246', NULL),
            ('Emily', 'Emily@gmail.com', '081111111111', 'patient', 'whatever', NULL, '123456789')
        `);

        // Insert sample medicines
        await connection.execute(`
            INSERT IGNORE INTO medicines (name, description, stock, unit) VALUES
            ('Amoxicillin 500mg', 'Antibiotic for bacterial infections', 100, 'capsules'),
            ('Paracetamol 500mg', 'Pain reliever and fever reducer', 200, 'tablets'),
            ('Ibuprofen 400mg', 'Anti-inflammatory pain reliever', 150, 'tablets')
        `);

        console.log('Seed data inserted successfully');
    } catch (error) {
        console.log('Seed data insertion skipped (may already exist)');
    }
}

module.exports = {
    getConnection,
    initializeDatabase
};