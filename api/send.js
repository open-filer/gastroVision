import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Vercel parses req.body automatically. If it's a string, we parse it.
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const escapeHtml = (str) => {
      if (typeof str !== 'string') return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not defined.');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'kritagya.singh.dev@gmail.com',
      subject: `New GastroVision Lead: ${safeName}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${safeMessage}</p>
      `
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
