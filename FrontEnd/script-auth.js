// =======================
// CHECK AUTHENTICATION
// =======================
function checkAuth() {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
        // Redirect to login jika tidak ada token
        window.location.href = "login.html";
        return null;
    }

    return JSON.parse(user);
}

// =======================
// DISPLAY USER INFO
// =======================
function displayUserInfo() {
    const user = checkAuth();

    if (user) {
        const userNameEl = document.getElementById("userName");
        const userRoleEl = document.getElementById("userRole");

        if (userNameEl) {
            userNameEl.textContent = user.name || user.email;
        }

        if (userRoleEl) {
            userRoleEl.textContent = user.role === "doctor" ? "Dokter" : "Pasien";
        }
    }
}

// =======================
// LOGOUT
// =======================
function logout() {
    if (confirm("Yakin ingin logout?")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        window.location.href = "login.html";
    }
}

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
    displayUserInfo();
});
