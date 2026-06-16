const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Clinic UAS REST API',
    version: '3.0.0',
    description: 'Dokumentasi REST API untuk project UAS website klinik: auth, role, appointment workflow CS, pasien, dokter, poli, feedback, profile, dan live chat real-time.'
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {
    '/health': { get: { summary: 'Cek status API', responses: { 200: { description: 'OK' } } } },
    '/auth/register': { post: { summary: 'Register pasien baru dengan confirm password', responses: { 201: { description: 'Register berhasil' } } } },
    '/auth/login': { post: { summary: 'Login admin/pasien/dokter/customer service', responses: { 200: { description: 'Login berhasil' } } } },
    '/auth/me': { get: { summary: 'User login', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Data user' } } } },
    '/auth/profile': {
      get: { summary: 'Detail profile user login', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Data profile' } } },
      put: { summary: 'Update profile user login', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Profile updated' } } }
    },
    '/auth/profile-photo': { post: { summary: 'Upload foto profile user', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Foto profile diupload' } } } },
    '/departments': {
      get: { summary: 'List data layanan/poli', responses: { 200: { description: 'List poli' } } },
      post: { summary: 'Tambah poli - Admin', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Poli dibuat' } } }
    },
    '/doctors': {
      get: { summary: 'List data dokter', responses: { 200: { description: 'List dokter' } } },
      post: { summary: 'Tambah dokter - Admin', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Dokter dibuat' } } }
    },
    '/patients': { get: { summary: 'List data pasien - Admin/Customer Service', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List pasien' } } } },
    '/appointments': {
      get: { summary: 'List appointment sesuai role', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List appointment' } } },
      post: { summary: 'Pasien membuat request appointment / publik membuat appointment lengkap', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Appointment dibuat' } } }
    },
    '/appointments/{id}/assign': { patch: { summary: 'CS/Admin memilih poli dan dokter, status menjadi requested', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Appointment dikirim ke dokter' } } } },
    '/appointments/{id}/schedule': { patch: { summary: 'Dokter menentukan tanggal dan jam, status menjadi scheduled', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Appointment dijadwalkan dokter' } } } },
    '/appointments/{id}/status': { patch: { summary: 'Dokter/Admin complete atau cancel appointment', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Status appointment berubah' } } } },
    '/appointments/cancellations': { get: { summary: 'Admin melihat alasan cancel dari dokter', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List alasan cancel' } } } },
    '/chat/conversations': {
      get: { summary: 'CS/Admin/Pasien melihat daftar conversation sesuai role', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List conversation' } } },
      post: { summary: 'Pasien membuka live chat', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Conversation dibuat/dibuka' } } }
    },
    '/chat/conversations/from-patient': { post: { summary: 'CS/Admin membuka chat pasien dari appointment', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Conversation pasien siap dibuka' } } } },
    '/chat/conversations/{id}/messages': {
      get: { summary: 'Lihat pesan live chat', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List pesan' } } },
      post: { summary: 'Kirim pesan live chat', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Pesan terkirim' } } }
    },
    '/chat/conversations/{id}/close': { patch: { summary: 'CS/Admin mengakhiri live chat', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Chat ditutup' } } } },
    '/feedbacks': {
      get: { summary: 'List feedback - Admin', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List feedback' } } },
      post: { summary: 'Kirim contact/feedback', responses: { 201: { description: 'Feedback dibuat' } } }
    },
    '/dashboard/stats': { get: { summary: 'Statistik dashboard sesuai role', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Data statistik' } } } }
  }
};

module.exports = swaggerDocument;
