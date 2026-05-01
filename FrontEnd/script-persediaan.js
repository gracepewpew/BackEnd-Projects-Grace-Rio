const API_URL = "http://localhost:3000/medicines";

const obatTable = document.getElementById("obatTable");
const searchInput = document.getElementById("searchObat");

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
    loadMedicines();
    setActiveMenu();

    if (searchInput) {
        searchInput.addEventListener("input", searchObat);
    }
});

// =======================
// LOAD DATA
// =======================
async function loadMedicines() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) throw new Error("Failed to load medicines");

        const result = await response.json();
        renderMedicines(result.data); // Access the data array

    } catch (error) {
        console.error("Error:", error);
        alert("Gagal memuat data obat. Pastikan server berjalan.");
    }
}

// =======================
// RENDER TABLE
// =======================
function renderMedicines(data) {
    obatTable.innerHTML = "";

    data.forEach(item => {
        // Map API fields to frontend expected fields
        const nama = item.name || "Unknown";
        const jenis = item.description || "Unknown";
        const stok = item.stock || 0;
        const satuan = item.unit || "Unknown";
        const expired = "2025-12-31"; // Default expiry date since API doesn't provide
        const reserve = "2025-12-31"; // Default reserve date since API doesn't provide
        const status = stok > 50 ? "Tersedia" : stok > 10 ? "Terbatas" : "Habis";

        const statusClass =
            status === "Tersedia" ? "aktif" :
            status === "Terbatas" ? "terbatas" : "nonaktif";

        const row = `
            <tr>
                <td>
                    <div class="obat-info">
                        <span>${nama}</span>
                    </div>
                </td>
                <td>${jenis}</td>
                <td>${stok}</td>
                <td>${satuan}</td>
                <td class="expired-date">${expired}</td>
                <td class="reserve-date">${reserve}</td>
                <td class="status-cell">
                    <span class="status-label ${statusClass}">${status}</span>
                </td>
                <td>
                    <button class="btn-edit" onclick="editMedicine(${item.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteMedicine(${item.id})">Hapus</button>
                </td>
            </tr>
        `;

        obatTable.innerHTML += row;
    });

    checkExpired();
}

// =======================
// EXPIRED LOGIC
// =======================
function checkExpired() {
    const rows = document.querySelectorAll("#obatTable tr");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    rows.forEach(row => {
        const expired = row.querySelector(".expired-date").textContent;
        const reserve = row.querySelector(".reserve-date").textContent;
        const statusCell = row.querySelector(".status-cell");

        const expiredDate = new Date(expired);
        const reserveDate = new Date(reserve);

        if (today > expiredDate) {
            statusCell.innerHTML = `
                <span class="expired-label">
                    EXPIRED (${expired})
                </span>
            `;
            row.classList.add("expired-row");

        } else {
            statusCell.innerHTML = `
                <span class="status aktif">Tersedia</span>
            `;
        }
    });
}

// =======================
// SEARCH
// =======================
function searchObat() {
    const input = searchInput.value.toLowerCase();
    const rows = obatTable.querySelectorAll("tr");

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");

        let found = false;

        for (let i = 0; i < cells.length - 2; i++) {
            const text = cells[i].textContent.toLowerCase();

            if (text.includes(input)) {
                found = true;
                break;
            }
        }

        row.style.display = found ? "" : "none";
    });
}

// =======================
// DELETE
// =======================
async function deleteMedicine(id) {
    if (!confirm("Yakin hapus obat?")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Delete gagal");

        loadMedicines();

    } catch (error) {
        console.error(error);
        alert("Gagal menghapus obat.");
    }
}

// =======================
// EDIT
// =======================
async function editMedicine(id) {
    // Find the medicine data from the current table
    const row = document.querySelector(`button[onclick="editMedicine(${id})"]`).closest('tr');
    const cells = row.querySelectorAll('td');

    const currentData = {
        name: cells[0].textContent.trim(),
        description: cells[1].textContent.trim(),
        stock: parseInt(cells[2].textContent.trim()),
        unit: cells[3].textContent.trim()
    };

    // Create edit form
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="text" value="${currentData.name}" id="edit-name-${id}"></td>
        <td><input type="text" value="${currentData.description}" id="edit-description-${id}"></td>
        <td><input type="number" value="${currentData.stock}" id="edit-stock-${id}"></td>
        <td><input type="text" value="${currentData.unit}" id="edit-unit-${id}"></td>
        <td colspan="4">
            <button class="btn-primary" onclick="saveEdit(${id})">Simpan</button>
            <button class="btn-secondary" onclick="cancelEdit(${id})">Batal</button>
        </td>
    `;

    // Replace the current row with edit form
    row.parentNode.replaceChild(newRow, row);
}

// =======================
// SAVE EDIT
// =======================
async function saveEdit(id) {
    const name = document.getElementById(`edit-name-${id}`).value.trim();
    const description = document.getElementById(`edit-description-${id}`).value.trim();
    const stock = parseInt(document.getElementById(`edit-stock-${id}`).value);
    const unit = document.getElementById(`edit-unit-${id}`).value.trim();

    if (!name || isNaN(stock)) {
        alert("Nama dan stok harus diisi dengan benar!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                description,
                stock,
                unit
            })
        });

        if (!response.ok) throw new Error("Update gagal");

        loadMedicines(); // Reload the table

    } catch (error) {
        console.error(error);
        alert("Gagal mengupdate obat.");
    }
}

// =======================
// CANCEL EDIT
// =======================
function cancelEdit(id) {
    loadMedicines(); // Simply reload to cancel edit
}

// =======================
// TOGGLE FORM
// =======================
function toggleForm() {
    const form = document.getElementById("formObat");
    form.style.display = form.style.display === "none" ? "block" : "none";
}

// =======================
// ADD FORM ROW
// =======================
function addForm() {
    const formContainer = document.getElementById("formContainer");
    const newRow = document.createElement("div");
    newRow.classList.add("form-item");
    newRow.innerHTML = `
        <input type="text" placeholder="Nama Obat">
        <input type="text" placeholder="Jenis">
        <input type="number" placeholder="Stok">
        <input type="text" placeholder="Satuan">
        <input type="date">
    `;
    formContainer.appendChild(newRow);
}

// =======================
// MENU ACTIVE
// =======================
function setActiveMenu() {
    const currentPage = window.location.pathname.split("/").pop();

    document.querySelectorAll(".menu a").forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === currentPage);
    });
}