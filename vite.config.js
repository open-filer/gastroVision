import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { Resend } from 'resend';
import { Client } from '@gradio/client';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env variables regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'api-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/send' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  const { name, email, message } = JSON.parse(body);
                  
                  if (!env.RESEND_API_KEY) {
                    throw new Error('RESEND_API_KEY is not defined in your .env file.');
                  }

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
                  
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(data));
                } catch (error) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: error.message }));
                }
              });
            } else if (req.url === '/api/predict' && req.method === 'POST') {
              let bodyChunks = [];
              req.on('data', chunk => {
                bodyChunks.push(chunk);
              });
              req.on('end', async () => {
                try {
                  const buffer = Buffer.concat(bodyChunks);
                  const blob = new Blob([buffer], { type: req.headers['content-type'] || 'image/jpeg' });

                  if (!env.HF_TOKEN) {
                    throw new Error('HF_TOKEN is not defined in your .env file.');
                  }

                  const client = await Client.connect("maxiu-uzumaki/gastroVision", {
                    token: env.HF_TOKEN
                  });

                  const prediction = await client.predict("/predict", {
                    image: blob,
                  });

                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(prediction));
                } catch (error) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: error.message }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ]
  };
});
