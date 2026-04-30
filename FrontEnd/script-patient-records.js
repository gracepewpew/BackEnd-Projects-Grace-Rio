const API_URL = "http://localhost:3000/inquiry";

const recordsTable = document.getElementById("recordsTable");
const searchInput = document.getElementById("searchRecords");

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
    loadRecords();
    displayUserInfo();

    if (searchInput) {
        searchInput.addEventListener("input", searchRecords);
    }
});

// =======================
// LOAD RECORDS
// =======================
async function loadRecords() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) throw new Error("Failed to load records");

        const data = await response.json();
        const user = JSON.parse(localStorage.getItem("user"));

        // Filter hanya inquiry yang milik patient ini
        const patientRecords = data.filter(req => req.namaPasien === user.name);
        renderRecords(patientRecords);

    } catch (error) {
        console.error("Error:", error);
    }
}

// =======================
// RENDER TABLE
// =======================
function renderRecords(data) {
    recordsTable.innerHTML = "";

    if (data.length === 0) {
        recordsTable.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #999;">Belum ada riwayat kesehatan</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = `
            <tr>
                <td>${item.tanggalInquiry}</td>
                <td>${item.keluhan}</td>
                <td>Catatan tersedia</td>
                <td>Lihat detail</td>
                <td>
                    <button class="btn-edit" onclick="viewDetail(${item.id})">Detail</button>
                </td>
            </tr>
        `;

        recordsTable.innerHTML += row;
    });
}

// =======================
// VIEW DETAIL
// =======================
function viewDetail(id) {
    alert("Fitur detail riwayat kesehatan sedang dalam pengembangan!");
}

// =======================
// SEARCH
// =======================
function searchRecords() {
    const input = searchInput.value.toLowerCase();
    const rows = recordsTable.querySelectorAll("tr");

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
