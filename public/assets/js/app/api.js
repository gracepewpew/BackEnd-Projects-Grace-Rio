const Api = (() => {
  const baseUrl = '/api';

  // sessionStorage sengaja dipakai agar 1 browser bisa login beberapa role sekaligus di tab/window berbeda.
  // localStorage dibagikan semua tab, jadi sebelumnya token pasien/dokter/admin saling menimpa.
  const storage = window.sessionStorage;

  function getToken() {
    return storage.getItem('clinicToken');
  }

  function setToken(token) {
    storage.setItem('clinicToken', token);
  }

  function removeToken() {
    storage.removeItem('clinicToken');
    storage.removeItem('clinicUser');
    window.localStorage.removeItem('clinicToken');
    window.localStorage.removeItem('clinicUser');
  }

  function getUser() {
    try {
      return JSON.parse(storage.getItem('clinicUser'));
    } catch (error) {
      return null;
    }
  }

  function setUser(user) {
    storage.setItem('clinicUser', JSON.stringify(user));
  }

  async function request(endpoint, options = {}) {
    const headers = options.headers || {};
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';

    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      const message = data.message || 'Terjadi kesalahan pada server.';
      throw new Error(message);
    }

    return data;
  }


  async function upload(endpoint, formData) {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${baseUrl}${endpoint}`, { method: 'POST', headers, body: formData });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      const message = data.message || 'Upload gagal.';
      throw new Error(message);
    }

    return data;
  }

  function formToObject(form) {
    const data = new FormData(form);
    const object = {};
    data.forEach((value, key) => {
      object[key] = value;
    });
    return object;
  }

  function showMessage(element, message, type = 'success') {
    if (!element) return;
    element.textContent = message;
    element.className = `message-box show ${type}`;
    clearTimeout(element._hideTimer);
    element._hideTimer = setTimeout(() => {
      element.className = 'message-box';
      element.textContent = '';
    }, 6500);
  }

  return { request, upload, formToObject, showMessage, getToken, setToken, removeToken, getUser, setUser };
})();
