const express = require("express");
const { getConnection } = require("../config/database");

const router = express.Router();

// GET /medicines - Get all medicines with pagination and filtering
router.get("/", async (request, response) => {
    try {
        const connection = await getConnection();

        // Pagination parameters
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Filtering parameters
        const { name, minStock, maxStock } = request.query;

        let whereClause = '';
        let params = [];

        if (name) {
            whereClause += ' AND name LIKE ?';
            params.push(`%${name}%`);
        }

        if (minStock) {
            whereClause += ' AND stock >= ?';
            params.push(parseInt(minStock));
        }

        if (maxStock) {
            whereClause += ' AND stock <= ?';
            params.push(parseInt(maxStock));
        }

        // Get total count for pagination
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total FROM medicines WHERE 1=1 ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // Get paginated data
        const [rows] = await connection.execute(
            `SELECT * FROM medicines WHERE 1=1 ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
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

// GET /medicines/:id - Get single medicine
router.get("/:id", async (request, response) => {
    try {
        const id = parseInt(request.params.id, 10);
        const connection = await getConnection();

        const [rows] = await connection.execute(
            'SELECT * FROM medicines WHERE id = ?',
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

// POST /medicines - Create new medicine
router.post("/", async (request, response) => {
    try {
        const { name, description, stock, unit } = request.body;

        if (!name || stock === undefined) {
            return response.status(400).json({ message: "Name and stock are required" });
        }

        const connection = await getConnection();

        const [result] = await connection.execute(
            'INSERT INTO medicines (name, description, stock, unit) VALUES (?, ?, ?, ?)',
            [name, description || null, parseInt(stock), unit || null]
        );

        response.status(201).json({
            id: result.insertId,
            name,
            description,
            stock: parseInt(stock),
            unit,
            createdAt: new Date()
        });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

// PUT /medicines/:id - Update medicine
router.put("/:id", async (request, response) => {
    try {
        const id = parseInt(request.params.id, 10);
        const { name, description, stock, unit } = request.body;

        const connection = await getConnection();

        // Check if medicine exists
        const [existing] = await connection.execute(
            'SELECT * FROM medicines WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return response.status(404).json({ message: "Data tidak ditemukan" });
        }

        await connection.execute(
            'UPDATE medicines SET name = ?, description = ?, stock = ?, unit = ? WHERE id = ?',
            [name || existing[0].name, description || existing[0].description, stock !== undefined ? parseInt(stock) : existing[0].stock, unit || existing[0].unit, id]
        );

        response.status(200).json({
            id,
            name: name || existing[0].name,
            description: description || existing[0].description,
            stock: stock !== undefined ? parseInt(stock) : existing[0].stock,
            unit: unit || existing[0].unit
        });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

// DELETE /medicines/:id - Delete medicine
router.delete("/:id", async (request, response) => {
    try {
        const id = parseInt(request.params.id, 10);
        const connection = await getConnection();

        const [result] = await connection.execute(
            'DELETE FROM medicines WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return response.status(404).json({ message: "Data tidak ditemukan" });
        }

        response.status(200).json({ message: "Medicine berhasil dihapus" });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

module.exports = router;
