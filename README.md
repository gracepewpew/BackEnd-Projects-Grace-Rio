 MediCare Clinic UAS — Real-Time Multi-Role

Project UAS berbasis template Clinic-1.0.0 yang dikembangkan menjadi aplikasi web klinik lengkap dengan backend Express.js, REST API, MySQL, authentication, authorization, dashboard role-based, live chat real-time, appointment workflow multi-peran, contact/feedback berkategori, dan adjustable list view pada semua tabel.

 Fitur Utama

1. Login & Register Pasien
   - Register pasien baru dengan validasi email, telepon, dan password.
   - Password memakai show/hide icon mata dan kolom Re-enter Password.
   - Password di-hash menggunakan bcrypt, token menggunakan JWT.

2. Multi-Role (4 Role)
   - Admin, Pasien, Dokter, Customer Service.
   - Setiap role melihat tampilan dan data yang berbeda.

3. Buka Banyak User Bersamaan
   - Token disimpan di `sessionStorage`, bukan `localStorage`.
   - 1 browser bisa membuka banyak tab/window dengan login berbeda sekaligus.
   - Cocok untuk demo real-time (Pasien, CS, Dokter, Admin di tab berbeda).

4. Profile User
   - Ubah nama, email, nomor telepon, dan foto profile melalui upload file.
   - Pasien bisa mengubah data tambahan: tanggal lahir, gender, golongan darah, alamat.

5. Appointment Workflow Multi-Peran (5 Status)
   - Pasien mengirim nama, No. RM, dan keluhan → status PENDING.
   - Customer Service memilih poli lalu dokter sesuai poli → status REQUESTED.
   - Dokter menentukan tanggal dan jam → status SCHEDULED.
   - Dokter menandai selesai → COMPLETED / CANCELLED.
   - Jika cancel, dokter wajib isi alasan dan tercatat di riwayat admin.

6. Customer Service Dashboard
   - Inbox appointment pasien dengan filter dan pencarian.
   - Pilih poli terlebih dahulu, dokter muncul otomatis sesuai poli.
   - Membalas live chat pasien secara real-time.
   - Panel chat selalu terlihat (sticky) tanpa perlu scroll ke bawah.
   - Notifikasi toast muncul otomatis jika ada pesan dari percakapan lain.
   - Mengakhiri obrolan; history tersimpan dan bisa dilihat admin.

7. Live Chat Real-Time (Socket.IO)
   - Pasien punya bubble chat di kanan bawah dashboard seperti WhatsApp.
   - CS membalas pesan secara real-time.
   - Admin bisa membuka history seluruh percakapan.
   - Notifikasi real-time untuk appointment dan chat ke semua role.

8. Contact & Feedback Berkategori
   - Halaman kontak dengan 4 kategori: Pertanyaan, Keluhan, Saran, Lainnya.
   - Kategori dipilih via tombol pill dan disimpan di database.
   - Tabel admin menampilkan badge warna per kategori.
   - Admin dapat filter per kategori dan status (Baru/Dibaca/Dibalas).
   - Tombol aksi: Tandai Dibaca, Sudah Dibalas, Hapus.

9. Adjustable List View pada Semua Tabel
   - Setiap tabel punya kolom pencarian, filter status/kategori, dan pilihan jumlah baris (10/25/Semua).
   - Area scroll terbatas dengan header kolom yang selalu terlihat (sticky).
   - Pagination Prev/Next otomatis muncul jika data melebihi batas per halaman.
   - Filter bekerja langsung di sisi klien tanpa reload halaman.

10. Upload Foto Profile
    - Upload langsung dari dashboard dengan validasi tipe file (JPG/PNG/WEBP/GIF) dan ukuran maksimal 2 MB.

11. Swagger UI Dokumentasi API (Admin Only)
    - Dokumentasi REST API interaktif tersedia di `/api-docs`.
    - Akses dibatasi hanya untuk role Admin — diproteksi di level server dengan verifikasi JWT.
    - Role lain (Pasien, Dokter, CS) tidak melihat link API Docs dan akan ditolak jika mengakses langsung.

12. Keamanan Berlapis
    - Rate limiting 150 request/15 menit pada endpoint auth.
    - Helmet untuk security headers.
    - Validasi input di backend untuk semua field penting.
    - Proteksi route `/api-docs` di level server dengan JWT + role check.

 Teknologi

Back-End:
- Node.js + Express.js, MySQL, Sequelize ORM
- JWT Authentication, bcryptjs
- Socket.IO (real-time appointment & live chat)
- Multer (upload foto profile)
- Helmet, CORS, Morgan, express-rate-limit, dotenv
- Swagger UI Express

Front-End:
- HTML, CSS, JavaScript (Vanilla), Bootstrap 5, Socket.IO Client
- Template: Clinic Bootstrap Template (Clinic-1.0.0)

 Cara Menjalankan

 1. Install dependency

```bash
npm install
```

 2. Buat file `.env`

Buat file baru bernama `.env` di root project, isi dengan:

```env
PORT=8888
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clinic_uas
DB_USER=root
DB_PASS=
JWT_SECRET=ganti_dengan_secret_panjang_acak
JWT_EXPIRES_IN=1d
```

> Sesuaikan `DB_PASS` dengan password MySQL lokal. Jika tidak ada password, kosongkan saja.

 3. Import database

```bash
mysql -u root < database/database.sql
```

> File SQL sudah berisi perintah `CREATE DATABASE` dan `USE clinic_uas` secara otomatis.

 4. Jalankan server

```bash
npm run dev
```

Buka browser:

```
http://localhost:8888          ← halaman utama
http://localhost:8888/login.html
http://localhost:8888/api-docs ← Swagger (login admin dulu, link tersedia di dashboard)
```

> Database akan di-sync otomatis via Sequelize saat server start. Seed data (akun demo, dokter, poli, pasien) dibuat otomatis jika belum ada.

 Akun Demo

| Role | Email | Password |
|---|---|---|
| Admin | admin@clinic.test | admin12345 |
| Customer Service | cs@clinic.test | cs12345 |
| Pasien Demo | pasien@clinic.test | pasien12345 |
| Dokter | marcus@clinic.test | doctor12345 |
| Dokter | sarah.williams@clinic.test | doctor12345 |
| Dokter | michael@clinic.test | doctor12345 |
| Dokter | emily.rodriguez@clinic.test | doctor12345 |
| Dokter | david.thompson@clinic.test | doctor12345 |
| Dokter | lisa.anderson@clinic.test | doctor12345 |
| Dokter | robert.martinez@clinic.test | doctor12345 |
| Dokter | jennifer.lee@clinic.test | doctor12345 |

 Cara Demo Real-Time

1. Buka Tab 1 → login sebagai `pasien@clinic.test`
2. Buka Tab 2 → login sebagai `cs@clinic.test`
3. Buka Tab 3 → login sebagai `marcus@clinic.test`
4. Di tab pasien, buat appointment dari dashboard.
5. Di tab CS, request muncul langsung di inbox → pilih poli → pilih dokter → klik Kirim ke Dokter. Status: REQUESTED.
6. Di tab dokter, appointment muncul otomatis → pilih tanggal & jam → klik Jadwalkan. Status: SCHEDULED.
7. Dokter klik Complete atau Cancel (jika cancel, wajib isi alasan).
8. Di tab pasien, klik bubble chat kanan bawah → chat dengan CS.
9. CS mengakhiri chat → Admin bisa lihat history.

 Endpoint REST API Utama

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/auth/register` | Register pasien |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Data user login |
| GET | `/api/auth/profile` | Detail profile user |
| PUT | `/api/auth/profile` | Update profile user |
| POST | `/api/auth/profile-photo` | Upload foto profile |
| GET | `/api/departments` | List poli |
| POST | `/api/departments` | Tambah poli (admin) |
| GET | `/api/doctors` | List dokter |
| POST | `/api/doctors` | Tambah dokter (admin) |
| GET | `/api/patients` | List pasien (admin/CS) |
| POST | `/api/appointments` | Pasien buat request appointment |
| GET | `/api/appointments` | List appointment sesuai role |
| PATCH | `/api/appointments/:id/assign` | CS pilih poli & dokter → REQUESTED |
| PATCH | `/api/appointments/:id/schedule` | Dokter tentukan tanggal & jam → SCHEDULED |
| PATCH | `/api/appointments/:id/status` | Dokter complete/cancel appointment |
| GET | `/api/appointments/cancellations` | Admin lihat riwayat cancel (admin) |
| DELETE | `/api/appointments/:id` | Hapus appointment (admin) |
| POST | `/api/feedbacks` | Kirim pesan/feedback |
| GET | `/api/feedbacks` | List feedback (admin) |
| PATCH | `/api/feedbacks/:id/status` | Update status feedback (admin) |
| DELETE | `/api/feedbacks/:id` | Hapus feedback (admin) |
| GET | `/api/dashboard/stats` | Statistik dashboard sesuai role |
| POST | `/api/chat/conversations` | Pasien buat/buka live chat |
| POST | `/api/chat/conversations/from-patient` | CS buka chat dari appointment |
| GET | `/api/chat/conversations` | CS/Admin lihat daftar chat |
| GET | `/api/chat/conversations/:id/messages` | Isi pesan chat |
| POST | `/api/chat/conversations/:id/messages` | Kirim pesan chat |
| PATCH | `/api/chat/conversations/:id/close` | CS/Admin akhiri chat |

 Pembagian Fitur

 Anggota 1 — Rio Frederich (211112075)
- Authentication & authorization (JWT, bcrypt).
- Register/login & profile user.
- Data pasien & nomor rekam medis.
- Middleware: auth, role, validation, error handler.
- Upload foto profile.

 Anggota 2 — Grace Putri Wijaya (211110121)
- Appointment workflow multi-peran (5 status).
- Customer Service dashboard & inbox.
- Live chat real-time (Socket.IO).
- Data dokter dan poli.
- Contact/feedback berkategori.
- Adjustable list view & dashboard admin.
- Hosting di Railway.

 Catatan

Folder `forms/` dan file PHP bawaan template tidak digunakan. Semua form memakai JavaScript `fetch()` ke REST API Node.js. Real-time menggunakan Socket.IO.
