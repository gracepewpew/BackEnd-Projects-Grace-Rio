const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const router = express.Router();
const DATA_PATH = path.join(__dirname, "..", "data", "adjust.json");

/**
 * Baca data adjust dari file JSON asinkronus.
 */
async function readAdjustData() {
    try {
        await fs.access(DATA_PATH);
        const rawData = await fs.readFile(DATA_PATH, "utf8");
        return JSON.parse(rawData);
    } catch {
        return [];
    }
}

/**
 * Tulis data adjust ke file JSON secara asinkronus.
 */
async function writeAdjustData(data) {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
}

/**
 * GET semua adjust records
 */
router.get("/", (request, response) => {
    readAdjustData().then(data => {
        response.status(200).json(data);
    }).catch(error => {
        response.status(500).json({ message: error.message });
    });
});

/**
 * GET adjust record berdasarkan ID
 */
router.get("/:id", (request, response) => {
    const id = parseInt(request.params.id, 10);
    readAdjustData().then(data => {
        const foundData = data.find(item => item.id === id);

        if (!foundData) {
            return response.status(404).json({ message: "Data tidak ditemukan" });
        }

        response.status(200).json(foundData);
    }).catch(error => {
        response.status(500).json({ message: error.message });
    });
});

/**
 * POST tambah adjust record baru
 */
router.post("/", (request, response) => {
    const { noBukti, tanggal, tipe, items } = request.body;

    if (!noBukti || !tanggal || !tipe || !items || items.length === 0) {
        return response.status(400).json({ message: "Semua field harus diisi" });
    }

    readAdjustData().then(data => {
        const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
        const newAdjust = {
            id: newId,
            noBukti,
            tanggal,
            tipe,
            items,
            createdAt: new Date().toISOString()
        };

        data.push(newAdjust);
        return writeAdjustData(data).then(() => {
            response.status(201).json(newAdjust);
        });
    }).catch(error => {
        response.status(500).json({ message: error.message });
    });
});

/**
 * DELETE adjust record berdasarkan ID
 */
router.delete("/:id", (request, response) => {
    const id = parseInt(request.params.id, 10);

    readAdjustData().then(data => {
        const index = data.findIndex(item => item.id === id);

        if (index === -1) {
            return response.status(404).json({ message: "Data tidak ditemukan" });
        }

        data.splice(index, 1);
        return writeAdjustData(data).then(() => {
            response.status(200).json({ message: "Adjust record berhasil dihapus" });
        });
    }).catch(error => {
        response.status(500).json({ message: error.message });
    });
});

module.exports = router;
