const API_URL = "http://localhost:3000/auth/login";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", handleLogin);
});

// =======================
// HANDLE LOGIN
// =======================
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    if (!email || !password || !role) {
        alert("Semua field harus diisi!");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, role })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Login gagal!");
            return;
        }

        // Simpan token dan user info ke localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("role", data.user.role);

        // Redirect ke dashboard sesuai role
        if (data.user.role === "doctor") {
            window.location.href = "index.html";
        } else if (data.user.role === "patient") {
            window.location.href = "patient-dashboard.html";
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan. Pastikan server berjalan.");
    }
}
