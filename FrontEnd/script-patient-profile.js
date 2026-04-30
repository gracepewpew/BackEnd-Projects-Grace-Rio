// =======================
// LOAD PROFILE
// =======================

document.addEventListener("DOMContentLoaded", () => {
    displayUserInfo();
    loadProfile();
    loadLatestKunjungan();
});

function loadProfile() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
        document.getElementById("name").value = user.name || "";
        document.getElementById("email").value = user.email || "";
        document.getElementById("phone").value = user.phone || "";
        document.getElementById("ktp").value = user.ktp || "";

        // Format tanggal
        if (user.createdAt) {
            const date = new Date(user.createdAt);
            document.getElementById("createdAt").value = date.toLocaleDateString("id-ID");
        }
    }
}

// =======================
// LOAD LATEST KUNJUNGAN
// =======================
async function loadLatestKunjungan() {
    const container = document.getElementById("latestKunjungan");

    if (!container) {
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/kunjungan");
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = '<p style="color: #999;">Belum ada riwayat kunjungan. Ajukan permintaan untuk melihat status di sini.</p>';
            return;
        }

        const latest = data[data.length - 1];
        const statusClass = 
            latest.status === "Done" ? "status-done" : 
            latest.status === "Confirmed" ? "status-confirmed" : "status-pending";

        container.innerHTML = `
            <div style="padding: 10px; background: #f1f2f6; border-radius: 6px;">
                <p><strong>No. Kunjungan:</strong> ${latest.noKunjungan || "-"}</p>
                <p><strong>Tanggal:</strong> ${latest.tanggalKunjungan || "-"}</p>
                <p><strong>Jenis Layanan:</strong> ${latest.jenisLayanan || "-"}</p>
                <p><strong>Status:</strong> <span class="status ${statusClass}">${latest.status || "Pending"}</span></p>
            </div>
        `;
    } catch (error) {
        console.error("Error:", error);
        container.innerHTML = '<p style="color: #999;">Gagal memuat status kunjungan. Coba lagi nanti.</p>';
    }
}

// =======================
// CHANGE PASSWORD
// =======================
function changePassword() {
    alert("Fitur ubah password sedang dalam pengembangan!");
}
