const Dashboard = (() => {
  let currentUser = null;
  let currentProfile = null;
  let departments = [];
  let doctors = [];
  let appointments = [];
  let conversations = [];
  let activeConversationId = null;
  let activeAdminConversationId = null;
  let patientConversationId = null;
  let socket = null;

  const dashboardMessage = () => document.getElementById('dashboardMessage');

  function escapeHtml(value = '') {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function shortText(value = '', max = 65) {
    const text = String(value || '-');
    return text.length > max ? `${text.slice(0, max)}...` : text;
  }

  function statusPill(status) {
    return `<span class="status-pill status-${escapeHtml(status)}">${escapeHtml(String(status || '-').toUpperCase())}</span>`;
  }

  function formatDate(value) {
    if (!value) return '<span class="text-muted">Belum dijadwalkan</span>';
    const [year, month, day] = String(value).split('-');
    return `${day}/${month}/${year}`;
  }

  function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  }

  function formatTime(value) {
    if (!value) return '';
    return String(value).slice(0, 5);
  }

  function todayParts() {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  }

  function todayString() {
    const { year, month, day } = todayParts();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function daysInMonth(year, month) {
    return new Date(Number(year), Number(month), 0).getDate();
  }

  function parseSafeDate(dateValue) {
    const today = todayString();
    const value = /^\d{4}-\d{2}-\d{2}$/.test(String(dateValue || '')) && dateValue >= today ? dateValue : today;
    const [year, month, day] = value.split('-').map(Number);
    return { year, month, day };
  }

  function isPastDateString(dateString) {
    return String(dateString || '') < todayString();
  }

  function defaultAvatar() {
    if (!currentUser) return 'assets/img/person/person-m-3.webp';
    if (currentUser.role === 'customer_service') return 'assets/img/person/person-f-11.webp';
    if (currentUser.role === 'dokter') return currentUser.profilePhoto || 'assets/img/health/staff-1.webp';
    if (currentUser.role === 'admin') return 'assets/img/person/person-m-7.webp';
    return 'assets/img/person/person-m-3.webp';
  }

  function setAvatar(src) {
    const photo = src || defaultAvatar();
    const navAvatar = document.getElementById('navAvatar');
    const heroAvatar = document.getElementById('heroAvatar');
    const profilePreview = document.getElementById('profilePreview');
    if (navAvatar) navAvatar.src = photo;
    if (heroAvatar) heroAvatar.src = photo;
    if (profilePreview) profilePreview.src = photo;
  }

  function roleLabel(role) {
    return role === 'customer_service' ? 'customer service' : role;
  }

  async function init() {
    if (!Api.getToken()) {
      window.location.href = 'login.html';
      return;
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
      Api.removeToken();
      window.location.href = 'login.html';
    });

    document.getElementById('openAppointmentBtn').addEventListener('click', () => {
      const target = currentUser?.role === 'pasien' ? document.getElementById('patientAppointmentArea') : document.getElementById('appointmentSection');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    try {
      const me = await Api.request('/auth/me');
      currentUser = me.user;
      Api.setUser(currentUser);
      document.getElementById('userName').textContent = currentUser.name;
      document.getElementById('roleBadge').textContent = roleLabel(currentUser.role);
      setAvatar(currentUser.profilePhoto);
      applyRoleView();
      setupSocket();
      bindForms();

      await Promise.all([loadProfile(), loadDepartments(), loadDoctors()]);
      await loadStats();
      await loadAppointments();

      if (currentUser.role === 'admin') {
        await Promise.all([loadPatients(), loadFeedbacks(), loadCancellations(), loadConversations()]);
      }
      if (currentUser.role === 'customer_service') {
        await loadConversations();
      }
      if (currentUser.role === 'pasien') {
        setupPatientChatBubble();
      }
    } catch (error) {
      Api.showMessage(dashboardMessage(), error.message, 'error');
      if (error.message.toLowerCase().includes('token')) {
        setTimeout(() => window.location.href = 'login.html', 1000);
      }
    }
  }

  function applyRoleView() {
    if (currentUser.role === 'admin') {
      document.getElementById('adminArea').classList.remove('d-none');
      document.querySelectorAll('.admin-only').forEach((item) => item.classList.remove('d-none'));
      document.querySelectorAll('.cs-admin-only').forEach((item) => item.classList.remove('d-none'));
    }
    if (currentUser.role === 'customer_service') {
      document.getElementById('csArea').classList.remove('d-none');
      document.querySelectorAll('.cs-admin-only').forEach((item) => item.classList.remove('d-none'));
      document.getElementById('openAppointmentBtn').innerHTML = '<i class="bi bi-inbox"></i> Buka Inbox CS';
    }
    if (currentUser.role === 'pasien') {
      document.getElementById('patientAppointmentArea').classList.remove('d-none');
      document.querySelectorAll('.patient-profile-only').forEach((item) => item.classList.remove('d-none'));
    }
    if (currentUser.role === 'dokter') {
      document.getElementById('openAppointmentBtn').innerHTML = '<i class="bi bi-calendar-check"></i> Lihat Request/Jadwal Saya';
    }
  }

  function setupSocket() {
    if (!window.io) return;
    socket = io({ auth: { token: Api.getToken() } });

    ['appointment:created', 'appointment:updated', 'appointment:requested', 'appointment:scheduled', 'appointment:completed', 'appointment:cancelled', 'appointment:deleted'].forEach((eventName) => {
      socket.on(eventName, async () => {
        const jobs = [loadStats(), loadAppointments()];
        if (currentUser.role === 'admin') jobs.push(loadCancellations());
        await Promise.all(jobs);
      });
    });

    socket.on('chat:conversationCreated', async () => {
      if (currentUser.role === 'customer_service' || currentUser.role === 'admin') await loadConversations();
    });

    socket.on('chat:message', async (payload) => {
      if (payload?.conversationId === activeConversationId) await openConversation(activeConversationId, false);
      if (payload?.conversationId === activeAdminConversationId) await openAdminConversation(activeAdminConversationId, false);
      if (payload?.conversationId === patientConversationId) await loadPatientMessages(patientConversationId);
      if (currentUser.role === 'customer_service' || currentUser.role === 'admin') await loadConversations();
    });

    socket.on('chat:closed', async (payload) => {
      if (payload?.conversationId === activeConversationId) await openConversation(activeConversationId, false);
      if (payload?.conversationId === activeAdminConversationId) await openAdminConversation(activeAdminConversationId, false);
      if (payload?.conversationId === patientConversationId) await loadPatientMessages(patientConversationId);
      if (currentUser.role === 'customer_service' || currentUser.role === 'admin') await loadConversations();
    });
  }

  function bindForms() {
    const profileForm = document.getElementById('profileForm');
    const photoInput = document.getElementById('profilePhotoFile');
    if (photoInput) {
      photoInput.addEventListener('change', uploadProfilePhoto);
    }

    if (profileForm) {
      profileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          const payload = Api.formToObject(profileForm);
          const result = await Api.request('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) });
          currentUser = result.user;
          Api.setUser(currentUser);
          document.getElementById('userName').textContent = currentUser.name;
          setAvatar(currentUser.profilePhoto);
          await loadProfile();
          Api.showMessage(dashboardMessage(), result.message, 'success');
        } catch (error) {
          Api.showMessage(dashboardMessage(), error.message, 'error');
        }
      });
    }

    const patientAppointmentForm = document.getElementById('patientAppointmentForm');
    if (patientAppointmentForm) {
      patientAppointmentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          const payload = Api.formToObject(patientAppointmentForm);
          const result = await Api.request('/appointments', { method: 'POST', body: JSON.stringify(payload) });
          patientAppointmentForm.querySelector('[name="symptoms"]').value = '';
          await Promise.all([loadStats(), loadAppointments()]);
          Api.showMessage(dashboardMessage(), result.message, 'success');
        } catch (error) {
          Api.showMessage(dashboardMessage(), error.message, 'error');
        }
      });
    }

    const departmentForm = document.getElementById('departmentForm');
    if (departmentForm) {
      departmentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          await Api.request('/departments', { method: 'POST', body: JSON.stringify(Api.formToObject(departmentForm)) });
          departmentForm.reset();
          await loadDepartments();
          Api.showMessage(dashboardMessage(), 'Poli berhasil ditambahkan.', 'success');
        } catch (error) {
          Api.showMessage(dashboardMessage(), error.message, 'error');
        }
      });
    }

    const doctorForm = document.getElementById('doctorForm');
    if (doctorForm) {
      doctorForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          const payload = Api.formToObject(doctorForm);
          payload.createLogin = document.getElementById('createLogin').checked;
          await Api.request('/doctors', { method: 'POST', body: JSON.stringify(payload) });
          doctorForm.reset();
          await loadDoctors();
          Api.showMessage(dashboardMessage(), 'Dokter berhasil ditambahkan.', 'success');
        } catch (error) {
          Api.showMessage(dashboardMessage(), error.message, 'error');
        }
      });
    }

    const csChatForm = document.getElementById('csChatForm');
    if (csChatForm) {
      csChatForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!activeConversationId) return;
        const input = csChatForm.querySelector('[name="message"]');
        try {
          await Api.request(`/chat/conversations/${activeConversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ message: input.value })
          });
          input.value = '';
          await openConversation(activeConversationId, false);
        } catch (error) {
          Api.showMessage(dashboardMessage(), error.message, 'error');
        }
      });
    }

    const closeChatBtn = document.getElementById('closeChatBtn');
    if (closeChatBtn) closeChatBtn.addEventListener('click', closeActiveConversation);

    const patientChatForm = document.getElementById('patientChatForm');
    if (patientChatForm) {
      patientChatForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!patientConversationId) await startPatientChat();
        const input = patientChatForm.querySelector('[name="message"]');
        try {
          await Api.request(`/chat/conversations/${patientConversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ message: input.value })
          });
          input.value = '';
          await loadPatientMessages(patientConversationId);
        } catch (error) {
          Api.showMessage(dashboardMessage(), error.message, 'error');
        }
      });
    }

    const csInboxTable = document.getElementById('csInboxTable');
    if (csInboxTable) {
      csInboxTable.addEventListener('change', (event) => {
        if (event.target.classList.contains('assign-dept')) {
          const id = event.target.dataset.id;
          setDoctorOptionsForAppointment(id, event.target.value);
        }
      });

      csInboxTable.addEventListener('click', async (event) => {
        const assignButton = event.target.closest('[data-assign-id]');
        const chatButton = event.target.closest('[data-chat-user]');
        if (assignButton) await assignAppointment(assignButton.dataset.assignId);
        if (chatButton) await openPatientChatFromButton(chatButton.dataset.chatUser);
      });
    }

    const appointmentsTable = document.getElementById('appointmentsTable');
    if (appointmentsTable) {
      appointmentsTable.addEventListener('change', (event) => {
        if (event.target.classList.contains('schedule-month') || event.target.classList.contains('schedule-year')) {
          updateDayOptions(event.target.dataset.id);
        }
      });

      appointmentsTable.addEventListener('click', async (event) => {
        const scheduleButton = event.target.closest('[data-schedule-id]');
        const completeButton = event.target.closest('[data-complete-id]');
        const cancelButton = event.target.closest('[data-cancel-id]');
        const chatButton = event.target.closest('[data-chat-user]');
        if (scheduleButton) await scheduleAppointment(scheduleButton.dataset.scheduleId);
        if (completeButton) await updateAppointmentStatus(completeButton.dataset.completeId, 'completed');
        if (cancelButton) await updateAppointmentStatus(cancelButton.dataset.cancelId, 'cancelled');
        if (chatButton) await openPatientChatFromButton(chatButton.dataset.chatUser);
      });
    }
  }

  async function uploadProfilePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);
      const result = await Api.upload('/auth/profile-photo', formData);
      const hidden = document.getElementById('profilePhotoHidden');
      if (hidden) hidden.value = result.profilePhoto;
      currentUser = result.user;
      Api.setUser(currentUser);
      setAvatar(result.profilePhoto);
      Api.showMessage(dashboardMessage(), result.message, 'success');
    } catch (error) {
      Api.showMessage(dashboardMessage(), error.message, 'error');
      event.target.value = '';
    }
  }

  async function loadProfile() {
    const result = await Api.request('/auth/profile');
    currentProfile = result.data;
    currentUser = result.data;
    Api.setUser(currentUser);
    setAvatar(currentUser.profilePhoto);
    fillProfileForm();
  }

  function fillProfileForm() {
    const form = document.getElementById('profileForm');
    if (!form || !currentProfile) return;
    form.name.value = currentProfile.name || '';
    form.email.value = currentProfile.email || '';
    form.phone.value = currentProfile.phone || '';
    document.getElementById('profilePhotoHidden').value = currentProfile.profilePhoto || '';
    setAvatar(currentProfile.profilePhoto);

    const patient = currentProfile.Patient;
    if (patient) {
      form.birthDate.value = patient.birthDate || '';
      form.gender.value = patient.gender || '';
      form.bloodType.value = patient.bloodType || '';
      form.address.value = patient.address || '';
      document.getElementById('patientRequestName').value = currentProfile.name || '';
      document.getElementById('patientRequestNumber').value = patient.medicalRecordNumber || '';
    }
  }

  async function loadStats() {
    const result = await Api.request('/dashboard/stats');
    const stats = result.data || {};
    const labels = {
      users: ['Users', 'bi-people'],
      patients: ['Pasien', 'bi-person-heart'],
      doctors: ['Dokter', 'bi-person-badge'],
      customerServices: ['Customer Service', 'bi-headset'],
      departments: ['Poli', 'bi-hospital'],
      appointments: ['Appointment', 'bi-calendar-check'],
      myAppointments: ['Appointment Saya', 'bi-calendar-heart'],
      requestedAppointments: ['Request', 'bi-inbox'],
      scheduledAppointments: ['Terjadwal', 'bi-calendar2-check'],
      completedAppointments: ['Selesai', 'bi-check-circle'],
      todayAppointments: ['Hari Ini', 'bi-calendar-day'],
      feedbacks: ['Feedback', 'bi-chat-dots'],
      openChats: ['Live Chat Open', 'bi-chat-square-dots'],
      myHandledChats: ['Chat Saya', 'bi-headset'],
      chatHistory: ['History Chat', 'bi-archive']
    };

    document.getElementById('statsRow').innerHTML = Object.entries(stats).map(([key, value]) => {
      const [label, icon] = labels[key] || [key, 'bi-graph-up'];
      return `
        <div class="col-md-6 col-xl-3">
          <div class="stat-card">
            <div class="icon"><i class="bi ${icon}"></i></div>
            <h3>${escapeHtml(value)}</h3>
            <p>${escapeHtml(label)}</p>
          </div>
        </div>`;
    }).join('');
  }

  async function loadDepartments() {
    const result = await Api.request('/departments');
    departments = result.data || [];
    const doctorDepartmentSelect = document.getElementById('doctorDepartmentSelect');
    if (doctorDepartmentSelect) {
      doctorDepartmentSelect.innerHTML = '<option value="">Pilih Poli</option>' + departments.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('');
    }
    const table = document.getElementById('departmentsTable');
    if (table) {
      table.innerHTML = departments.map((item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${escapeHtml(item.location || '-')}</td>
          <td>${item.isActive ? statusPill('active') : statusPill('inactive')}</td>
        </tr>`).join('') || '<tr><td colspan="3" class="text-muted">Belum ada data.</td></tr>';
    }
  }

  async function loadDoctors() {
    const result = await Api.request('/doctors?active=true');
    doctors = result.data || [];
    const table = document.getElementById('doctorsTable');
    if (table) {
      table.innerHTML = doctors.map((item) => `
        <tr>
          <td><img src="${escapeHtml(item.image || 'assets/img/health/staff-1.webp')}" class="mini-doctor-avatar" alt=""> ${escapeHtml(item.name)}<br><small class="text-muted">${escapeHtml(item.specialization)}</small></td>
          <td>${escapeHtml(item.Department?.name || '-')}</td>
          <td>${escapeHtml(item.schedule || '-')}</td>
        </tr>`).join('') || '<tr><td colspan="3" class="text-muted">Belum ada data.</td></tr>';
    }
  }

  async function loadPatients() {
    const result = await Api.request('/patients');
    const patients = result.data || [];
    const table = document.getElementById('patientsTable');
    table.innerHTML = patients.map((item) => `
      <tr>
        <td>${escapeHtml(item.medicalRecordNumber)}</td>
        <td>${escapeHtml(item.User?.name || '-')}</td>
        <td>${escapeHtml(item.User?.email || '-')}</td>
        <td>${escapeHtml(item.User?.phone || '-')}</td>
      </tr>`).join('') || '<tr><td colspan="4" class="text-muted">Belum ada data.</td></tr>';
  }

  async function loadFeedbacks() {
    const result = await Api.request('/feedbacks');
    const feedbacks = result.data || [];
    const table = document.getElementById('feedbacksTable');
    table.innerHTML = feedbacks.map((item) => `
      <tr>
        <td>${escapeHtml(item.name)}<br><small class="text-muted">${escapeHtml(item.email)}</small></td>
        <td>${escapeHtml(item.subject)}</td>
        <td>${statusPill(item.status)}</td>
        <td><button class="btn btn-outline-primary btn-sm" onclick="Dashboard.updateFeedbackStatus(${item.id}, 'read')">Read</button></td>
      </tr>`).join('') || '<tr><td colspan="4" class="text-muted">Belum ada feedback.</td></tr>';
  }

  async function updateFeedbackStatus(id, status) {
    try {
      await Api.request(`/feedbacks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await loadFeedbacks();
    } catch (error) {
      Api.showMessage(dashboardMessage(), error.message, 'error');
    }
  }

  async function loadCancellations() {
    if (currentUser?.role !== 'admin') return;
    const result = await Api.request('/appointments/cancellations');
    const data = result.data || [];
    const table = document.getElementById('cancellationsTable');
    if (!table) return;
    table.innerHTML = data.map((item) => `
      <tr>
        <td>#${item.appointmentId}</td>
        <td>${escapeHtml(item.patientName)}<br><small class="text-muted">${escapeHtml(item.patientNumber || '-')}</small></td>
        <td>${escapeHtml(item.Doctor?.name || item.Appointment?.Doctor?.name || '-')}<br><small class="text-muted">${escapeHtml(item.Doctor?.Department?.name || '-')}</small></td>
        <td>${escapeHtml(item.reason)}</td>
        <td>${escapeHtml(formatDateTime(item.createdAt))}</td>
      </tr>`).join('') || '<tr><td colspan="5" class="text-muted">Belum ada alasan cancel dokter.</td></tr>';
  }

  async function loadAppointments() {
    const result = await Api.request('/appointments');
    appointments = result.data || [];
    renderAppointmentsTable();
    renderCsInbox();
  }

  function renderAppointmentsTable() {
    const table = document.getElementById('appointmentsTable');
    if (!table) return;
    const headRow = table.closest('table').querySelector('thead tr');

    if (currentUser.role === 'dokter') {
      headRow.innerHTML = '<th>ID</th><th>Nama Pasien</th><th>No. RM</th><th>Keluhan</th><th>Jadwal</th><th>Status</th><th>Aksi</th>';
      table.innerHTML = appointments.map((item) => `
        <tr>
          <td>#${item.id}</td>
          <td>${escapeHtml(item.patientName)}<br><small class="text-muted">${escapeHtml(item.email || '-')}</small></td>
          <td>${escapeHtml(item.patientNumber || item.Patient?.medicalRecordNumber || '-')}</td>
          <td title="${escapeHtml(item.symptoms || '')}">${escapeHtml(shortText(item.symptoms, 70))}</td>
          <td>${formatDate(item.appointmentDate)} ${formatTime(item.appointmentTime)}</td>
          <td>${statusPill(item.status)}</td>
          <td>${renderDoctorAction(item)}</td>
        </tr>`).join('') || '<tr><td colspan="7" class="text-muted">Belum ada appointment untuk dokter ini.</td></tr>';
      return;
    }

    headRow.innerHTML = '<th>ID</th><th>Pasien</th><th>No. RM</th><th>Keluhan</th><th>Poli</th><th>Dokter</th><th>Jadwal</th><th>Status</th><th>Aksi</th>';
    table.innerHTML = appointments.map((item) => `
      <tr>
        <td>#${item.id}</td>
        <td>${escapeHtml(item.patientName)}<br><small class="text-muted">${escapeHtml(item.email)}</small></td>
        <td>${escapeHtml(item.patientNumber || item.Patient?.medicalRecordNumber || '-')}</td>
        <td title="${escapeHtml(item.symptoms || '')}">${escapeHtml(shortText(item.symptoms, 55))}</td>
        <td>${escapeHtml(item.Department?.name || item.Doctor?.Department?.name || '-')}</td>
        <td>${escapeHtml(item.Doctor?.name || '-')}</td>
        <td>${formatDate(item.appointmentDate)} ${formatTime(item.appointmentTime)}</td>
        <td>${statusPill(item.status)}</td>
        <td>${renderAppointmentAction(item)}</td>
      </tr>`).join('') || '<tr><td colspan="9" class="text-muted">Belum ada appointment.</td></tr>';
  }

  function renderAppointmentAction(item) {
    if (currentUser.role === 'customer_service') return renderChatButton(item);
    if (currentUser.role === 'admin') return '<span class="text-muted">Monitoring</span>';
    return '<span class="text-muted">-</span>';
  }

  function renderChatButton(item) {
    const patientUserId = item.Patient?.User?.id;
    if (!patientUserId) return '<span class="text-muted">-</span>';
    return `<button class="btn btn-outline-primary btn-sm rounded-circle" title="Chat pasien" data-chat-user="${patientUserId}"><i class="bi bi-chat-dots"></i></button>`;
  }

  function renderDoctorAction(item) {
    if (['completed', 'cancelled'].includes(item.status)) return '<span class="text-muted">Final</span>';
    if (item.status === 'pending') return '<span class="text-muted">Menunggu CS</span>';

    if (item.status === 'requested') {
      return `
        <div class="doctor-action-box">
          ${renderDateSelectors(item.id, item.appointmentDate)}
          ${renderTimeSelect(item.id, item.appointmentTime)}
          <button class="btn btn-primary btn-sm w-100" data-schedule-id="${item.id}"><i class="bi bi-calendar-check"></i> Jadwalkan</button>
          <textarea class="form-control form-control-sm cancel-reason-${item.id}" rows="2" placeholder="Alasan cancel wajib diisi jika dibatalkan"></textarea>
          <button class="btn btn-outline-danger btn-sm w-100" data-cancel-id="${item.id}"><i class="bi bi-x-circle"></i> Cancel</button>
        </div>`;
    }

    if (item.status === 'scheduled') {
      return `
        <div class="doctor-action-box">
          <button class="btn btn-success btn-sm w-100" data-complete-id="${item.id}"><i class="bi bi-check-circle"></i> Complete</button>
          <textarea class="form-control form-control-sm cancel-reason-${item.id}" rows="2" placeholder="Alasan cancel wajib diisi"></textarea>
          <button class="btn btn-outline-danger btn-sm w-100" data-cancel-id="${item.id}"><i class="bi bi-x-circle"></i> Cancel</button>
        </div>`;
    }

    return '<span class="text-muted">-</span>';
  }

  async function scheduleAppointment(id) {
    try {
      const appointmentDate = getScheduleValue(id);
      const appointmentTime = document.querySelector(`.schedule-time[data-id="${id}"]`)?.value;
      if (!appointmentDate || isPastDateString(appointmentDate)) throw new Error('Tanggal tidak boleh hari sebelumnya dari tanggal hari ini.');
      await Api.request(`/appointments/${id}/schedule`, {
        method: 'PATCH',
        body: JSON.stringify({ appointmentDate, appointmentTime })
      });
      await Promise.all([loadStats(), loadAppointments()]);
      Api.showMessage(dashboardMessage(), 'Jadwal berhasil dipilih dokter. Status menjadi SCHEDULED.', 'success');
    } catch (error) {
      Api.showMessage(dashboardMessage(), error.message, 'error');
    }
  }

  async function updateAppointmentStatus(id, status) {
    try {
      const payload = { status };
      if (status === 'cancelled') {
        const reason = document.querySelector(`.cancel-reason-${id}`)?.value?.trim();
        if (!reason) throw new Error('Alasan cancel wajib diisi.');
        payload.cancelReason = reason;
      }
      await Api.request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) });
      const jobs = [loadStats(), loadAppointments()];
      if (currentUser.role === 'admin') jobs.push(loadCancellations());
      await Promise.all(jobs);
      Api.showMessage(dashboardMessage(), status === 'cancelled' ? 'Appointment dicancel dan alasan masuk ke admin.' : 'Appointment berhasil diselesaikan.', 'success');
    } catch (error) {
      Api.showMessage(dashboardMessage(), error.message, 'error');
    }
  }

  function options(items, selectedValue, labelKey = 'name') {
    return items.map((item) => `<option value="${item.id}" ${String(item.id) === String(selectedValue || '') ? 'selected' : ''}>${escapeHtml(item[labelKey])}</option>`).join('');
  }

  function renderDateSelectors(id, dateValue) {
    const selected = parseSafeDate(dateValue);
    const today = todayParts();
    const years = Array.from({ length: 3 }, (_, i) => today.year + i).map((year) => `<option value="${year}" ${year === selected.year ? 'selected' : ''}>${year}</option>`).join('');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((month, i) => {
      const monthValue = i + 1;
      const disabled = selected.year === today.year && monthValue < today.month ? 'disabled' : '';
      return `<option value="${String(monthValue).padStart(2, '0')}" ${monthValue === selected.month ? 'selected' : ''} ${disabled}>${month}</option>`;
    }).join('');
    const days = dayOptions(selected.year, selected.month, selected.day);
    return `
      <div class="date-select-row">
        <select class="form-select form-select-sm schedule-day" data-id="${id}">${days}</select>
        <select class="form-select form-select-sm schedule-month" data-id="${id}">${months}</select>
        <select class="form-select form-select-sm schedule-year" data-id="${id}">${years}</select>
      </div>`;
  }

  function dayOptions(year, month, selectedDay) {
    const today = todayParts();
    const max = daysInMonth(year, month);
    const min = Number(year) === today.year && Number(month) === today.month ? today.day : 1;
    const safeSelected = Math.min(Math.max(Number(selectedDay) || min, min), max);
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
      .map((day) => `<option value="${String(day).padStart(2, '0')}" ${day === safeSelected ? 'selected' : ''}>${day}</option>`).join('');
  }

  function updateDayOptions(id) {
    const daySelect = document.querySelector(`.schedule-day[data-id="${id}"]`);
    const monthSelect = document.querySelector(`.schedule-month[data-id="${id}"]`);
    const yearSelect = document.querySelector(`.schedule-year[data-id="${id}"]`);
    if (!daySelect || !monthSelect || !yearSelect) return;

    const previousDay = Number(daySelect.value || 1);
    const today = todayParts();
    Array.from(monthSelect.options).forEach((option) => {
      option.disabled = Number(yearSelect.value) === today.year && Number(option.value) < today.month;
    });
    if (Number(yearSelect.value) === today.year && Number(monthSelect.value) < today.month) {
      monthSelect.value = String(today.month).padStart(2, '0');
    }
    daySelect.innerHTML = dayOptions(yearSelect.value, monthSelect.value, previousDay);
  }

  function renderTimeSelect(id, timeValue) {
    const current = timeValue ? String(timeValue).slice(0, 5) : '09:00';
    const times = [];
    for (let hour = 8; hour <= 17; hour += 1) {
      ['00', '30'].forEach((minute) => times.push(`${String(hour).padStart(2, '0')}:${minute}`));
    }
    return `<select class="form-select form-select-sm schedule-time" data-id="${id}">${times.map((time) => `<option value="${time}:00" ${time === current ? 'selected' : ''}>${time}</option>`).join('')}</select>`;
  }

  function getScheduleValue(id) {
    const day = document.querySelector(`.schedule-day[data-id="${id}"]`)?.value;
    const month = document.querySelector(`.schedule-month[data-id="${id}"]`)?.value;
    const year = document.querySelector(`.schedule-year[data-id="${id}"]`)?.value;
    if (!day || !month || !year) return '';
    return `${year}-${month}-${day}`;
  }

  function doctorOptionsByDepartment(departmentId, selectedDoctorId = '') {
    if (!departmentId) return '<option value="">Pilih poli terlebih dahulu</option>';
    const filtered = doctors.filter((doctor) => String(doctor.departmentId) === String(departmentId));
    return '<option value="">Pilih Dokter</option>' + filtered.map((doctor) => `<option value="${doctor.id}" ${String(doctor.id) === String(selectedDoctorId || '') ? 'selected' : ''}>${escapeHtml(doctor.name)} - ${escapeHtml(doctor.specialization)}</option>`).join('');
  }

  function setDoctorOptionsForAppointment(id, departmentId, selectedDoctorId = '') {
    const doctorSelect = document.querySelector(`.assign-doctor[data-id="${id}"]`);
    if (!doctorSelect) return;
    doctorSelect.innerHTML = doctorOptionsByDepartment(departmentId, selectedDoctorId);
    doctorSelect.disabled = !departmentId;
  }

  function renderCsInbox() {
    const table = document.getElementById('csInboxTable');
    if (!table) return;
    const data = appointments.filter((item) => ['pending', 'requested', 'scheduled'].includes(item.status));
    table.innerHTML = data.map((item) => {
      const departmentId = item.departmentId || item.Doctor?.departmentId || '';
      const canSend = item.status === 'pending';
      const sendContent = canSend
        ? `<button class="btn btn-primary btn-sm" data-assign-id="${item.id}"><i class="bi bi-send"></i> Kirim ke Dokter</button>`
        : `<small class="text-muted">${item.status === 'requested' ? 'Menunggu dokter menjadwalkan' : 'Sudah dijadwalkan dokter'}</small>`;
      return `
      <tr>
        <td>${escapeHtml(item.patientName)}<br><small class="text-muted">${escapeHtml(item.patientNumber || '-')}</small></td>
        <td title="${escapeHtml(item.symptoms || '')}">${escapeHtml(shortText(item.symptoms, 70))}</td>
        <td>
          <select class="form-select form-select-sm assign-dept" data-id="${item.id}" ${canSend ? '' : 'disabled'}>
            <option value="">Pilih Poli</option>${options(departments, departmentId)}
          </select>
        </td>
        <td>
          <select class="form-select form-select-sm assign-doctor" data-id="${item.id}" ${departmentId && canSend ? '' : 'disabled'}>
            ${doctorOptionsByDepartment(departmentId, item.doctorId)}
          </select>
        </td>
        <td>${statusPill(item.status)}</td>
        <td>${renderChatButton(item)}</td>
        <td>${sendContent}</td>
      </tr>`;
    }).join('') || '<tr><td colspan="7" class="text-muted">Tidak ada request appointment baru.</td></tr>';
  }

  async function assignAppointment(id) {
    try {
      const departmentId = document.querySelector(`.assign-dept[data-id="${id}"]`)?.value;
      const doctorId = document.querySelector(`.assign-doctor[data-id="${id}"]`)?.value;
      if (!departmentId) throw new Error('Pilih poli terlebih dahulu.');
      if (!doctorId) throw new Error('Pilih dokter sesuai poli.');
      await Api.request(`/appointments/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ doctorId, departmentId })
      });
      await Promise.all([loadStats(), loadAppointments()]);
      Api.showMessage(dashboardMessage(), 'Appointment dikirim ke dokter. Status menjadi REQUESTED.', 'success');
    } catch (error) {
      Api.showMessage(dashboardMessage(), error.message, 'error');
    }
  }

  async function openPatientChatFromButton(patientUserId) {
    if (!patientUserId) return;
    try {
      const result = await Api.request('/chat/conversations/from-patient', {
        method: 'POST',
        body: JSON.stringify({ patientUserId, subject: 'Live Chat Appointment' })
      });
      activeConversationId = result.data.id;
      document.getElementById('csArea')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      await loadConversations();
      await openConversation(activeConversationId);
    } catch (error) {
      Api.showMessage(dashboardMessage(), error.message, 'error');
    }
  }

  async function loadConversations() {
    if (!['customer_service', 'admin'].includes(currentUser.role)) return;
    const result = await Api.request('/chat/conversations');
    conversations = result.data || [];
    renderConversationLists();
  }

  function conversationItem(conversation, target) {
    const patient = conversation.PatientUser || {};
    const latest = conversation.ChatMessages?.[0]?.message || '';
    const activeClass = (target === 'cs' && conversation.id === activeConversationId) || (target === 'admin' && conversation.id === activeAdminConversationId) ? 'active' : '';
    return `
      <button class="conversation-item ${activeClass}" type="button" onclick="Dashboard.${target === 'cs' ? 'openConversation' : 'openAdminConversation'}(${conversation.id})">
        <div class="d-flex justify-content-between gap-2">
          <strong>${escapeHtml(patient.name || 'Pasien')}</strong>
          ${statusPill(conversation.status)}
        </div>
        <small class="text-muted">${escapeHtml(shortText(latest, 55))}</small>
      </button>`;
  }

  function renderConversationLists() {
    const csList = document.getElementById('csConversationList');
    const adminList = document.getElementById('adminConversationList');
    if (csList) csList.innerHTML = conversations.map((conversation) => conversationItem(conversation, 'cs')).join('') || '<p class="text-muted">Belum ada live chat.</p>';
    if (adminList) adminList.innerHTML = conversations.map((conversation) => conversationItem(conversation, 'admin')).join('') || '<p class="text-muted">Belum ada history chat.</p>';
  }

  async function openConversation(id, scroll = true) {
    activeConversationId = id;
    if (socket) socket.emit('joinConversation', id);
    const result = await Api.request(`/chat/conversations/${id}/messages`);
    const conversation = result.conversation;
    document.getElementById('csChatTitle').textContent = conversation.PatientUser?.name || 'Percakapan Pasien';
    document.getElementById('csChatMeta').textContent = `${conversation.PatientUser?.email || '-'} • Status: ${conversation.status}`;
    renderMessages('csChatMessages', result.data || []);
    document.getElementById('csChatForm').classList.toggle('d-none', conversation.status === 'closed');
    document.getElementById('closeChatBtn').classList.toggle('d-none', conversation.status === 'closed');
    renderConversationLists();
    if (scroll) document.getElementById('csChatMessages').scrollTop = document.getElementById('csChatMessages').scrollHeight;
  }

  async function openAdminConversation(id, scroll = true) {
    activeAdminConversationId = id;
    if (socket) socket.emit('joinConversation', id);
    const result = await Api.request(`/chat/conversations/${id}/messages`);
    renderMessages('adminChatMessages', result.data || []);
    renderConversationLists();
    if (scroll) document.getElementById('adminChatMessages').scrollTop = document.getElementById('adminChatMessages').scrollHeight;
  }

  function renderMessages(containerId, messages) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = messages.map((item) => {
      const senderName = item.Sender?.name || item.senderRole;
      const mine = item.senderUserId === currentUser.id;
      const system = item.messageType === 'system';
      return `
        <div class="chat-message ${mine ? 'mine' : 'theirs'} ${system ? 'system' : ''}">
          <div class="chat-bubble">
            <small>${escapeHtml(system ? 'System' : senderName)}</small>
            <div>${escapeHtml(item.message)}</div>
          </div>
        </div>`;
    }).join('') || '<p class="text-muted text-center my-4">Belum ada pesan.</p>';
    container.scrollTop = container.scrollHeight;
  }

  async function closeActiveConversation() {
    if (!activeConversationId) return;
    try {
      await Api.request(`/chat/conversations/${activeConversationId}/close`, { method: 'PATCH', body: JSON.stringify({}) });
      await Promise.all([openConversation(activeConversationId, false), loadConversations()]);
      Api.showMessage(dashboardMessage(), 'Live chat diakhiri dan tersimpan di history admin.', 'success');
    } catch (error) {
      Api.showMessage(dashboardMessage(), error.message, 'error');
    }
  }

  function setupPatientChatBubble() {
    const button = document.getElementById('patientChatButton');
    const widget = document.getElementById('patientChatWidget');
    const close = document.getElementById('patientChatClose');
    button.classList.remove('d-none');
    button.addEventListener('click', async () => {
      widget.classList.toggle('d-none');
      if (!widget.classList.contains('d-none')) await startPatientChat();
    });
    close.addEventListener('click', () => widget.classList.add('d-none'));
  }

  async function startPatientChat() {
    const result = await Api.request('/chat/conversations', { method: 'POST', body: JSON.stringify({ subject: 'Live Chat Pasien' }) });
    patientConversationId = result.data.id;
    if (socket) socket.emit('joinConversation', patientConversationId);
    await loadPatientMessages(patientConversationId);
  }

  async function loadPatientMessages(id) {
    const result = await Api.request(`/chat/conversations/${id}/messages`);
    renderMessages('patientChatMessages', result.data || []);
  }

  return {
    init,
    loadAppointments,
    loadDepartments,
    loadDoctors,
    loadPatients,
    loadFeedbacks,
    loadCancellations,
    updateFeedbackStatus,
    updateAppointmentStatus,
    loadConversations,
    openConversation,
    openAdminConversation
  };
})();

document.addEventListener('DOMContentLoaded', Dashboard.init);
