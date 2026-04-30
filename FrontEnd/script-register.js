const API_URL = "http://localhost:3000/auth/register";

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    registerForm.addEventListener("submit", handleRegister);
});

// =======================
// UPDATE FORM FIELDS
// =======================
function updateFormFields() {
    const role = document.getElementById("role").value;
    const doctorFields = document.getElementById("doctorFields");
    const patientFields = document.getElementById("patientFields");

    if (role === "doctor") {
        doctorFields.style.display = "block";
        patientFields.style.display = "none";
        document.getElementById("doctorId").required = true;
        document.getElementById("ktp").required = false;
    } else if (role === "patient") {
        doctorFields.style.display = "none";
        patientFields.style.display = "block";
        document.getElementById("doctorId").required = false;
        document.getElementById("ktp").required = true;
    } else {
        doctorFields.style.display = "none";
        patientFields.style.display = "none";
        document.getElementById("doctorId").required = false;
        document.getElementById("ktp").required = false;
    }
}

// =======================
// HANDLE REGISTER
// =======================
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const role = document.getElementById("role").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Validasi password
    if (password.length < 6) {
        alert("Password minimal 6 karakter!");
        return;
    }

    if (password !== confirmPassword) {
        alert("Password dan konfirmasi password tidak cocok!");
        return;
    }

    if (!role) {
        alert("Pilih role terlebih dahulu!");
        return;
    }

    let userData = {
        name,
        email,
        phone,
        role,
        password
    };

    // Tambahkan field khusus role
    if (role === "doctor") {
        const doctorId = document.getElementById("doctorId").value;
        if (!doctorId) {
            alert("ID/Lisensi Dokter harus diisi!");
            return;
        }
        userData.doctorId = doctorId;
    } else if (role === "patient") {
        const ktp = document.getElementById("ktp").value;
        if (!ktp) {
            alert("No. KTP/ID harus diisi!");
            return;
        }
        userData.ktp = ktp;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Registrasi gagal!");
            return;
        }

        alert("Registrasi berhasil! Silakan login.");
        window.location.href = "login.html";

    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan. Pastikan server berjalan.");
    }
}
