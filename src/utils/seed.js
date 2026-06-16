const { User, Department, Doctor, Patient, Appointment, Feedback, ChatConversation, ChatMessage } = require('../models');

async function ensureUser({ name, email, password, role, phone, profilePhoto }) {
  let user = await User.findOne({ where: { email } });
  if (!user) {
    user = await User.create({ name, email, password, role, phone, profilePhoto });
  } else {
    await user.update({ name, role, phone, profilePhoto: profilePhoto || user.profilePhoto, isActive: true });
  }
  return user;
}

async function ensureDepartment({ name, description, location }) {
  const [department] = await Department.findOrCreate({
    where: { name },
    defaults: { description, location, isActive: true }
  });
  await department.update({ description, location, isActive: true });
  return department;
}

async function ensureDoctor({ user, department, name, email, phone, specialization, schedule, image }) {
  let doctor = await Doctor.findOne({ where: { email } });
  if (!doctor) {
    doctor = await Doctor.create({
      userId: user ? user.id : null,
      departmentId: department.id,
      name,
      email,
      phone,
      specialization,
      schedule,
      image,
      isActive: true
    });
  } else {
    await doctor.update({
      userId: user ? user.id : doctor.userId,
      departmentId: department.id,
      name,
      phone,
      specialization,
      schedule,
      image,
      isActive: true
    });
  }
  return doctor;
}

async function ensurePatientForUser(user, defaults = {}) {
  let patient = await Patient.findOne({ where: { userId: user.id } });
  if (!patient) {
    patient = await Patient.create({
      userId: user.id,
      medicalRecordNumber: `RM-${String(user.id).padStart(5, '0')}`,
      birthDate: defaults.birthDate || null,
      gender: defaults.gender || null,
      bloodType: defaults.bloodType || null,
      address: defaults.address || null
    });
  } else {
    await patient.update({
      birthDate: patient.birthDate || defaults.birthDate || null,
      gender: patient.gender || defaults.gender || null,
      bloodType: patient.bloodType || defaults.bloodType || null,
      address: patient.address || defaults.address || null
    });
  }
  return patient;
}

async function seedInitialData() {
  const admin = await ensureUser({
    name: 'Admin Klinik',
    email: 'admin@clinic.test',
    password: 'admin12345',
    role: 'admin',
    phone: '081200000001',
    profilePhoto: 'assets/img/person/person-m-7.webp'
  });

  const csUser = await ensureUser({
    name: 'Customer Service Klinik',
    email: 'cs@clinic.test',
    password: 'cs12345',
    role: 'customer_service',
    phone: '081200000099',
    profilePhoto: 'assets/img/person/person-f-11.webp'
  });

  const patientDemo = await ensureUser({
    name: 'Pasien Demo',
    email: 'pasien@clinic.test',
    password: 'pasien12345',
    role: 'pasien',
    phone: '081200000002',
    profilePhoto: 'assets/img/person/person-m-3.webp'
  });
  const demoPatient = await ensurePatientForUser(patientDemo, {
    birthDate: '2002-04-18',
    gender: 'Laki-laki',
    bloodType: 'O',
    address: 'Medan, Indonesia'
  });

  const departments = {};
  const departmentSeeds = [
    ['Cardiology', 'Layanan konsultasi dan pemeriksaan kesehatan jantung.', 'Lantai 2 - Ruang C'],
    ['Neurology', 'Layanan konsultasi saraf dan gangguan neurologis.', 'Lantai 2 - Ruang N'],
    ['Orthopedics', 'Layanan pemeriksaan tulang, sendi, dan cedera olahraga.', 'Lantai 3 - Ruang O'],
    ['Pediatrics', 'Layanan kesehatan anak dan tumbuh kembang.', 'Lantai 1 - Ruang P'],
    ['Dermatology', 'Layanan konsultasi kulit dan estetika medis.', 'Lantai 3 - Ruang D'],
    ['Oncology', 'Layanan konsultasi dan pemantauan kasus onkologi.', 'Lantai 4 - Ruang ON'],
    ['Emergency', 'Layanan gawat darurat dan penanganan awal.', 'IGD - Lantai 1'],
    ['Radiology', 'Layanan radiologi dan pemeriksaan pencitraan medis.', 'Lantai 2 - Ruang R']
  ];

  for (const [name, description, location] of departmentSeeds) {
    departments[name] = await ensureDepartment({ name, description, location });
  }

  const doctorSeeds = [
    ['Dr. Marcus Johnson', 'marcus@clinic.test', '081200001001', 'Cardiologist', 'Senin-Rabu, 09:00-15:00', 'assets/img/health/staff-1.webp', 'Cardiology'],
    ['Dr. Sarah Williams', 'sarah.williams@clinic.test', '081200001002', 'Neurologist', 'Selasa-Kamis, 10:00-16:00', 'assets/img/health/staff-2.webp', 'Neurology'],
    ['Dr. Michael Chen', 'michael@clinic.test', '081200001003', 'Orthopedic Surgeon', 'Senin-Jumat, 11:00-17:00', 'assets/img/health/staff-3.webp', 'Orthopedics'],
    ['Dr. Emily Rodriguez', 'emily.rodriguez@clinic.test', '081200001004', 'Pediatrician', 'Senin-Jumat, 08:00-13:00', 'assets/img/health/staff-4.webp', 'Pediatrics'],
    ['Dr. David Thompson', 'david.thompson@clinic.test', '081200001005', 'Dermatologist', 'Selasa-Sabtu, 11:00-17:00', 'assets/img/health/staff-5.webp', 'Dermatology'],
    ['Dr. Lisa Anderson', 'lisa.anderson@clinic.test', '081200001006', 'Oncologist', 'Senin-Kamis, 09:00-14:00', 'assets/img/health/staff-6.webp', 'Oncology'],
    ['Dr. Robert Martinez', 'robert.martinez@clinic.test', '081200001007', 'Emergency Medicine', 'Setiap Hari, Shift 08:00-20:00', 'assets/img/health/staff-7.webp', 'Emergency'],
    ['Dr. Jennifer Lee', 'jennifer.lee@clinic.test', '081200001008', 'Radiologist', 'Senin-Jumat, 09:00-15:00', 'assets/img/health/staff-8.webp', 'Radiology']
  ];

  const doctors = [];
  for (const [name, email, phone, specialization, schedule, image, departmentName] of doctorSeeds) {
    const doctorUser = await ensureUser({
      name,
      email,
      password: 'doctor12345',
      role: 'dokter',
      phone,
      profilePhoto: image
    });
    const doctor = await ensureDoctor({
      user: doctorUser,
      department: departments[departmentName],
      name,
      email,
      phone,
      specialization,
      schedule,
      image
    });
    doctors.push(doctor);
  }

  const names = [
    'Budi Santoso', 'Siti Aisyah', 'Andi Wijaya', 'Maya Putri', 'Rian Saputra',
    'Dewi Lestari', 'Agus Setiawan', 'Nadia Permata', 'Kevin Hartono', 'Lina Marlina',
    'Fajar Nugroho', 'Rina Anggraini', 'Tono Prasetyo', 'Clara Susanti', 'Yoga Firmansyah',
    'Niko Halim', 'Tasya Amelia', 'Hendra Gunawan', 'Vina Oktaviani', 'Dimas Akbar',
    'Putri Maharani', 'Farhan Ardiansyah', 'Citra Ananda', 'Robby Kurniawan', 'Melati Sari',
    'Joko Wibowo', 'Ayu Safitri', 'Steven Lim', 'Kartika Dewi', 'Bayu Ramadhan',
    'Monica Tan', 'Rafael Yusuf', 'Nabila Zahra', 'Rizky Aditya', 'Felicia Wong',
    'Daniel Pratama', 'Tiara Natalia', 'Samuel Christian', 'Indah Puspita', 'Reza Maulana'
  ];

  const complaints = [
    'Nyeri dada ringan saat beraktivitas.',
    'Sering pusing dan sulit konsentrasi.',
    'Nyeri lutut setelah olahraga.',
    'Demam dan batuk pada anak.',
    'Ruam kulit dan gatal sejak dua hari.',
    'Kontrol lanjutan hasil pemeriksaan.',
    'Keluhan sesak napas mendadak.',
    'Butuh jadwal pemeriksaan radiologi.',
    'Kontrol kesehatan rutin.',
    'Konsultasi hasil lab terbaru.'
  ];

  let patientIndex = 0;
  for (const doctor of doctors) {
    for (let i = 0; i < 5; i += 1) {
      const name = names[patientIndex];
      const email = `patient${String(patientIndex + 1).padStart(2, '0')}@clinic.test`;
      const phone = `08123${String(patientIndex + 1).padStart(7, '0')}`;
      const user = await ensureUser({
        name,
        email,
        password: 'pasien12345',
        role: 'pasien',
        phone,
        profilePhoto: i % 2 === 0 ? 'assets/img/person/person-m-9.webp' : 'assets/img/person/person-f-9.webp'
      });
      const patient = await ensurePatientForUser(user, {
        birthDate: `199${patientIndex % 10}-0${(patientIndex % 9) + 1}-1${patientIndex % 9}`,
        gender: patientIndex % 2 === 0 ? 'Laki-laki' : 'Perempuan',
        bloodType: ['A', 'B', 'AB', 'O'][patientIndex % 4],
        address: `Jl. Dummy Pasien No. ${patientIndex + 1}, Medan`
      });

      const existingAppointment = await Appointment.findOne({ where: { patientId: patient.id, doctorId: doctor.id } });
      if (!existingAppointment) {
        const day = String(10 + (patientIndex % 15)).padStart(2, '0');
        const hour = String(9 + (i % 6)).padStart(2, '0');
        await Appointment.create({
          patientId: patient.id,
          doctorId: doctor.id,
          departmentId: doctor.departmentId,
          assignedByCsId: csUser.id,
          patientName: user.name,
          patientNumber: patient.medicalRecordNumber,
          email: user.email,
          phone: user.phone,
          appointmentDate: `2026-07-${day}`,
          appointmentTime: `${hour}:00:00`,
          symptoms: complaints[patientIndex % complaints.length],
          status: ['scheduled', 'completed', 'scheduled', 'completed', 'scheduled'][i]
        });
      }
      patientIndex += 1;
    }
  }

  const demoRequest = await Appointment.findOne({ where: { patientId: demoPatient.id, status: 'pending' } });
  if (!demoRequest) {
    await Appointment.create({
      patientId: demoPatient.id,
      patientName: patientDemo.name,
      patientNumber: demoPatient.medicalRecordNumber,
      email: patientDemo.email,
      phone: patientDemo.phone,
      symptoms: 'Saya ingin konsultasi awal dan menanyakan jadwal dokter yang tersedia.',
      status: 'pending'
    });
  }

  const feedbackCount = await Feedback.count();
  if (feedbackCount === 0) {
    await Feedback.create({
      name: 'Andi Wijaya',
      email: 'andi@example.com',
      subject: 'Informasi layanan',
      message: 'Apakah klinik menerima appointment hari Sabtu?',
      status: 'new'
    });
  }

  const openConversation = await ChatConversation.findOne({ where: { patientUserId: patientDemo.id, status: 'open' } });
  if (!openConversation) {
    const conversation = await ChatConversation.create({
      patientUserId: patientDemo.id,
      assignedCsId: csUser.id,
      status: 'open',
      subject: 'Live Chat Pasien Demo',
      lastMessageAt: new Date()
    });
    await ChatMessage.bulkCreate([
      {
        conversationId: conversation.id,
        senderUserId: patientDemo.id,
        senderRole: 'pasien',
        message: 'Halo, saya ingin bertanya soal jadwal konsultasi.',
        messageType: 'text'
      },
      {
        conversationId: conversation.id,
        senderUserId: csUser.id,
        senderRole: 'customer_service',
        message: 'Halo, dengan senang hati. Boleh jelaskan keluhan singkatnya?',
        messageType: 'text'
      }
    ]);
  }

  console.log('Seed data berhasil dibuat / diperbarui.');
  console.log('Akun demo: admin@clinic.test/admin12345, cs@clinic.test/cs12345, pasien@clinic.test/pasien12345, doctor emails/doctor12345.');
}

module.exports = seedInitialData;
