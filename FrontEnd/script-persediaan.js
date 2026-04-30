const API_URL = "http://localhost:3000/medicines";

const obatTable = document.getElementById("obatTable");
const searchInput = document.getElementById("searchObat");

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
    loadMedicines();
    setupImageModal();
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

        const data = await response.json();
        renderMedicines(data);

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

        const statusClass =
            item.status === "Tersedia" ? "aktif" :
            item.status === "Terbatas" ? "terbatas" : "nonaktif";

        const row = `
            <tr>
                <td>
                    <div class="obat-info">
                        <img 
                            src="${item.image || '../images/default.png'}"
                            class="obat-img"
                            onclick="expandImage(this)"
                        >
                        <span>${item.nama}</span>
                    </div>
                </td>
                <td>${item.jenis}</td>
                <td>${item.stok}</td>
                <td>${item.satuan}</td>
                <td class="expired-date">${item.expired}</td>
                <td class="reserve-date">${item.reserve}</td>
                <td class="status-cell"></td>
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
// IMAGE MODAL (KEEP 🔥)
// =======================
function setupImageModal() {
    const modal = document.createElement("div");
    modal.id = "imageModal";
    modal.innerHTML = `
        <span id="closeModal">&times;</span>
        <img id="modalImg">
    `;

    document.body.appendChild(modal);

    document.getElementById("closeModal").onclick = () => {
        modal.style.display = "none";
    };

    modal.onclick = () => {
        modal.style.display = "none";
    };
}

function expandImage(img) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");

    modal.style.display = "flex";
    modalImg.src = img.src;
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