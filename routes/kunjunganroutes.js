const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const router = express.Router();
const DATA_PATH = path.join(__dirname, "..", "data", "kunjungan.json");

/**
 * Baca data kunjungan dari file JSON asinkronus.
 */
async function readKunjunganData() {
    try {
        await fs.access(DATA_PATH);
        const rawData = await fs.readFile(DATA_PATH, "utf8");
        return JSON.parse(rawData);
    } catch {
        return [];
    }
}

/**
 * Tulis data kunjungan ke file JSON secara asinkronus.
 */
async function writeKunjunganData(data) {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
}

/**
 * GET semua kunjungan
 */
router.get("/", (request, response) => {
    readKunjunganData().then(data => {
        response.status(200).json(data);
    }).catch(error => {
        response.status(500).json({ message: error.message });
    });
});

/**
 * GET kunjungan berdasarkan ID
 */
router.get("/:id", (request, response) => {
    const id = parseInt(request.params.id, 10);
    readKunjunganData().then(data => {
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
 * POST tambah kunjungan baru
 */
router.post("/", (request, response) => {
    const { noKunjungan, tanggalKunjungan, namaPasien, noHp, alamat, jenisLayanan, status } = request.body;

    if (!noKunjungan || !tanggalKunjungan || !namaPasien || !noHp || !alamat || !jenisLayanan || !status) {
        return response.status(400).json({ message: "Semua field harus diisi" });
    }

    readKunjunganData().then(data => {
        const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
        const newKunjungan = {
            id: newId,
            noKunjungan,
            tanggalKunjungan,
            namaPasien,
            noHp,
            alamat,
            jenisLayanan,
            status
        };

        data.push(newKunjungan);
        return writeKunjunganData(data).then(() => {
            response.status(201).json(newKunjungan);
        });
    }).catch(error => {
        response.status(500).json({ message: error.message });
    });
});

/**
 * DELETE kunjungan berdasarkan ID
 */
router.delete("/:id", (request, response) => {
    const id = parseInt(request.params.id, 10);

    readKunjunganData().then(data => {
        const index = data.findIndex(item => item.id === id);

        if (index === -1) {
            return response.status(404).json({ message: "Data tidak ditemukan" });
        }

        data.splice(index, 1);
        return writeKunjunganData(data).then(() => {
            response.status(200).json({ message: "Kunjungan berhasil dihapus" });
        });
    }).catch(error => {
        response.status(500).json({ message: error.message });
    });
});

module.exports = router;
