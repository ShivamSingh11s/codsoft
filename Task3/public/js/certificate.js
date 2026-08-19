// Certificate Generator & Print View Controller
const certificate = {
  currentAttemptId: null,

  async openModal(attemptId = null) {
    const targetAttemptId = attemptId || document.getElementById('btn-view-certificate')?.getAttribute('data-attempt-id');
    if (!targetAttemptId) {
      alert('Attempt ID required for certificate generation');
      return;
    }

    try {
      const data = await API.getCertificate(targetAttemptId);
      
      if (!data.eligible) {
        alert(data.message || 'Not eligible for certificate');
        return;
      }

      const cert = data.certificate;

      document.getElementById('cert-recipient-name').innerText = cert.recipientName;
      document.getElementById('cert-quiz-title').innerText = cert.quizTitle;
      document.getElementById('cert-score-val').innerText = `${cert.percentage}% (${cert.score}/${cert.totalMarks})`;
      document.getElementById('cert-date-val').innerText = new Date(cert.issuedDate).toLocaleDateString();
      document.getElementById('cert-id-val').innerText = cert.certificateNumber;

      document.getElementById('modal-certificate').classList.add('show');
    } catch (error) {
      alert(error.message || 'Error generating certificate');
    }
  },

  closeModal() {
    document.getElementById('modal-certificate').classList.remove('show');
  },

  print() {
    const printContent = document.getElementById('certificate-print-area').outerHTML;
    const originalBody = document.body.innerHTML;

    const win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>Certificate of Achievement</title>');
    win.document.write('<link rel="stylesheet" href="css/style.css">');
    win.document.write('</head><body style="background:#0F172A; display:flex; align-items:center; justify-content:center; min-height:100vh;">');
    win.document.write(printContent);
    win.document.write('</body></html>');
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  },
};
