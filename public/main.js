const form = document.getElementById('hire-form');
const result = document.getElementById('result');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  result.textContent = 'Submitting to UKG...';
  result.className = '';

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch('/api/hire', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.message || 'Unknown error');
    }

    result.className = 'success';
    result.innerHTML = `
      <h2>Hire Submitted Successfully</h2>
      <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>
    `;
    form.reset();
  } catch (error) {
    result.className = 'error';
    result.innerHTML = `
      <h2>Submission Failed</h2>
      <p>${escapeHtml(error.message)}</p>
    `;
  }
});

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
