document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('appointmentForm');
  const departmentSelect = document.getElementById('departmentSelect');
  const doctorSelect = document.getElementById('doctorSelect');
  const messageBox = document.getElementById('appointmentMessage');
  const daySelect = document.getElementById('appointmentDay');
  const monthSelect = document.getElementById('appointmentMonth');
  const yearSelect = document.getElementById('appointmentYear');
  const dateHidden = document.getElementById('appointmentDateHidden');
  let departments = [];
  let doctors = [];

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function todayParts() {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  }

  function daysInMonth(year, month) {
    return new Date(Number(year), Number(month), 0).getDate();
  }

  function dayOptions(year, month, selectedDay) {
    const today = todayParts();
    const max = daysInMonth(year, month);
    const min = Number(year) === today.year && Number(month) === today.month ? today.day : 1;
    const safeSelected = Math.min(Math.max(Number(selectedDay) || min, min), max);
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
      .map((day) => `<option value="${String(day).padStart(2, '0')}" ${day === safeSelected ? 'selected' : ''}>${day}</option>`).join('');
  }

  function buildDateSelectors() {
    if (!daySelect || !monthSelect || !yearSelect || !dateHidden) return;
    const now = todayParts();
    yearSelect.innerHTML = Array.from({ length: 3 }, (_, i) => now.year + i)
      .map((year) => `<option value="${year}" ${year === now.year ? 'selected' : ''}>${year}</option>`).join('');
    monthSelect.innerHTML = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      .map((month, i) => {
        const value = i + 1;
        const disabled = value < now.month ? 'disabled' : '';
        return `<option value="${String(value).padStart(2, '0')}" ${value === now.month ? 'selected' : ''} ${disabled}>${month}</option>`;
      }).join('');
    daySelect.innerHTML = dayOptions(now.year, now.month, now.day);
    syncDate();
  }

  function updateDayOptions() {
    const today = todayParts();
    const selectedYear = Number(yearSelect.value);
    Array.from(monthSelect.options).forEach((option) => {
      option.disabled = selectedYear === today.year && Number(option.value) < today.month;
    });
    if (selectedYear === today.year && Number(monthSelect.value) < today.month) {
      monthSelect.value = String(today.month).padStart(2, '0');
    }
    daySelect.innerHTML = dayOptions(yearSelect.value, monthSelect.value, daySelect.value);
    syncDate();
  }

  function syncDate() {
    if (!daySelect || !monthSelect || !yearSelect || !dateHidden) return;
    if (daySelect.value && monthSelect.value && yearSelect.value) {
      dateHidden.value = `${yearSelect.value}-${monthSelect.value}-${daySelect.value}`;
    } else {
      dateHidden.value = '';
    }
  }

  daySelect?.addEventListener('change', syncDate);
  monthSelect?.addEventListener('change', updateDayOptions);
  yearSelect?.addEventListener('change', updateDayOptions);

  async function loadOptions() {
    try {
      const departmentResult = await Api.request('/departments');
      const doctorResult = await Api.request('/doctors?active=true');
      departments = departmentResult.data || [];
      doctors = doctorResult.data || [];

      departmentSelect.innerHTML = '<option value="">Pilih Poli</option>' + departments
        .filter((item) => item.isActive !== false)
        .map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`)
        .join('');
      doctorSelect.innerHTML = '<option value="">Pilih poli terlebih dahulu</option>';
      doctorSelect.disabled = true;
    } catch (error) {
      departmentSelect.innerHTML = '<option value="">Gagal memuat poli</option>';
      Api.showMessage(messageBox, error.message, 'error');
    }
  }

  function renderDoctors(departmentId) {
    const filteredDoctors = doctors.filter((doctor) => String(doctor.departmentId) === String(departmentId));
    doctorSelect.disabled = !departmentId;
    doctorSelect.innerHTML = departmentId
      ? '<option value="">Pilih Dokter</option>' + filteredDoctors
        .map((doctor) => `<option value="${doctor.id}">${escapeHtml(doctor.name)} - ${escapeHtml(doctor.specialization)} (${escapeHtml(doctor.schedule)})</option>`)
        .join('')
      : '<option value="">Pilih poli terlebih dahulu</option>';
  }

  if (departmentSelect) departmentSelect.addEventListener('change', (event) => renderDoctors(event.target.value));

  if (form) {
    const user = Api.getUser();
    if (user) {
      const nameInput = form.querySelector('[name="patientName"]');
      const emailInput = form.querySelector('[name="email"]');
      const phoneInput = form.querySelector('[name="phone"]');
      if (nameInput && !nameInput.value) nameInput.value = user.name || '';
      if (emailInput && !emailInput.value) emailInput.value = user.email || '';
      if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      syncDate();
      try {
        const payload = Api.formToObject(form);
        const result = await Api.request('/appointments', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        form.reset();
        buildDateSelectors();
        await loadOptions();
        Api.showMessage(messageBox, result.message, 'success');
      } catch (error) {
        Api.showMessage(messageBox, error.message, 'error');
      }
    });
  }

  buildDateSelectors();
  await loadOptions();
});
