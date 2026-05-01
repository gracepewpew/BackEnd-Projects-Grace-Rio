const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const { getConnection } = require("../config/database");

const router = express.Router();
const MEDICINES_PATH = path.join(__dirname, "..", "data", "medicines.json");

// Flag to track database availability
let dbAvailable = false;

// Check database availability
getConnection().then(() => {
    dbAvailable = true;
}).catch(() => {
    dbAvailable = false;
});

/**
 * Baca data medicines dari file JSON asinkronus.
 */
async function readMedicinesData() {
    try {
        await fs.access(MEDICINES_PATH);
        const rawData = await fs.readFile(MEDICINES_PATH, "utf8");
        return JSON.parse(rawData);
    } catch {
        return [];
    }
}

/**
 * Tulis data medicines ke file JSON secara asinkronus.
 */
async function writeMedicinesData(data) {
    await fs.mkdir(path.dirname(MEDICINES_PATH), { recursive: true });
    await fs.writeFile(MEDICINES_PATH, JSON.stringify(data, null, 2), "utf8");
}

// GET /medicines - Get all medicines with pagination and filtering
router.get("/", async (request, response) => {
    try {
        if (dbAvailable) {
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
        } else {
            // Fallback to JSON
            const medicines = await readMedicinesData();

            // Simple filtering (no pagination for JSON fallback)
            let filteredMedicines = medicines;
            const { name, minStock, maxStock } = request.query;

            if (name) {
                filteredMedicines = filteredMedicines.filter(item =>
                    item.name && item.name.toLowerCase().includes(name.toLowerCase())
                );
            }

            if (minStock) {
                filteredMedicines = filteredMedicines.filter(item =>
                    item.stock >= parseInt(minStock)
                );
            }

            if (maxStock) {
                filteredMedicines = filteredMedicines.filter(item =>
                    item.stock <= parseInt(maxStock)
                );
            }

            response.status(200).json({
                data: filteredMedicines,
                pagination: {
                    page: 1,
                    limit: filteredMedicines.length,
                    total: filteredMedicines.length,
                    totalPages: 1
                }
            });
        }

    } catch (error) {
        console.error(error);
        // Fallback to JSON on any error
        try {
            const medicines = await readMedicinesData();
            response.status(200).json({
                data: medicines,
                pagination: {
                    page: 1,
                    limit: medicines.length,
                    total: medicines.length,
                    totalPages: 1
                }
            });
        } catch (jsonError) {
            response.status(500).json({ message: "Terjadi kesalahan server" });
        }
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

        // Use JSON fallback directly
        const medicines = await readMedicinesData();
        const index = medicines.findIndex(item => item.id === id);

        if (index === -1) {
            return response.status(404).json({ message: "Data tidak ditemukan" });
        }

        // Update the medicine
        medicines[index] = {
            ...medicines[index],
            name: name || medicines[index].name,
            description: description || medicines[index].description,
            stock: stock !== undefined ? parseInt(stock) : medicines[index].stock,
            unit: unit || medicines[index].unit
        };

        await writeMedicinesData(medicines);

        response.status(200).json(medicines[index]);

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

// DELETE /medicines/:id - Delete medicine
router.delete("/:id", async (request, response) => {
    try {
        const id = parseInt(request.params.id, 10);

        // Use JSON fallback directly
        const medicines = await readMedicinesData();
        const index = medicines.findIndex(item => item.id === id);

        if (index === -1) {
            return response.status(404).json({ message: "Data tidak ditemukan" });
        }

        medicines.splice(index, 1);
        await writeMedicinesData(medicines);

        response.status(200).json({ message: "Medicine berhasil dihapus" });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

module.exports = router;
