/**
 * demo-runner.js — Automated Demo MediCare UAS
 *
 * Install sekali:
 *   npm install playwright
 *   npx playwright install chromium
 *
 * Jalankan (pastikan server sudah berjalan di port 8888):
 *   node demo-runner.js
 *
 * Tekan ENTER di terminal untuk maju ke langkah berikutnya.
 * Tekan Ctrl+C untuk keluar kapan saja.
 */

const { chromium } = require('playwright');
const readline = require('readline');

const BASE = 'http://localhost:8888';
const REG_EMAIL = `demo.baru.${Date.now()}@test.com`;

// ─── Terminal helpers ─────────────────────────────────────────────────────────
const R = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const MAGENTA = '\x1b[35m';
const DIM = '\x1b[2m';

let stepNum = 0;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function waitForEnter(label) {
  stepNum++;
  process.stdout.write(`\n${BOLD}${CYAN}[${stepNum}]${R} ${YELLOW}${label}${R}\n`);
  process.stdout.write(`${DIM}  → Tekan ENTER untuk lanjut...${R}\n`);
  return new Promise((resolve) => rl.once('line', resolve));
}

function log(msg) {
  process.stdout.write(`${DIM}    ${msg}${R}\n`);
}

// ─── Page helpers ─────────────────────────────────────────────────────────────

/** Tampilkan HUD overlay di kanan bawah halaman */
async function hud(page, text) {
  try {
    await page.evaluate((t) => {
      let el = document.getElementById('__demo_hud__');
      if (!el) {
        el = document.createElement('div');
        el.id = '__demo_hud__';
        Object.assign(el.style, {
          position: 'fixed',
          bottom: '18px',
          right: '18px',
          background: 'rgba(10,20,50,0.88)',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: '10px',
          fontFamily: 'sans-serif',
          fontSize: '13px',
          zIndex: '2147483647',
          textAlign: 'right',
          pointerEvents: 'none',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(6px)',
          maxWidth: '360px',
          lineHeight: '1.5',
          border: '1px solid rgba(255,255,255,0.12)',
          transition: 'opacity 0.3s ease',
        });
        document.body.appendChild(el);
      }
      el.innerHTML = t;
    }, text);
  } catch (_) { /* halaman mungkin sedang navigate */ }
}

async function scroll(page, y) {
  await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'smooth' }), y);
  await page.waitForTimeout(900);
}

async function scrollTo(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, selector);
  await page.waitForTimeout(900);
}

async function safe(fn) {
  try { await fn(); } catch (_) { /* skip jika elemen tidak ditemukan */ }
}

async function loginTo(page, email, password) {
  await page.goto(`${BASE}/login.html`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"]', email);
  await page.waitForTimeout(200);
  await page.fill('input[name="password"]', password);
  await page.waitForTimeout(200);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 8000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}${MAGENTA}╔══════════════════════════════════════╗${R}`);
  console.log(`${BOLD}${MAGENTA}║  DEMO RUNNER — MediCare Clinic UAS  ║${R}`);
  console.log(`${BOLD}${MAGENTA}╚══════════════════════════════════════╝${R}`);
  console.log(`${DIM}  Pastikan server berjalan: npm run dev${R}`);
  console.log(`${DIM}  Email register: ${REG_EMAIL}${R}`);
  console.log(`${DIM}  Tekan Ctrl+C untuk keluar kapan saja\n${R}`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 30,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Buka 4 tab sekaligus — masing-masing untuk 1 role
  const pPasien = await context.newPage();
  const pCS     = await context.newPage();
  const pDokter = await context.newPage();
  const pAdmin  = await context.newPage();

  // ══════════════════════════════════════════════════════════════════════════════
  // SCENE 1 — Landing Page
  // ══════════════════════════════════════════════════════════════════════════════

  await pPasien.bringToFront();
  await pPasien.goto(`${BASE}/index.html`);
  await pPasien.waitForLoadState('networkidle');
  await hud(pPasien, '🏥 <b>Scene 1</b><br>Halaman Utama MediCare');
  await waitForEnter('SCENE 1 — Landing page terbuka');

  await scroll(pPasien, 500);
  await waitForEnter('Scroll ke bawah — tunjukkan section Dokter');

  await scroll(pPasien, 1100);
  await waitForEnter('Terus scroll — tunjukkan section Poli / Layanan');

  await scroll(pPasien, 0);

  // ══════════════════════════════════════════════════════════════════════════════
  // SCENE 2 — Register
  // ══════════════════════════════════════════════════════════════════════════════

  await pPasien.goto(`${BASE}/register.html`);
  await pPasien.waitForLoadState('networkidle');
  await hud(pPasien, '📝 <b>Scene 2</b><br>Register Pasien Baru');
  await waitForEnter('SCENE 2 — Halaman Register terbuka');

  await pPasien.fill('input[name="name"]', 'Demo Pasien Baru');
  await pPasien.fill('input[name="email"]', REG_EMAIL);
  await pPasien.fill('input[name="phone"]', '081234599999');
  await pPasien.selectOption('select[name="gender"]', 'Perempuan');
  log('Mengisi form register...');
  await waitForEnter('Nama, email, telepon, dan gender sudah diisi');

  await pPasien.fill('input[name="password"]', 'demo12345');
  await pPasien.fill('input[name="confirmPassword"]', 'demo12345');
  await waitForEnter('Password & Re-enter Password diisi — klik show/hide password');

  // Toggle show password
  await safe(async () => {
    await pPasien.click('button[data-toggle-password="#registerPassword"]');
    await pPasien.waitForTimeout(700);
    await pPasien.click('button[data-toggle-password="#registerPassword"]');
  });
  await waitForEnter('Password berhasil di-toggle — submit form register');

  await pPasien.click('button[type="submit"]');
  await pPasien.waitForTimeout(2500);
  await waitForEnter('Register berhasil — redirect ke login');

  // ══════════════════════════════════════════════════════════════════════════════
  // SCENE 3 — Login Pasien & Dashboard
  // ══════════════════════════════════════════════════════════════════════════════

  await hud(pPasien, '🔐 <b>Scene 3</b><br>Login sebagai Pasien Demo');
  await pPasien.goto(`${BASE}/login.html`);
  await pPasien.waitForLoadState('networkidle');
  await waitForEnter('SCENE 3 — Halaman Login, isi akun pasien demo');

  await pPasien.fill('input[name="email"]', 'pasien@clinic.test');
  await pPasien.fill('input[name="password"]', 'pasien12345');
  await waitForEnter('Kredensial terisi — submit login');

  await pPasien.click('button[type="submit"]');
  await pPasien.waitForURL('**/dashboard**', { timeout: 8000 });
  await pPasien.waitForLoadState('networkidle');
  await pPasien.waitForTimeout(1200);
  await hud(pPasien, '👤 <b>Dashboard Pasien</b><br>Token disimpan di sessionStorage');
  await waitForEnter('Dashboard Pasien terbuka — tunjukkan stat cards');

  await scroll(pPasien, 250);
  await waitForEnter('Stat cards pasien: Appointment, Request, Terjadwal, Selesai');

  // ══════════════════════════════════════════════════════════════════════════════
  // SCENE 4 — Buat Appointment
  // ══════════════════════════════════════════════════════════════════════════════

  await hud(pPasien, '📋 <b>Scene 4</b><br>Buat Request Appointment');
  await scrollTo(pPasien, '#patientAppointmentArea');
  await waitForEnter('SCENE 4 — Form Request Appointment — nama & No. RM otomatis terisi');

  await pPasien.fill('textarea[name="symptoms"]', 'Demam sejak 3 hari, sakit kepala, dan badan terasa pegal-pegal');
  await waitForEnter('Keluhan diisi — klik Kirim ke Customer Service');

  await pPasien.click('#patientAppointmentForm button[type="submit"]');
  await pPasien.waitForTimeout(1800);
  await waitForEnter('Appointment terkirim! Scroll ke tabel — lihat status PENDING');

  await scrollTo(pPasien, '#appointmentSection');
  await waitForEnter('Baris baru muncul dengan status PENDING di tabel');

  // Demo filter tabel
  await hud(pPasien, '🔍 <b>Adjustable List View</b><br>Filter langsung di sisi klien');
  await pPasien.fill('#apptSearch', 'Pasien Demo');
  await pPasien.waitForTimeout(700);
  await waitForEnter('Filter search bekerja — ketik langsung, tabel bereaksi tanpa reload');

  await pPasien.fill('#apptSearch', '');
  await pPasien.waitForTimeout(400);

  // ══════════════════════════════════════════════════════════════════════════════
  // SCENE 5 — Customer Service
  // ══════════════════════════════════════════════════════════════════════════════

  await pCS.bringToFront();
  await hud(pCS, '👩‍💼 <b>Scene 5</b><br>Login Customer Service');
  await waitForEnter('SCENE 5 — Tab CS, halaman login');

  await loginTo(pCS, 'cs@clinic.test', 'cs12345');
  await hud(pCS, '👩‍💼 <b>Dashboard CS</b><br>Perhatikan: tidak ada link API Docs');
  await waitForEnter('Dashboard CS — tidak ada link API Docs di navbar (disembunyikan untuk CS)');

  await scrollTo(pCS, '#csArea');
  await hud(pCS, '📥 <b>CS Inbox</b><br>Request pasien masuk real-time');
  await waitForEnter('Inbox CS — appointment pasien tadi muncul dengan status PENDING');

  // Pilih poli dari dropdown pertama
  log('Memilih poli Cardiology...');
  await safe(async () => {
    await pCS.locator('select.assign-dept').first().selectOption({ label: 'Cardiology' });
    await pCS.waitForTimeout(700);
  });
  await waitForEnter('Poli Cardiology dipilih — dropdown dokter otomatis terisi dokter poli ini');

  log('Memilih dokter pertama...');
  await safe(async () => {
    await pCS.locator('select.assign-doctor').first().selectOption({ index: 1 });
    await pCS.waitForTimeout(400);
  });
  await waitForEnter('Dokter dipilih — klik Kirim ke Dokter');

  await safe(async () => {
    await pCS.locator('button[data-assign-id]').first().click();
    await pCS.waitForTimeout(1800);
  });
  await waitForEnter('Status berubah menjadi REQUESTED — dokter sudah mendapat notifikasi');

  // ══════════════════════════════════════════════════════════════════════════════
  // SCENE 6 — Dokter
  // ══════════════════════════════════════════════════════════════════════════════

  await pDokter.bringToFront();
  await hud(pDokter, '👨‍⚕️ <b>Scene 6</b><br>Login Dr. Marcus Johnson');
  await waitForEnter('SCENE 6 — Tab Dokter, halaman login');

  await loginTo(pDokter, 'marcus@clinic.test', 'doctor12345');
  await hud(pDokter, '👨‍⚕️ <b>Dashboard Dokter</b><br>Appointment REQUESTED menunggu jadwal');
  await scrollTo(pDokter, '#appointmentSection');
  await waitForEnter('Tabel dokter — appointment dari pasien tadi dengan status REQUESTED');

  // Ambil baris REQUESTED pertama dan pilih jadwal
  log('Mencari appointment REQUESTED untuk dijadwalkan...');
  await safe(async () => {
    const actionBox = pDokter.locator('.doctor-action-box').first();
    const count = await actionBox.count();
    if (count === 0) return;

    // Pilih bulan berikutnya
    const now = new Date();
    const nextMonth = String(now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2).padStart(2, '0');
    await safe(() => actionBox.locator('select.schedule-month').selectOption(nextMonth));
    await pDokter.waitForTimeout(400);
    await safe(() => actionBox.locator('select.schedule-time').selectOption('09:00:00'));
  });
  await waitForEnter('Tanggal (bulan depan) dan jam 09:00 dipilih — klik Jadwalkan');

  await safe(async () => {
    await pDokter.locator('button[data-schedule-id]').first().click();
    await pDokter.waitForTimeout(1800);
  });
  await waitForEnter('Status berubah menjadi SCHEDULED');

  // Complete sebuah appointment lain
  await hud(pDokter, '✅ <b>Complete</b><br>Dokter menandai appointment selesai');
  await safe(async () => {
    const completeBtn = pDokter.locator('button[data-complete-id]').first();
    if (await completeBtn.count() > 0) {
      await completeBtn.click();
      await pDokter.waitForTimeout(1500);
    }
  });
  await waitForEnter('Status berubah menjadi COMPLETED');

  // Tunjukkan cancel dengan alasan
  await hud(pDokter, '❌ <b>Cancel</b><br>Alasan wajib diisi sebelum membatalkan');
  await safe(async () => {
    const cancelTextarea = pDokter.locator('textarea[class*="cancel-reason"]').first();
    if (await cancelTextarea.count() > 0) {
      await cancelTextarea.fill('Dokter mendadak ada keperluan mendesak dan tidak dapat hadir.');
    }
  });
  await waitForEnter('Alasan cancel diisi — jika dibatalkan, alasan masuk ke riwayat admin');

  // ══════════════════════════════════════════════════════════════════════════════
  // SCENE 7 — Live Chat (Pasien → CS)
  // ══════════════════════════════════════════════════════════════════════════════

  await pPasien.bringToFront();
  await scroll(pPasien, 0);
  await hud(pPasien, '💬 <b>Scene 7A</b><br>Live Chat — sisi Pasien');
  await waitForEnter('SCENE 7 — Kembali ke tab Pasien, klik bubble chat di kanan bawah');

  await safe(async () => {
    await pPasien.click('#patientChatButton');
    await pPasien.waitForTimeout(1000);
  });
  await waitForEnter('Widget chat terbuka — ketik pesan ke Customer Service');

  await safe(async () => {
    await pPasien.fill('#patientChatForm input[name="message"]', 'Halo, saya ingin tanya soal jadwal konsultasi Dr. Marcus.');
    await pPasien.waitForTimeout(400);
  });
  await waitForEnter('Pesan sudah diketik — klik Send');

  await safe(async () => {
    await pPasien.click('#patientChatForm button[type="submit"]');
    await pPasien.waitForTimeout(1000);
  });
  await waitForEnter('Pesan terkirim — sekarang pindah ke tab CS');

  // CS menerima dan membalas
  await pCS.bringToFront();
  await scrollTo(pCS, '#csArea');
  await hud(pCS, '💬 <b>Scene 7B</b><br>Live Chat — sisi CS<br><small>Pesan masuk real-time</small>');
  await waitForEnter('Tab CS — pesan pasien muncul langsung. Panel chat selalu terlihat (sticky)');

  await safe(async () => {
    const conv = pCS.locator('#csConversationList .conversation-item').first();
    if (await conv.count() > 0) {
      await conv.click();
      // Tunggu form chat muncul (awalnya d-none, toggle setelah percakapan dibuka)
      await pCS.locator('#csChatForm').waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
      await pCS.waitForTimeout(500);
    }
  });
  await waitForEnter('Percakapan dibuka — CS mengetik balasan');

  await safe(async () => {
    await pCS.locator('#csChatForm input[name="message"]').fill('Halo! Jadwal Dr. Marcus tersedia bulan depan pukul 09:00. Apakah cocok?');
    await pCS.waitForTimeout(400);
  });
  await waitForEnter('Balasan diketik — kirim');

  await safe(async () => {
    await pCS.locator('#csChatForm button[type="submit"]').click();
    await pCS.waitForTimeout(1000);
  });
  await waitForEnter('Balasan terkirim — kembali ke pasien untuk lihat balasan masuk');

  await pPasien.bringToFront();
  await pPasien.waitForTimeout(600);
  await hud(pPasien, '💬 <b>Scene 7C</b><br>Balasan CS muncul real-time di widget pasien');
  await waitForEnter('Balasan CS muncul di widget pasien tanpa refresh');

  // CS akhiri chat
  await pCS.bringToFront();
  await hud(pCS, '🔚 <b>Akhiri Obrolan</b><br>History tersimpan untuk Admin');
  await waitForEnter('CS mengakhiri obrolan — klik tombol Akhiri Obrolan');

  await safe(async () => {
    await pCS.click('#closeChatBtn');
    await pCS.waitForTimeout(1200);
  });
  await waitForEnter('Chat diakhiri — history otomatis tersimpan dan bisa dilihat Admin');

  // ══════════════════════════════════════════════════════════════════════════════
  // SCENE 8 — Admin Dashboard
  // ══════════════════════════════════════════════════════════════════════════════

  await pAdmin.bringToFront();
  await hud(pAdmin, '👑 <b>Scene 8</b><br>Login Admin');
  await waitForEnter('SCENE 8 — Tab Admin, halaman login');

  await loginTo(pAdmin, 'admin@clinic.test', 'admin12345');
  await hud(pAdmin, '👑 <b>Dashboard Admin</b><br>Statistik lengkap seluruh sistem');
  await waitForEnter('Dashboard Admin — stat cards lengkap: Users, Pasien, Dokter, CS, Poli, Appointment, Feedback, Chat');

  await scroll(pAdmin, 350);
  await waitForEnter('Tunjukkan semua stat card admin');

  // Poli
  await scrollTo(pAdmin, '#departmentsTable');
  await hud(pAdmin, '🏥 <b>Data Poli</b><br>Admin bisa tambah poli langsung dari dashboard');
  await waitForEnter('Tabel Data Poli — admin bisa tambah poli baru dari form di atas');

  // Dokter + filter
  await scrollTo(pAdmin, '#doctorsTable');
  await hud(pAdmin, '👨‍⚕️ <b>Data Dokter</b><br>Filter & scroll terbatas (sticky header)');
  await pAdmin.fill('#doctorSearch', 'Marcus');
  await pAdmin.waitForTimeout(700);
  await waitForEnter('Filter dokter langsung bekerja — scroll tabel dengan header tetap terlihat');

  await pAdmin.fill('#doctorSearch', '');
  await pAdmin.waitForTimeout(300);

  // Pasien
  await scrollTo(pAdmin, '#patientsTable');
  await hud(pAdmin, '🧑‍🤝‍🧑 <b>Data Pasien</b><br>Pagination 10/25/Semua baris');
  await waitForEnter('Tabel Pasien — ada filter nama/No.RM dan pilihan jumlah baris per halaman');

  // Feedback
  await scrollTo(pAdmin, '#feedbacksTable');
  await hud(pAdmin, '📩 <b>Pesan Masuk (Feedback)</b><br>Badge kategori berwarna');
  await waitForEnter('Tabel Feedback — setiap pesan punya badge kategori berwarna');

  await pAdmin.selectOption('#feedbackCategoryFilter', 'pertanyaan');
  await pAdmin.waitForTimeout(700);
  await waitForEnter('Filter kategori Pertanyaan aktif — hanya pesan Pertanyaan ditampilkan');

  await pAdmin.selectOption('#feedbackCategoryFilter', '');
  await pAdmin.waitForTimeout(300);

  // Tandai dibaca
  await safe(async () => {
    const btn = pAdmin.locator('button:has-text("Tandai Dibaca")').first();
    if (await btn.count() > 0) {
      await btn.click();
      await pAdmin.waitForTimeout(800);
    }
  });
  await waitForEnter('Status pesan diubah menjadi Dibaca');

  // History chat
  await scrollTo(pAdmin, '#adminConversationList');
  await hud(pAdmin, '📜 <b>History Live Chat</b><br>Admin lihat semua percakapan');
  await waitForEnter('History Live Chat — klik salah satu percakapan untuk buka');

  await safe(async () => {
    const conv = pAdmin.locator('#adminConversationList .conversation-item').first();
    if (await conv.count() > 0) {
      await conv.click();
      await pAdmin.waitForTimeout(800);
    }
  });
  await waitForEnter('Isi percakapan muncul — admin bisa lihat semua history');

  // ══════════════════════════════════════════════════════════════════════════════
  // SCENE 9 — Halaman Kontak
  // ══════════════════════════════════════════════════════════════════════════════

  const pContact = await context.newPage();
  await pContact.goto(`${BASE}/contact.html`);
  await pContact.waitForLoadState('networkidle');
  await hud(pContact, '📨 <b>Scene 9</b><br>Halaman Hubungi Kami');
  await waitForEnter('SCENE 9 — Halaman Contact terbuka, pilih kategori pesan');

  await pContact.click('.btn-category[data-val="keluhan"]');
  await pContact.waitForTimeout(500);
  await waitForEnter('Kategori Keluhan dipilih — tombol aktif berubah warna biru');

  await pContact.fill('input[name="name"]', 'Grace Demo');
  await pContact.fill('input[name="email"]', 'grace.demo@test.com');
  await pContact.fill('input[name="subject"]', 'Pertanyaan soal antrian dokter');
  await pContact.fill('textarea[name="message"]', 'Apakah bisa mendaftar untuk konsultasi lebih dari satu poli dalam sehari?');
  await waitForEnter('Form lengkap terisi — kirim pesan');

  await pContact.click('button[type="submit"]');
  await pContact.waitForTimeout(1800);
  await waitForEnter('Pesan berhasil dikirim — kembali ke Admin untuk lihat di tabel feedback');

  // Refresh feedback di admin
  await pAdmin.bringToFront();
  await scrollTo(pAdmin, '#feedbacksTable');
  await pAdmin.evaluate(() => { if (window.Dashboard) Dashboard.loadFeedbacks(); });
  await pAdmin.waitForTimeout(1200);
  await hud(pAdmin, '✅ <b>Feedback Baru Masuk</b><br>Kategori: Keluhan — dari halaman kontak');
  await waitForEnter('Pesan dari halaman Hubungi Kami langsung muncul di tabel admin');

  // ══════════════════════════════════════════════════════════════════════════════
  // SCENE 10 — Swagger API Docs (Admin Only)
  // ══════════════════════════════════════════════════════════════════════════════

  await scroll(pAdmin, 0);
  await hud(pAdmin, '📄 <b>Scene 10</b><br>API Docs hanya untuk Admin');
  await waitForEnter('SCENE 10 — Tunjukkan link API Docs di navbar Admin');

  await safe(async () => {
    const link = pAdmin.locator('#apiDocsNav a');
    if (await link.count() > 0) {
      await link.click();
      await pAdmin.waitForLoadState('networkidle');
      await pAdmin.waitForTimeout(1500);
    }
  });
  await hud(pAdmin, '📄 <b>Swagger UI</b><br>Dokumentasi REST API interaktif — Admin Only');
  await waitForEnter('Swagger terbuka — semua endpoint terdokumentasi');

  await scroll(pAdmin, 300);
  await waitForEnter('Scroll Swagger — tunjukkan daftar endpoint');

  await safe(async () => {
    await pAdmin.locator('.opblock').first().click();
    await pAdmin.waitForTimeout(700);
  });
  await waitForEnter('Endpoint dibuka — method, parameter, dan response terdokumentasi lengkap');

  // ══════════════════════════════════════════════════════════════════════════════
  // CLOSING
  // ══════════════════════════════════════════════════════════════════════════════

  await pPasien.bringToFront();
  await pPasien.goto(`${BASE}/index.html`);
  await pPasien.waitForLoadState('networkidle');
  await hud(pPasien, '🏥 <b>MediCare Clinic</b><br>Tim Amoxicillin — UAS 2025/2026');
  await waitForEnter('PENUTUP — Kembali ke halaman utama');

  console.log(`\n${BOLD}${GREEN}✓ Demo selesai!${R}`);
  console.log(`${DIM}  Tekan ENTER untuk menutup browser.${R}\n`);
  await new Promise((resolve) => rl.once('line', resolve));

  rl.close();
  await browser.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n\x1b[31mError:\x1b[0m', err.message);
  process.exit(1);
});
