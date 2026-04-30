const express = require("express");
const { getConnection } = require("../config/database");
const HealthModel = require("../models/HealthModel");

const router = express.Router();

// GET /health - Get all health records with pagination and filtering
router.get("/", async (request, response) => {
    try {
        const connection = await getConnection();

        // Pagination parameters
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Filtering parameters
        const { category, minAge, maxAge, userId } = request.query;

        let whereClause = '';
        let params = [];

        if (category) {
            whereClause += ' AND category = ?';
            params.push(category);
        }

        if (minAge) {
            whereClause += ' AND age >= ?';
            params.push(parseInt(minAge));
        }

        if (maxAge) {
            whereClause += ' AND age <= ?';
            params.push(parseInt(maxAge));
        }

        if (userId) {
            whereClause += ' AND userId = ?';
            params.push(parseInt(userId));
        }

        // Get total count for pagination
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total FROM health_records WHERE 1=1 ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // Get paginated data
        const [rows] = await connection.execute(
            `SELECT * FROM health_records WHERE 1=1 ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        response.status(200).json({
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

// GET /health/:id - Get single health record
router.get("/:id", async (request, response) => {
    try {
        const id = parseInt(request.params.id, 10);
        const connection = await getConnection();

        const [rows] = await connection.execute(
            'SELECT * FROM health_records WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return response.status(404).json({ message: "Data tidak ditemukan" });
        }

        response.status(200).json(rows[0]);

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

// POST /health - Create new health record
router.post("/", async (request, response) => {
    try {
        const { name, age, height, weight, userId } = request.body;

        if (!name || !age || age <= 0 || !height || height <= 0 || !weight || weight <= 0) {
            return response.status(400).json({ message: "Invalid input: all fields must be positive and required" });
        }

        const healthData = new HealthModel(name, age, height, weight);
        const connection = await getConnection();

        const [result] = await connection.execute(
            'INSERT INTO health_records (name, age, height, weight, bmi, category, userId) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [healthData.name, healthData.age, healthData.height, healthData.weight, healthData.bmi, healthData.category, userId || null]
        );

        response.status(201).json({
            id: result.insertId,
            ...healthData,
            userId: userId || null
        });

    } catch (error) {
        console.error(error);
        response.status(400).json({ message: error.message });
    }
});

// PUT /health/:id - Update health record
router.put("/:id", async (request, response) => {
    try {
        const id = parseInt(request.params.id, 10);
        const { name, age, height, weight, userId } = request.body;

        if (!name || !age || age <= 0 || !height || height <= 0 || !weight || weight <= 0) {
            return response.status(400).json({ message: "Invalid input: all fields must be positive and required" });
        }

        const connection = await getConnection();

        // Check if record exists
        const [existing] = await connection.execute(
            'SELECT * FROM health_records WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return response.status(404).json({ message: "Data tidak ditemukan" });
        }

        const healthData = new HealthModel(name, age, height, weight);

        await connection.execute(
            'UPDATE health_records SET name = ?, age = ?, height = ?, weight = ?, bmi = ?, category = ?, userId = ? WHERE id = ?',
            [healthData.name, healthData.age, healthData.height, healthData.weight, healthData.bmi, healthData.category, userId || null, id]
        );

        response.status(200).json({
            id,
            ...healthData,
            userId: userId || null,
            updatedAt: new Date()
        });

    } catch (error) {
        console.error(error);
        response.status(400).json({ message: error.message });
    }
});

// DELETE /health/:id - Delete health record
router.delete("/:id", async (request, response) => {
    try {
        const id = parseInt(request.params.id, 10);
        const connection = await getConnection();

        const [result] = await connection.execute(
            'DELETE FROM health_records WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return response.status(404).json({ message: "Data tidak ditemukan" });
        }

        response.status(200).json({ message: "Data berhasil dihapus" });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

module.exports = router;