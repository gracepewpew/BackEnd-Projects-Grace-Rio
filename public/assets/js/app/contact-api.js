document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('feedbackForm');
  const messageBox = document.getElementById('feedbackMessage');
  if (!form) return;

  document.querySelectorAll('.btn-category').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-category').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('categoryInput').value = btn.dataset.val;
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const payload = Api.formToObject(form);
      const result = await Api.request('/feedbacks', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      form.reset();
      document.querySelectorAll('.btn-category').forEach((b) => b.classList.remove('active'));
      document.querySelector('.btn-category[data-val="pertanyaan"]').classList.add('active');
      document.getElementById('categoryInput').value = 'pertanyaan';
      Api.showMessage(messageBox, result.message, 'success');
    } catch (error) {
      Api.showMessage(messageBox, error.message, 'error');
    }
  });
});
