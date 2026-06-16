# Mapping Project ke Indikator Penilaian UAS

## 1. Database untuk setiap fitur (15%)

Semua fitur utama terhubung ke database MySQL melalui Sequelize:

- `users` untuk login/register, role, profile, dan foto profile.
- `patients` untuk data pasien dan nomor rekam medis.
- `doctors` untuk data dokter sesuai template `doctors.html`.
- `departments` untuk data layanan/poli.
- `appointments` untuk request appointment, scheduling oleh CS, dan inbox dokter.
- `feedbacks` untuk contact/feedback.
- `chat_conversations` untuk sesi live chat pasien-CS.
- `chat_messages` untuk riwayat pesan live chat.

## 2. Middleware pada web server (10%)

Middleware yang digunakan:

- `auth.js` untuk validasi token JWT.
- `optionalAuth.js` untuk endpoint yang bisa menerima user login/non-login.
- `authorize.js` untuk pembatasan role admin/pasien/dokter/customer_service.
- `validate.js` untuk validasi field, email, dan nomor telepon.
- `errorHandler.js` untuk response error yang rapi.
- `helmet`, `cors`, `morgan`, dan `express-rate-limit`.

## 3. REST dengan benar pada beberapa fitur (10%)

Contoh REST API:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`
- `GET /api/doctors`
- `POST /api/doctors`
- `GET /api/departments`
- `POST /api/appointments`
- `PATCH /api/appointments/:id/assign`
- `PATCH /api/appointments/:id/status`
- `POST /api/chat/conversations`
- `POST /api/chat/conversations/:id/messages`
- `PATCH /api/chat/conversations/:id/close`

Swagger tersedia di `/api-docs`.

## 4. Authentication dan Authorization (15%)

- Register/login memakai JWT.
- Password memakai bcrypt.
- Role: `admin`, `pasien`, `dokter`, `customer_service`.
- Admin dapat melihat semua data dan history live chat.
- Pasien hanya melihat appointment dan chat miliknya sendiri.
- Dokter hanya melihat dan mengubah appointment yang ditujukan kepadanya.
- Customer Service dapat mengatur jadwal appointment dan membalas/menutup live chat pasien.

## 5. Tampilan menarik pada semua fitur (20%)

Tampilan memakai template Clinic Bootstrap dan ditambah:

- Halaman login/register modern.
- Register dengan show/hide password dan re-enter password.
- Dashboard role-based.
- Icon profile dan halaman edit profile.
- Statistik card.
- Tabel appointment, dokter, poli, pasien, feedback.
- Inbox Customer Service.
- Bubble live chat pasien seperti aplikasi chat.
- Panel live chat CS dan history chat admin.

## 6. Website pada hosting (20%)

Project siap di-hosting. Rekomendasi:

- Backend: Render, Railway, VPS, atau hosting Node.js.
- Database: Railway MySQL, Aiven MySQL, atau database hosting kampus.
- Frontend dan backend sudah satu server Express.
- Socket.IO sudah satu server dengan Express, sehingga real-time tidak perlu server terpisah.

## 7. Teknologi mandiri (10%)

Teknologi tambahan yang bisa dijelaskan saat presentasi:

- Sequelize ORM.
- JWT authentication.
- bcrypt password hashing.
- Swagger UI API documentation.
- Helmet security middleware.
- Rate limiter untuk endpoint auth.
- Socket.IO untuk real-time appointment dan live chat.
- Role-based dashboard dengan sessionStorage agar multi-user bisa dibuka di beberapa tab.
