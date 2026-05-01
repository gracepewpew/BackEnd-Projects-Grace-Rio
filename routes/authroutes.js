const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const { getConnection } = require("../config/database");

const router = express.Router();
const USERS_PATH = path.join(__dirname, "..", "data", "users.json");

// Flag to track database availability
let dbAvailable = false;

// Check database availability
getConnection().then(() => {
    dbAvailable = true;
}).catch(() => {
    dbAvailable = false;
});

/**
 * Fallback: Baca data users dari file JSON asinkronus.
 */
async function readUsersData() {
    try {
        await fs.access(USERS_PATH);
        const rawData = await fs.readFile(USERS_PATH, "utf8");
        return JSON.parse(rawData);
    } catch {
        return [];
    }
}

/**
 * Fallback: Tulis data users ke file JSON secara asinkronus.
 */
async function writeUsersData(data) {
    await fs.mkdir(path.dirname(USERS_PATH), { recursive: true });
    await fs.writeFile(USERS_PATH, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Generate simple JWT token (for testing purposes)
 * In production, use proper JWT library like 'jsonwebtoken'
 */
function generateToken(userId, role) {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
    const payload = Buffer.from(JSON.stringify({ userId, role, iat: Date.now() })).toString("base64");
    const signature = Buffer.from(`${header}.${payload}.secret`).toString("base64");
    return `${header}.${payload}.${signature}`;
}

/**
 * POST register user
 */
router.post("/register", async (request, response) => {
    const { name, email, phone, role, password, doctorId, ktp } = request.body;

    // Validasi input
    if (!name || !email || !phone || !role || !password) {
        return response.status(400).json({ message: "Semua field wajib diisi" });
    }

    if (!["doctor", "patient", "nurse"].includes(role)) {
        return response.status(400).json({ message: "Role tidak valid" });
    }

    if (role === "doctor" && !doctorId) {
        return response.status(400).json({ message: "ID Dokter wajib diisi untuk role dokter" });
    }

    if (role === "patient" && !ktp) {
        return response.status(400).json({ message: "No. KTP wajib diisi untuk role pasien" });
    }

    try {
        if (dbAvailable) {
            // Use database
            const connection = await getConnection();

            // Cek email sudah terdaftar
            const [existingUsers] = await connection.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingUsers.length > 0) {
                return response.status(400).json({ message: "Email sudah terdaftar" });
            }

            // Insert user baru
            const [result] = await connection.execute(
                'INSERT INTO users (name, email, phone, role, password, doctorId, ktp) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, email, phone, role, password, doctorId || null, ktp || null]
            );

            return response.status(201).json({
                message: "Registrasi berhasil",
                user: {
                    id: result.insertId,
                    name,
                    email,
                    phone,
                    role,
                    ...(role === "doctor" && { doctorId: doctorId || null }),
                    ...(role === "patient" && { ktp: ktp || null })
                }
            });
        } else {
            // Fallback to JSON
            const users = await readUsersData();

            // Cek email sudah terdaftar
            const existingUser = users.find(u => u.email === email);
            if (existingUser) {
                return response.status(400).json({ message: "Email sudah terdaftar" });
            }

            // Buat user baru
            const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
            const newUser = {
                id: newId,
                name,
                email,
                phone,
                role,
                password, // Note: In production, hash password with bcrypt
                createdAt: new Date().toISOString(),
                ...(role === "doctor" && { doctorId }),
                ...(role === "patient" && { ktp })
            };

            users.push(newUser);
            await writeUsersData(users);

            return response.status(201).json({
                message: "Registrasi berhasil",
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone,
                    role: newUser.role,
                    ...(newUser.role === "doctor" && { doctorId: newUser.doctorId }),
                    ...(newUser.role === "patient" && { ktp: newUser.ktp })
                }
            });
        }
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

/**
 * POST login user
 */
router.post("/login", async (request, response) => {
    const { email, password, role } = request.body;

    // Validasi input
    if (!email || !password || !role) {
        return response.status(400).json({ message: "Email, password, dan role harus diisi" });
    }

    try {
        if (dbAvailable) {
            // Use database
            const connection = await getConnection();

            // Cari user berdasarkan email dan role
            const [users] = await connection.execute(
                'SELECT id, name, email, role, password FROM users WHERE email = ? AND role = ?',
                [email, role]
            );

            if (users.length === 0) {
                return response.status(401).json({ message: "Email atau password salah" });
            }

            const user = users[0];

            // Validasi password (In production, use bcrypt.compare)
            if (user.password !== password) {
                return response.status(401).json({ message: "Email atau password salah" });
            }

            // Generate token
            const token = generateToken(user.id, user.role);

            return response.status(200).json({
                message: "Login berhasil",
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    ...(user.role === 'doctor' && { doctorId: user.doctorId }),
                    ...(user.role === 'patient' && { ktp: user.ktp })
                }
            });
        } else {
            // Fallback to JSON
            const users = await readUsersData();

            // Cari user berdasarkan email dan role
            const user = users.find(u => u.email === email && u.role === role);

            if (!user) {
                return response.status(401).json({ message: "Email atau password salah" });
            }

            // Validasi password (In production, use bcrypt.compare)
            if (user.password !== password) {
                return response.status(401).json({ message: "Email atau password salah" });
            }

            // Generate token
            const token = generateToken(user.id, user.role);

            return response.status(200).json({
                message: "Login berhasil",
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    ...(user.role === 'doctor' && { doctorId: user.doctorId }),
                    ...(user.role === 'patient' && { ktp: user.ktp })
                }
            });
        }
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

/**
 * GET user profile (requires token)
 */
router.get("/profile", async (request, response) => {
    const token = request.headers.authorization?.split(" ")[1];

    if (!token) {
        return response.status(401).json({ message: "Token tidak ditemukan" });
    }

    try {
        // Decode token (simple implementation, use proper JWT validation in production)
        const parts = token.split(".");
        if (parts.length !== 3) {
            return response.status(401).json({ message: "Token tidak valid" });
        }

        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        const connection = await getConnection();

        const [users] = await connection.execute(
            'SELECT id, name, email, role, phone, doctorId, ktp, createdAt FROM users WHERE id = ?',
            [payload.userId]
        );

        if (users.length === 0) {
            return response.status(404).json({ message: "User tidak ditemukan" });
        }

        const user = users[0];

        return response.status(200).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                ...(user.role === 'doctor' && { doctorId: user.doctorId }),
                ...(user.role === 'patient' && { ktp: user.ktp }),
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error(error);
        return response.status(401).json({ message: "Token tidak valid" });
    }
});

module.exports = router;
