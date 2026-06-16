document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const messageBox = document.getElementById('authMessage');

  document.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.querySelector(button.dataset.togglePassword);
      if (!target) return;
      const isHidden = target.type === 'password';
      target.type = isHidden ? 'text' : 'password';
      button.innerHTML = isHidden ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
    });
  });

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        const payload = Api.formToObject(loginForm);
        const result = await Api.request('/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        Api.setToken(result.token);
        Api.setUser(result.user);
        Api.showMessage(messageBox, 'Login berhasil. Mengarahkan ke dashboard...', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 700);
      } catch (error) {
        Api.showMessage(messageBox, error.message, 'error');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        const payload = Api.formToObject(registerForm);
        if (payload.password !== payload.confirmPassword) {
          Api.showMessage(messageBox, 'Password dan Re-enter Password tidak sama.', 'error');
          return;
        }
        const result = await Api.request('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        Api.setToken(result.token);
        Api.setUser(result.user);
        Api.showMessage(messageBox, 'Register berhasil. Mengarahkan ke dashboard...', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 700);
      } catch (error) {
        Api.showMessage(messageBox, error.message, 'error');
      }
    });
  }
});
