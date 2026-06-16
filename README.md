# MediCare Clinic UAS - Real-Time Version

Project ini dibuat dari template **Clinic-1.0.0** yang sudah diberikan, lalu dimaksimalkan menjadi aplikasi web klinik dengan backend Express.js, REST API, MySQL database, authentication, authorization, middleware, dashboard role-based, Customer Service workflow, appointment inbox, live chat real-time, data pasien, data dokter, data poli, dan contact/feedback.

## Fitur Utama

1. **Login & Register Pasien**
   - Register pasien baru.
   - Password memakai show/hide icon mata.
   - Ada kolom **Re-enter Password**.
   - Validasi password harus sama di frontend dan backend.
   - Password di-hash menggunakan bcrypt.
   - Token menggunakan JWT.

2. **Multi-Role**
   - Admin.
   - Pasien.
   - Dokter.
   - Customer Service.

3. **Buka Banyak User Bersamaan**
   - Token disimpan di `sessionStorage`, bukan `localStorage`.
   - Artinya 1 browser bisa membuka beberapa tab/window dengan login berbeda: Pasien, CS, Dokter, dan Admin.
   - Cocok untuk demo real-time UAS.

4. **Profile User**
   - Icon profile tersedia di dashboard.
   - User bisa mengubah nama, email, nomor telepon, dan foto profile melalui tombol upload file.
   - Pasien bisa mengubah data tambahan: tanggal lahir, gender, golongan darah, alamat rumah.

5. **Appointment Workflow Baru**
   - Pasien tidak memilih dokter/tanggal langsung.
   - Pasien hanya mengirim:
     - Nama pasien otomatis.
     - Nomor ID / No. RM otomatis.
     - Keluhan pasien.
   - Request masuk ke **Inbox Customer Service**.
   - Status awal appointment adalah **PENDING**.
   - Customer Service memilih **poli terlebih dahulu**, lalu dokter yang muncul otomatis hanya dokter pada poli tersebut.
   - Setelah CS mengirim ke dokter, status berubah menjadi **REQUESTED**.
   - Dokter menentukan tanggal dan jam, lalu status berubah menjadi **SCHEDULED**.
   - Dokter bisa menandai **COMPLETE** atau **CANCEL**. Jika cancel, dokter wajib mengisi alasan dan alasan masuk ke table admin.

6. **Customer Service Dashboard**
   - Melihat request appointment pasien.
   - Memilih poli dan dokter yang sesuai. Tanggal dan jam ditentukan oleh dokter.
   - Membalas Live Chat dari pasien secara real-time.
   - Mengakhiri obrolan pasien.
   - Chat yang sudah selesai tetap tersimpan sebagai history.

7. **Live Chat Real-Time**
   - Pasien punya bubble chat khusus di kanan bawah dashboard.
   - Pasien dan CS bisa chat seperti WhatsApp sederhana.
   - CS bisa mengakhiri obrolan.
   - Admin bisa membuka history chat.

8. **Dummy Data**
   - Dokter mengikuti data yang ada di template `doctors.html`:
     - Dr. Marcus Johnson
     - Dr. Sarah Williams
     - Dr. Michael Chen
     - Dr. Emily Rodriguez
     - Dr. David Thompson
     - Dr. Lisa Anderson
     - Dr. Robert Martinez
     - Dr. Jennifer Lee
   - Setiap dokter memiliki 5 dummy pasien/appointment.
   - Total dummy pasien untuk simulasi dokter: 40 pasien.

9. **REST API Documentation**
   - Swagger tersedia di `/api-docs`.

## Teknologi

- HTML, CSS, JavaScript
- Bootstrap template Clinic
- Node.js
- Express.js
- MySQL / MariaDB
- Sequelize ORM
- JWT Authentication
- Socket.IO untuk real-time appointment dan live chat
- Middleware: auth, role authorization, validation, error handler, rate limiter, Helmet, CORS, Morgan
- Swagger UI Express

## Cara Menjalankan

### 1. Extract project

Buka folder project di VS Code.

### 2. Install dependency

```bash
npm install
```

### 3. Buat file `.env`

Copy dari `.env.example` menjadi `.env`.

```bash
copy .env.example .env
```

Untuk Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Contoh isi `.env`:

```env
PORT=8888
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clinic_uas_v3
DB_USER=root
DB_PASS=
JWT_SECRET=ganti_dengan_secret_yang_lebih_panjang
JWT_EXPIRES_IN=1d
APP_URL=http://localhost:8888
```

### 4. Pastikan MySQL/MariaDB hidup

Gunakan XAMPP/Laragon/MySQL lokal. Port default: `3306`.

Database akan dibuat otomatis saat `npm start` karena project menggunakan Sequelize.

Kalau sebelumnya kamu sudah menjalankan versi lama, paling bersih gunakan salah satu cara ini:

1. Buat database baru dengan nama berbeda di `.env`, misalnya `clinic_uas_v4`, atau
2. Drop database lama `clinic_uas_v3`, lalu jalankan ulang `npm start`.

### 5. Jalankan server

```bash
npm start
```

Buka:

```txt
http://localhost:8888
```

Dashboard:

```txt
http://localhost:8888/dashboard.html
```

Swagger API Docs:

```txt
http://localhost:8888/api-docs
```

## Akun Demo

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

## Cara Demo Real-Time

1. Buka tab 1: `http://localhost:8888/login.html`, login sebagai pasien.
2. Buka tab 2: `http://localhost:8888/login.html`, login sebagai Customer Service.
3. Buka tab 3: `http://localhost:8888/login.html`, login sebagai dokter, misalnya `marcus@clinic.test`.
4. Di tab pasien, buat appointment dari dashboard.
5. Di tab CS, request muncul di inbox.
6. CS pilih poli terlebih dahulu, lalu pilih dokter yang muncul sesuai poli, kemudian klik **Kirim ke Dokter**. Status menjadi REQUESTED.
7. Di tab dokter, appointment muncul otomatis. Dokter pilih tanggal dan jam, lalu klik **Jadwalkan**. Status menjadi SCHEDULED.
8. Dokter dapat klik COMPLETE atau CANCEL. Jika CANCEL, alasan wajib diisi dan masuk ke table admin.
9. Di tab pasien, klik bubble live chat kanan bawah dan chat dengan CS.
10. CS dapat mengakhiri chat, lalu Admin bisa melihat history.

## Endpoint REST API Utama

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/auth/register` | Register pasien |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | User login |
| GET | `/api/auth/profile` | Detail profile user |
| PUT | `/api/auth/profile` | Update profile user |
| POST | `/api/auth/profile-photo` | Upload foto profile user |
| GET | `/api/departments` | List poli |
| POST | `/api/departments` | Tambah poli, admin only |
| GET | `/api/doctors` | List dokter |
| POST | `/api/doctors` | Tambah dokter, admin only |
| GET | `/api/patients` | List pasien, admin/CS |
| POST | `/api/appointments` | Pasien membuat request appointment |
| GET | `/api/appointments` | List appointment sesuai role |
| PATCH | `/api/appointments/:id/assign` | CS/Admin memilih poli dan dokter, status menjadi requested |
| PATCH | `/api/appointments/:id/schedule` | Dokter menentukan tanggal dan jam, status menjadi scheduled |
| PATCH | `/api/appointments/:id/status` | Dokter complete/cancel appointment |
| GET | `/api/appointments/cancellations` | Admin melihat alasan cancel dokter |
| POST | `/api/chat/conversations` | Pasien membuat/membuka live chat |
| POST | `/api/chat/conversations/from-patient` | CS membuka bubble chat per pasien dari appointment |
| GET | `/api/chat/conversations` | CS/Admin melihat daftar chat |
| GET | `/api/chat/conversations/:id/messages` | Lihat isi chat |
| POST | `/api/chat/conversations/:id/messages` | Kirim pesan chat |
| PATCH | `/api/chat/conversations/:id/close` | CS/Admin mengakhiri chat |
| POST | `/api/feedbacks` | Kirim feedback |
| GET | `/api/feedbacks` | List feedback, admin only |
| GET | `/api/dashboard/stats` | Statistik dashboard sesuai role |

## Pembagian Fitur untuk 2 Anggota

### Anggota 1

- Authentication & authorization.
- Register/Login.
- Profile user.
- Data pasien.
- Middleware auth, role, validation.

### Anggota 2

- Appointment workflow.
- Customer Service dashboard.
- Live chat real-time.
- Data dokter dan poli.
- Dashboard admin dan hosting.

## Catatan Penting

Folder `forms/` dan file PHP bawaan template tidak digunakan. Form appointment dan contact sekarang memakai JavaScript `fetch()` ke REST API Node.js. Real-time memakai Socket.IO.
