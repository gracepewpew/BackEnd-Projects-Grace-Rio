const API_URL = "http://localhost:3000/adjust";

const noBuktiInput = document.getElementById("noBukti");
const tanggalInput = document.getElementById("tanggal");
const tipeAdjustSelect = document.getElementById("tipeAdjust");
const barangContainer = document.getElementById("barangContainer");

document.addEventListener("DOMContentLoaded", () => {
    initializeForm();
    setActiveMenu();
    
    // Setup button event listeners
    document.getElementById("addRowBtn").addEventListener("click", addRow);
    document.getElementById("simpanBtn").addEventListener("click", simpanData);
    document.getElementById("resetBtn").addEventListener("click", resetCounter);
});

// INIT FORM
function initializeForm() {
    noBuktiInput.value = generateNoBukti();
    tanggalInput.value = new Date().toISOString().split("T")[0];
    addRow();
}

// GENERATE NO BUKTI
function generateNoBukti() {
    let last = localStorage.getItem("adjustCounter") || "0";
    let next = parseInt(last) + 1;

    return next.toString().padStart(4, "0");
}

// RESET COUNTER
function resetCounter() {
    if (confirm("Reset counter nomor bukti? Ini akan menghapus data counter.")) {
        localStorage.removeItem("adjustCounter");
        alert("Counter berhasil direset!");
        location.reload();
    }
}

// ADD ROW
function addRow() {
    const row = document.createElement("div");
    row.classList.add("barang-row");

    row.innerHTML = `
        <div class="field">
            <label>Barang</label>
            <select onchange="setSatuan(this)">
                <option value="">-- Pilih Obat --</option>
                <option value="Paracetamol" data-satuan="Tablet">Paracetamol</option>
                <option value="OBH" data-satuan="Botol">OBH Combi</option>
                <option value="Amoxicillin" data-satuan="Kapsul">Amoxicillin</option>
            </select>
        </div>

        <div class="field">
            <label>Qty</label>
            <input type="number">
        </div>

        <div class="field">
            <label>Satuan</label>
            <input type="text" readonly>
        </div>

        <button onclick="removeRow(this)" class="btn-delete">Hapus</button>
    `;

    barangContainer.appendChild(row);
}

// REMOVE ROW
function removeRow(btn) {
    btn.parentElement.remove();
}

// AUTO SATUAN
function setSatuan(select) {
    const satuan = select.options[select.selectedIndex].dataset.satuan;
    const row = select.closest(".barang-row");

    row.querySelector("input[readonly]").value = satuan || "";
}

// SIMPAN DATA
async function simpanData() {

    const rows = document.querySelectorAll(".barang-row");
    const items = [];

    rows.forEach(row => {
        const nama = row.querySelector("select").value;
        const qty = row.querySelector("input[type='number']").value;
        const satuan = row.querySelector("input[readonly]").value;

        if (nama && qty) {
            items.push({ nama, qty, satuan });
        }
    });

    if (items.length === 0) {
        alert("Minimal 1 barang!");
        return;
    }

    const data = {
        noBukti: noBuktiInput.value,
        tanggal: tanggalInput.value,
        tipe: tipeAdjustSelect.value,
        items
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error("Gagal simpan");

        // simpan counter setelah berhasil
        let last = localStorage.getItem("adjustCounter") || "0";
        localStorage.setItem("adjustCounter", (parseInt(last) + 1).toString());

        alert("Berhasil disimpan!");
        location.reload();

    } catch (error) {
        console.error(error);
        alert("Gagal menyimpan data.");
    }
}

// MENU ACTIVE
function setActiveMenu() {
    const currentPage = window.location.pathname.split("/").pop();

    document.querySelectorAll(".menu a").forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === currentPage);
    });
}