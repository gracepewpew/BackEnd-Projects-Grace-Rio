const API_URL = "http://localhost:3000/inquiry";

const inquiryTable = document.getElementById("inquiryTable");
const searchInput = document.getElementById("searchInquiry");

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
    loadInquiries();
    setActiveMenu();

    if (searchInput) {
        searchInput.addEventListener("input", searchInquiry);
    }
});

// =======================
// LOAD DATA
// =======================
async function loadInquiries() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) throw new Error("Failed to load inquiries");

        const data = await response.json();
        renderInquiries(data);

    } catch (error) {
        console.error("Error:", error);
        alert("Gagal memuat data inquiry. Pastikan server berjalan.");
    }
}

// =======================
// RENDER TABLE
// =======================
function renderInquiries(data) {
    inquiryTable.innerHTML = "";

    data.forEach(item => {
        const row = `
            <tr>
                <td>${item.namaPasien}</td>
                <td>${item.noKtp}</td>
                <td>${item.noHp}</td>
                <td>${item.email}</td>
                <td>${item.keluhan}</td>
                <td>${item.tanggalInquiry}</td>
                <td>
                    <button class="btn-edit" onclick="viewInquiry(${item.id})">Lihat</button>
                    <button class="btn-delete" onclick="deleteInquiry(${item.id})">Hapus</button>
                </td>
            </tr>
        `;

        inquiryTable.innerHTML += row;
    });
}

// =======================
// VIEW INQUIRY
// =======================
function viewInquiry(id) {
    alert("Fitur detail inquiry sedang dalam pengembangan!");
}

// =======================
// DELETE
// =======================
async function deleteInquiry(id) {
    if (!confirm("Yakin hapus inquiry?")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Delete gagal");

        loadInquiries();

    } catch (error) {
        console.error(error);
        alert("Gagal menghapus inquiry.");
    }
}

// =======================
// SEARCH
// =======================
function searchInquiry() {
    const input = searchInput.value.toLowerCase();
    const rows = inquiryTable.querySelectorAll("tr");

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
