-- Database schema untuk project UAS MediCare Clinic Real-Time
-- Cara cepat: import file ini di phpMyAdmin/MySQL, lalu jalankan npm install dan npm start.
-- Jika sebelumnya sudah pernah menjalankan versi lama, paling aman drop database clinic_uas_v3 lalu import ulang file ini agar dummy data baru bersih.

CREATE DATABASE IF NOT EXISTS clinic_uas_v3 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinic_uas_v3;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'pasien', 'dokter', 'customer_service') NOT NULL DEFAULT 'pasien',
  phone VARCHAR(20),
  profile_photo VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  location VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  department_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120),
  phone VARCHAR(20),
  specialization VARCHAR(120) NOT NULL,
  schedule VARCHAR(150) NOT NULL DEFAULT 'Senin-Jumat, 09:00-15:00',
  image VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_doctors_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  medical_record_number VARCHAR(30) NOT NULL UNIQUE,
  birth_date DATE,
  gender ENUM('Laki-laki', 'Perempuan'),
  blood_type VARCHAR(3),
  address TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NULL,
  doctor_id INT NULL,
  department_id INT NULL,
  assigned_by_cs_id INT NULL,
  patient_name VARCHAR(100) NOT NULL,
  patient_number VARCHAR(30),
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  appointment_date DATE NULL,
  appointment_time TIME NULL,
  symptoms TEXT,
  status ENUM('pending', 'requested', 'scheduled', 'completed', 'cancelled') DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
  CONSTRAINT fk_appointments_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_appointments_cs FOREIGN KEY (assigned_by_cs_id) REFERENCES users(id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS appointment_cancellations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  doctor_id INT NULL,
  patient_name VARCHAR(100) NOT NULL,
  patient_number VARCHAR(30),
  reason TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cancellations_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  CONSTRAINT fk_cancellations_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL,
  subject VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'replied') DEFAULT 'new',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_user_id INT NOT NULL,
  assigned_cs_id INT NULL,
  status ENUM('open', 'closed') DEFAULT 'open',
  subject VARCHAR(150) DEFAULT 'Live Chat Pasien',
  last_message_at DATETIME NULL,
  closed_at DATETIME NULL,
  closed_by_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_patient_user FOREIGN KEY (patient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_assigned_cs FOREIGN KEY (assigned_cs_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_chat_closed_by FOREIGN KEY (closed_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_user_id INT NOT NULL,
  sender_role VARCHAR(30) NOT NULL,
  message TEXT NOT NULL,
  message_type ENUM('text', 'system') DEFAULT 'text',
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_message_conversation FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_message_sender FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE
);
