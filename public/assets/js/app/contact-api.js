document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('feedbackForm');
  const messageBox = document.getElementById('feedbackMessage');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const payload = Api.formToObject(form);
      const result = await Api.request('/feedbacks', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      form.reset();
      Api.showMessage(messageBox, result.message, 'success');
    } catch (error) {
      Api.showMessage(messageBox, error.message, 'error');
    }
  });
});
