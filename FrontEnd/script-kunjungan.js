const API_URL = "http://localhost:3000/kunjungan";

const kunjunganTable = document.getElementById("kunjunganTable");
const searchInput = document.getElementById("searchKunjungan");

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
    loadKunjungans();
    initializeForm();
    setActiveMenu();

    if (searchInput) {
        searchInput.addEventListener("input", searchKunjungan);
    }

    document.getElementById("namaPasienKunjungan").addEventListener("input", function() {
        this.value = this.value.toUpperCase();
    });
});

// =======================
// INIT FORM
// =======================
function initializeForm() {
    document.getElementById("noKunjungan").value = generateNoKunjungan();
    document.getElementById("tanggalKunjungan").value = new Date().toISOString().split("T")[0];
}

// =======================
// GENERATE NO KUNJUNGAN
// =======================
function generateNoKunjungan() {
    let last = localStorage.getItem("kunjunganCounter") || "0";
    let next = parseInt(last) + 1;

    return "KJG-" + next.toString().padStart(4, "0");
}

// =======================
// LOAD DATA
// =======================
async function loadKunjungans() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) throw new Error("Failed to load kunjungans");

        const data = await response.json();
        renderKunjungans(data);

    } catch (error) {
        console.error("Error:", error);
        alert("Gagal memuat data kunjungan. Pastikan server berjalan.");
    }
}

// =======================
// RENDER TABLE
// =======================
function renderKunjungans(data) {
    kunjunganTable.innerHTML = "";

    data.forEach(item => {
        const statusClass = 
            item.status === "Done" ? "status-done" : 
            item.status === "Confirmed" ? "status-confirmed" : "status-pending";

        const row = `
            <tr>
                <td>${item.noKunjungan}</td>
                <td>${item.namaPasien}</td>
                <td>${item.noHp}</td>
                <td>${item.jenisLayanan}</td>
                <td>${item.tanggalKunjungan}</td>
                <td><span class="status ${statusClass}">${item.status}</span></td>
                <td>
                    <button class="btn-edit" onclick="editKunjungan(${item.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteKunjungan(${item.id})">Hapus</button>
                </td>
            </tr>
        `;

        kunjunganTable.innerHTML += row;
    });
}

// =======================
// TOGGLE FORM
// =======================
function toggleForm() {
    const form = document.getElementById("formKunjungan");
    form.style.display = form.style.display === "none" ? "block" : "none";
    
    if (form.style.display === "block") {
        initializeForm();
    }
}

// =======================
// SIMPAN DATA
// =======================
async function simpanKunjungan() {
    const noKunjungan = document.getElementById("noKunjungan").value;
    const tanggalKunjungan = document.getElementById("tanggalKunjungan").value;
    const namaPasien = document.getElementById("namaPasienKunjungan").value;
    const noHp = document.getElementById("noHpKunjungan").value;

    const jenisLayanan = document.getElementById("jenisLayanan").value;
    const status = document.getElementById("statusKunjungan").value;

    if (!noKunjungan || !tanggalKunjungan || !namaPasien || !noHp || !jenisLayanan || !status) {
        alert("Semua field harus diisi!");
        return;
    }

    const data = {
        noKunjungan,
        tanggalKunjungan,
        namaPasien,
        noHp,
        jenisLayanan,
        status
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error("Gagal simpan");

        // Increment counter
        let last = localStorage.getItem("kunjunganCounter") || "0";
        localStorage.setItem("kunjunganCounter", (parseInt(last) + 1).toString());

        alert("Kunjungan berhasil disimpan!");
        toggleForm();
        resetForm();
        loadKunjungans();

    } catch (error) {
        console.error(error);
        alert("Gagal menyimpan kunjungan.");
    }
}

// =======================
// RESET FORM
// =======================
function resetForm() {
    document.getElementById("tanggalKunjungan").value = "";
    document.getElementById("namaPasienKunjungan").value = "";
    document.getElementById("noHpKunjungan").value = "";
    document.getElementById("jenisLayanan").value = "";
    document.getElementById("statusKunjungan").value = "";
}

// =======================
// EDIT
// =======================
function editKunjungan(id) {
    alert("Fitur edit sedang dalam pengembangan!");
}

// =======================
// DELETE
// =======================
async function deleteKunjungan(id) {
    if (!confirm("Yakin hapus kunjungan?")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Delete gagal");

        loadKunjungans();

    } catch (error) {
        console.error(error);
        alert("Gagal menghapus kunjungan.");
    }
}

// =======================
// SEARCH
// =======================
function searchKunjungan() {
    const input = searchInput.value.toLowerCase();
    const rows = kunjunganTable.querySelectorAll("tr");

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

// =======================
// MENU ACTIVE
// =======================
function setActiveMenu() {
    const currentPage = window.location.pathname.split("/").pop();

    document.querySelectorAll(".menu a").forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === currentPage);
    });
}
