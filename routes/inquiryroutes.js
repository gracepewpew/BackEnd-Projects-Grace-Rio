const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const router = express.Router();
const DATA_PATH = path.join(__dirname, "..", "data", "inquiry.json");

/**
 * Baca data inquiry dari file JSON asinkronus.
 */
async function readInquiryData() {
    try {
        await fs.access(DATA_PATH);
        const rawData = await fs.readFile(DATA_PATH, "utf8");
        return JSON.parse(rawData);
    } catch {
        return [];
    }
}

/**
 * Tulis data inquiry ke file JSON secara asinkronus.
 */
async function writeInquiryData(data) {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
}

/**
 * GET semua inquiry
 */
router.get("/", (request, response) => {
    readInquiryData().then(data => {
        response.status(200).json(data);
    }).catch(error => {
        response.status(500).json({ message: error.message });
    });
});

/**
 * GET inquiry berdasarkan ID
 */
router.get("/:id", (request, response) => {
    const id = parseInt(request.params.id, 10);
    readInquiryData().then(data => {
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
 * POST tambah inquiry baru
 */
router.post("/", (request, response) => {
    const { namaPasien, noKtp, noHp, email, keluhan, tanggalInquiry } = request.body;

    if (!namaPasien || !noKtp || !noHp || !email || !keluhan || !tanggalInquiry) {
        return response.status(400).json({ message: "Semua field harus diisi" });
    }

    readInquiryData().then(data => {
        const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
        const newInquiry = {
            id: newId,
            namaPasien,
            noKtp,
            noHp,
            email,
            keluhan,
            tanggalInquiry
        };

        data.push(newInquiry);
        return writeInquiryData(data).then(() => {
            response.status(201).json(newInquiry);
        });
    }).catch(error => {
        response.status(500).json({ message: error.message });
    });
});

/**
 * DELETE inquiry berdasarkan ID
 */
router.delete("/:id", (request, response) => {
    const id = parseInt(request.params.id, 10);

    readInquiryData().then(data => {
        const index = data.findIndex(item => item.id === id);

        if (index === -1) {
            return response.status(404).json({ message: "Data tidak ditemukan" });
        }

        data.splice(index, 1);
        return writeInquiryData(data).then(() => {
            response.status(200).json({ message: "Inquiry berhasil dihapus" });
        });
    }).catch(error => {
        response.status(500).json({ message: error.message });
    });
});

module.exports = router;
