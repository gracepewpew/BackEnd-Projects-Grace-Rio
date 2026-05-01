const API_URL = "http://localhost:3000/kunjungan";

const requestTable = document.getElementById("requestTable");
const searchInput = document.getElementById("searchRequest");

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
    loadRequests();
    setDefaultDate();
    displayUserInfo();

    if (searchInput) {
        searchInput.addEventListener("input", searchRequests);
    }
});

// =======================
// SET DEFAULT DATE
// =======================
function setDefaultDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById("tanggalRequest").value = tomorrow.toISOString().split("T")[0];
}

// =======================
// LOAD REQUESTS
// =======================
async function loadRequests() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) throw new Error("Failed to load requests");

        const data = await response.json();
        const user = JSON.parse(localStorage.getItem("user"));

        // Filter hanya kunjungan milik patient ini
        const patientRequests = data.filter(req => req.namaPasien === user.name);
        renderRequests(patientRequests);

    } catch (error) {
        console.error("Error:", error);
    }
}

// =======================
// RENDER TABLE
// =======================
function renderRequests(data) {
    requestTable.innerHTML = "";

    if (data.length === 0) {
        requestTable.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #999;">Belum ada permintaan kunjungan</td></tr>';
        return;
    }

    data.forEach(item => {
        const statusClass = 
            item.status === "Done" ? "status-done" : 
            item.status === "Confirmed" ? "status-confirmed" : "status-pending";

        const row = `
            <tr>
                <td>${item.noKunjungan}</td>
                <td>${item.tanggalKunjungan}</td>
                <td>${item.jenisLayanan}</td>
                <td>${item.keluhan || "-"}</td>
                <td><span class="status ${statusClass}">${item.status}</span></td>
                <td>
                    <button class="btn-delete" onclick="cancelRequest(${item.id})">Batal</button>
                </td>
            </tr>
        `;

        requestTable.innerHTML += row;
    });
}

// =======================
// SUBMIT REQUEST
// =======================
async function submitRequest() {
    const user = JSON.parse(localStorage.getItem("user"));
    const tanggalRequest = document.getElementById("tanggalRequest").value.trim();
    const jenisLayanan = document.getElementById("jenisLayanan").value.trim();
    const keluhan = document.getElementById("keluhan").value.trim();

    if (!user || !user.name) {
        alert("Akun tidak valid. Silakan logout dan login kembali.");
        return;
    }

    const missingFields = [];
    if (!tanggalRequest) missingFields.push("Tanggal Diinginkan");
    if (!jenisLayanan) missingFields.push("Jenis Layanan");
    if (!keluhan) missingFields.push("Keluhan/Gejala");

    if (missingFields.length > 0) {
        alert("Field berikut harus diisi: " + missingFields.join(", ") + ".");
        return;
    }

    // Generate no kunjungan
    const counter = localStorage.getItem("patientKunjunganCounter") || "0";
    const noKunjungan = "PKJ-" + (parseInt(counter) + 1).toString().padStart(4, "0");

    const data = {
        noKunjungan,
        tanggalKunjungan: tanggalRequest,
        namaPasien: user.name,
        jenisLayanan,
        keluhan,
        status: "Pending"
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal kirim");

        // Update counter
        localStorage.setItem("patientKunjunganCounter", (parseInt(counter) + 1).toString());

        alert("Permintaan kunjungan terkirim! Dokter akan menghubungi Anda.");
        resetForm();
        loadRequests();

    } catch (error) {
        console.error(error);
        alert("Gagal mengirim permintaan. " + (error.message || "Silakan coba lagi."));
    }
}

// =======================
// RESET FORM
// =======================
function resetForm() {
    setDefaultDate();
    document.getElementById("jenisLayanan").value = "";
    document.getElementById("keluhan").value = "";
}

// =======================
// CANCEL REQUEST
// =======================
async function cancelRequest(id) {
    if (!confirm("Yakin ingin membatalkan permintaan kunjungan?")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Delete gagal");

        alert("Permintaan berhasil dibatalkan");
        loadRequests();

    } catch (error) {
        console.error(error);
        alert("Gagal membatalkan permintaan.");
    }
}

// =======================
// SEARCH
// =======================
function searchRequests() {
    const input = searchInput.value.toLowerCase();
    const rows = requestTable.querySelectorAll("tr");

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        let found = false;

        for (let i = 0; i < cells.length - 1; i++) {
            const text = cells[i].textContent.toLowerCase();

            if (text.includes(input)) {
                found = true;
                break;
            }
        }

        row.style.display = found ? "" : "none";
    });
}
