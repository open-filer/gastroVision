import { Resend } from 'resend';

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    
    // Parse JSON request body
    const { name, email, message } = await request.json();

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

    if (!env.RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not defined in Cloudflare dashboard.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const resend = new Resend(env.RESEND_API_KEY);

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

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
