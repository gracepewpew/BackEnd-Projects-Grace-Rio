// API base URL for nurse data
const API_URL = "http://localhost:3000/suster";

// DOM elements
const addSusterBtn = document.getElementById("addSusterBtn");
const susterModal = document.getElementById("susterModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const susterForm = document.getElementById("susterForm");
const susterTable = document.getElementById("susterTable");
const searchInput = document.getElementById("searchInput");
const modalTitle = document.getElementById("modalTitle");

// Load susters on page load
document.addEventListener("DOMContentLoaded", () => {
    loadSusters();
    // Attach event listeners
    addSusterBtn.addEventListener("click", openModal);
    closeModal.addEventListener("click", closeModalFunc);
    cancelBtn.addEventListener("click", closeModalFunc);
    susterForm.addEventListener("submit", handleFormSubmit);
    searchInput.addEventListener("input", searchData);
});

// Load and display susters
async function loadSusters() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to load susters");
        const susters = await response.json();
        renderTable(susters);
    } catch (error) {
        console.error("Error loading susters:", error);
        alert("Gagal memuat data suster. Pastikan server berjalan.");
    }
}

// Render table rows
function renderTable(data) {
    if (!susterTable) return;
    susterTable.innerHTML = "";
    data.forEach(item => {
        const statusClass = item.status === "Aktif" ? "aktif" : item.status === "Cuti" ? "cuti" : "nonaktif";
        const row = `
            <tr>
                <td>${item.code}</td>
                <td>${item.name}</td>
                <td>${item.gender}</td>
                <td>${item.phone}</td>
                <td>${item.email}</td>
                <td>${item.division}</td>
                <td>${item.shift}</td>
                <td><span class="status ${statusClass}">${item.status}</span></td>
                <td>
                    <button class="btn-edit" onclick="editSuster(${item.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteSuster(${item.id})">Hapus</button>
                </td>
            </tr>
        `;
        susterTable.innerHTML += row;
    });
}

// Open modal for add or edit
function openModal(susterId = null) {
    if (susterId) {
        modalTitle.textContent = "Edit Suster";
        susterForm.dataset.editId = susterId;
    } else {
        modalTitle.textContent = "Tambah Suster";
        susterForm.reset();
        delete susterForm.dataset.editId;
    }
    susterModal.classList.add("show");
}

// Close modal
function closeModalFunc() {
    susterModal.classList.remove("show");
    susterForm.reset();
}

// Close modal when clicking outside
window.addEventListener("click", (event) => {
    if (event.target === susterModal) {
        closeModalFunc();
    }
});

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();

    const code = document.getElementById("code").value.trim();
    const name = document.getElementById("name").value.trim();
    const gender = document.getElementById("gender").value;
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const division = document.getElementById("division").value;
    const shift = document.getElementById("shift").value;
    const status = document.getElementById("status").value;

    // Validation
    if (!code || !name || !gender || !phone || !email || !division || !shift || !status) {
        alert("Semua field harus diisi.");
        return;
    }

    // Validate phone
    if (!/^\+62[0-9]{9,12}$/.test(phone)) {
        alert("Nomor telepon harus diawali dengan +62 dan memiliki 9-12 digit.");
        return;
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Email tidak valid.");
        return;
    }

    const susterData = {
        code,
        name,
        gender,
        phone,
        email,
        division,
        shift,
        status
    };

    try {
        const editId = susterForm.dataset.editId;
        const method = editId ? "PUT" : "POST";
        const url = editId ? `${API_URL}/${editId}` : API_URL;

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(susterData)
        });

        if (!response.ok) throw new Error("Failed to save suster");

        closeModalFunc();
        loadSusters();  // Refresh table
    } catch (error) {
        console.error("Error saving suster:", error);
        alert("Gagal menyimpan suster.");
    }
}

// Edit suster
async function editSuster(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error("Failed to load suster");
        const suster = await response.json();

        document.getElementById("code").value = suster.code;
        document.getElementById("name").value = suster.name;
        document.getElementById("gender").value = suster.gender;
        document.getElementById("phone").value = suster.phone;
        document.getElementById("email").value = suster.email;
        document.getElementById("division").value = suster.division;
        document.getElementById("shift").value = suster.shift;
        document.getElementById("status").value = suster.status;

        openModal(suster.id);
    } catch (error) {
        console.error("Error editing suster:", error);
        alert("Gagal memuat data suster untuk edit.");
    }
}

// Delete suster
async function deleteSuster(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus suster ini?")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete suster");
        loadSusters();  // Refresh table
    } catch (error) {
        console.error("Error deleting suster:", error);
        alert("Gagal menghapus suster.");
    }
}

// Search/filter data
function searchData() {
    const query = searchInput.value.toLowerCase();
    const rows = susterTable.querySelectorAll("tr");

    rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll("td"));
        const searchableCells = cells.slice(0, -2); // exclude Status and Aksi
        const matches = searchableCells.some(cell =>
            cell.textContent.toLowerCase().includes(query)
        );

        row.style.display = matches ? "" : "none";
    });
}

// Set active menu based on current page
document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const menuLinks = document.querySelectorAll(".menu a");

    menuLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (href === currentPage || (currentPage === "" && href === "index.html")) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
});