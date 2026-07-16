<div align="center">

# 🩺 GastroVision
### *AI-Assisted Endoscopic Insight*

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62B)](https://vitejs.dev/)
[![Resend](https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=resend&logoColor=white)](https://resend.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>A premium, modern clinical assistant that adds an explainable, deep learning-based diagnostic support layer to gastrointestinal image review workflows.</b>
</p>

---

<img src="polyp.jpg" alt="GastroVision Interface Preview" width="800" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); margin: 20px 0;">

</div>

---

## 🌟 Key Features

*   **⚡ Multi-Class Classification**  
    Automatically detects and classifies findings across six key clinical categories: **Cancer, GERD, GERD Normal, Polyp, Polyp Normal, and Spot**.

*   **🌀 Interactive Scanning Radar**  
    Implements a responsive, simulated scan view driven by an animated CSS conic-gradient radar sweep that activates during active requests.

*   **🤗 Direct Hugging Face Inference**  
    Direct API connection using the official `@gradio/client` SDK to query the `maxiu-uzumaki/gastroVision` AI Space on the fly.

*   **🛡️ Secure Serverless Contact Engine**  
    Handles doctor and lead inquiries using secure serverless edge functions proxying the **Resend API**, preventing CORS issues and keeping credentials private.

*   **✨ Premium Tailored UX/UI**  
    Crafted with a warm-toned neutral color scheme, smooth custom-styled scrollbars, fully responsive bento grid features, and micro-interactions.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Core** | `React 18+` | Single Page Application framework |
| **Build Engine** | `Vite` | Instant HMR and lightning-fast production bundling |
| **Styling** | `Vanilla CSS3` | Responsive bento structures, HSL custom properties, and keyframe animations |
| **Machine Learning** | `@gradio/client` | Client interface for remote Hugging Face neural net inference |
| **Email Proxy** | `Resend SDK` | Transactional email engine routed through edge functions |

---

## ☁️ Live Production Deployment

The application is built, optimized, and served globally on the edge:

<div align="center">

👉 **[https://gastrovision.pages.dev](https://gastrovision.pages.dev)** 👈

</div>

---

## ⚖️ License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
