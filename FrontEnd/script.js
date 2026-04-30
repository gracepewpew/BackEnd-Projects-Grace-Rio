// API base URL for doctor data
const API_URL = "http://localhost:3000/doctors";

// DOM elements
const addDoctorBtn = document.getElementById("addDoctorBtn");
const doctorModal = document.getElementById("doctorModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const doctorForm = document.getElementById("doctorForm");
const doctorTable = document.getElementById("doctorTable");
const searchInput = document.getElementById("searchInput");
const modalTitle = document.getElementById("modalTitle");

// Load doctors on page load
document.addEventListener("DOMContentLoaded", () => {
    loadDoctors();
    // Attach event listeners
    addDoctorBtn.addEventListener("click", openModal);
    closeModal.addEventListener("click", closeModalFunc);
    cancelBtn.addEventListener("click", closeModalFunc);
    doctorForm.addEventListener("submit", handleFormSubmit);
    searchInput.addEventListener("input", searchData);
});

// Load and display doctors
async function loadDoctors() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to load doctors");
        const doctors = await response.json();
        renderTable(doctors);
    } catch (error) {
        console.error("Error loading doctors:", error);
        alert("Gagal memuat data dokter. Pastikan server berjalan.");
    }
}

// Render table rows
function renderTable(data) {
    if (!doctorTable) return;
    doctorTable.innerHTML = "";
    data.forEach(item => {
        const statusClass = item.status === "Aktif" ? "aktif" : "nonaktif";
        const row = `
            <tr>
                <td>${item.name}</td>
                <td>${item.specialty}</td>
                <td>${item.position}</td>
                <td>${item.gender}</td>
                <td>${item.phone}</td>
                <td>${item.email}</td>
                <td><span class="status ${statusClass}">${item.status}</span></td>
                <td>
                    <button class="btn-edit" onclick="editDoctor(${item.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteDoctor(${item.id})">Hapus</button>
                </td>
            </tr>
        `;
        doctorTable.innerHTML += row;
    });
}

// Open modal for add or edit
function openModal(doctorId = null) {
    if (doctorId) {
        modalTitle.textContent = "Edit Dokter";
        doctorForm.dataset.editId = doctorId;
    } else {
        modalTitle.textContent = "Tambah Dokter";
        doctorForm.reset();
        delete doctorForm.dataset.editId;
    }
    doctorModal.classList.add("show");  // Add .show class
}

// Close modal
function closeModalFunc() {
    doctorModal.classList.remove("show");  // Remove .show class
    doctorForm.reset();
}

// Close modal when clicking outside
window.addEventListener("click", (event) => {
    if (event.target === doctorModal) {
        closeModalFunc();
    }
});

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const specialty = document.getElementById("specialty").value.trim();
    const position = document.getElementById("position").value.trim();
    const gender = document.getElementById("gender").value;
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const status = document.getElementById("status").value;

    // Validation
    if (!name || !specialty || !position || !gender || !phone || !email || !status) {
        alert("Semua field harus diisi.");
        return;
    }

    // Validate phone (numbers only)
    if (!/^\d+$/.test(phone)) {
        alert("Nomor telepon harus berisi angka saja.");
        return;
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Email tidak valid.");
        return;
    }

    const doctorData = {
        name,
        specialty,
        position,
        gender,
        phone,
        email,
        status
    };

    try {
        const editId = doctorForm.dataset.editId;
        const method = editId ? "PUT" : "POST";
        const url = editId ? `${API_URL}/${editId}` : API_URL;

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(doctorData)
        });

        if (!response.ok) throw new Error("Failed to save doctor");

        closeModalFunc();
        loadDoctors();  // Refresh table
    } catch (error) {
        console.error("Error saving doctor:", error);
        alert("Gagal menyimpan dokter.");
    }
}

// Edit doctor
async function editDoctor(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error("Failed to load doctor");
        const doctor = await response.json();

        document.getElementById("name").value = doctor.name;
        document.getElementById("specialty").value = doctor.specialty;
        document.getElementById("position").value = doctor.position;
        document.getElementById("gender").value = doctor.gender;
        document.getElementById("phone").value = doctor.phone;
        document.getElementById("email").value = doctor.email;
        document.getElementById("status").value = doctor.status;

        openModal(doctor.id);
    } catch (error) {
        console.error("Error editing doctor:", error);
        alert("Gagal memuat data dokter untuk edit.");
    }
}

// Delete doctor
async function deleteDoctor(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus dokter ini?")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete doctor");
        loadDoctors();  // Refresh table
    } catch (error) {
        console.error("Error deleting doctor:", error);
        alert("Gagal menghapus dokter.");
    }
}

// Search/filter data
function searchData() {
    const query = searchInput.value.toLowerCase();
    const rows = doctorTable.querySelectorAll("tr");

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