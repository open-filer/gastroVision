import { useEffect, useRef, useState } from 'react'
import { Client } from '@gradio/client'
import polypImg from './polyp.jpg'

const Icon = ({ name, size = 20, stroke = 1.8 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const paths = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    upload: <><path d="M12 16V3"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14a2 2 0 0 0 2-2v-3"/><path d="M5 16v3a2 2 0 0 0 2 2"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    close: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    menu: <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>,
    play: <path d="m9 5 10 7-10 7V5Z" fill="currentColor" stroke="none"/>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></>,
    linkedin: <><path d="M7 10v7"/><path d="M7 7v.01"/><path d="M11 17v-4a3 3 0 0 1 6 0v4"/><path d="M11 10v7"/><rect x="3" y="3" width="18" height="18" rx="2"/></>,
    x: <path d="M5 5l14 14M19 5 5 19"/>,
  }
  return <svg {...common}>{paths[name]}</svg>
}

const classifications = [
  { name: 'Cancer', value: 94.8, color: '#ad4a3e' }, { name: 'GERD', value: 2.7, color: '#d4a843' },
  { name: 'GERD Normal', value: 0.9, color: '#8e9987' }, { name: 'Polyp', value: 0.8, color: '#6c7b91' },
  { name: 'Polyp Normal', value: 0.5, color: '#ac8a75' }, { name: 'Spot', value: 0.3, color: '#908a82' },
]

const getColor = (name) => {
  const map = {
    'Cancer': '#ad4a3e',
    'GERD': '#d4a843',
    'GERD Normal': '#8e9987',
    'Polyp': '#6c7b91',
    'Polyp Normal': '#ac8a75',
    'Spot': '#908a82'
  }
  return map[name] || '#908a82';
}

const parsePredictions = (data) => {
  if (!data || !data[0]) return [];
  const first = data[0];
  // Case 1: Gradio Label component output style: { label: "...", confidences: [{label: "...", confidence: 0.9}, ...] }
  if (first.confidences && Array.isArray(first.confidences)) {
    return first.confidences.map(c => ({
      name: c.label,
      value: parseFloat((c.confidence * 100).toFixed(1))
    }));
  }
  // Case 2: Dict style output: { label1: 0.95, label2: 0.05, ... }
  if (typeof first === 'object') {
    return Object.entries(first)
      .map(([name, val]) => ({
        name,
        value: parseFloat((val * 100).toFixed(1))
      }))
      .sort((a, b) => b.value - a.value);
  }
  return [];
};


const faqs = [
  ['What can GastroVision identify?', 'GastroVision classifies endoscopic images across six findings: cancer, GERD, GERD normal, polyp, polyp normal, and spot. It is designed to assist qualified clinicians, not replace clinical judgment.'],
  ['How long does an analysis take?', 'Most image analyses are returned in seconds. Processing time depends on image quality, connection speed, and the volume of images submitted.'],
  ['Is patient information protected?', 'We design for privacy-first workflows. Production deployments should use encrypted transfer, access controls, and retention policies aligned with your institution’s requirements.'],
  ['Can it integrate with our workflow?', 'Yes. GastroVision is designed for API-based integration with clinical and research workflows. Get in touch to discuss your environment.'],
]

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')), { threshold: 0.12 })
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

function App() {
  const [loaded, setLoaded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [result, setResult] = useState(false)
  const [dynamicResults, setDynamicResults] = useState([])
  const [activeFaq, setActiveFaq] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [dragActive, setDragActive] = useState(false)
  const timer = useRef()
  const dragCounter = useRef(0)
  useReveal()

  useEffect(() => { const id = setTimeout(() => setLoaded(true), 900); return () => clearTimeout(id) }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  const goTo = (id) => { document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false) }
  const acceptFile = (picked) => {
    if (!picked || !picked.type.startsWith('image/')) return
    setFile({ name: picked.name, src: URL.createObjectURL(picked), raw: picked })
    setResult(false)
    setProcessing(false)
    setDynamicResults([])
    setErrors({})
  }
  const chooseFile = (event) => acceptFile(event.target.files?.[0])
  const handleDragEnter = (e) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items?.length > 0) setDragActive(true)
  }
  const handleDragLeave = (e) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current <= 0) { dragCounter.current = 0; setDragActive(false) }
  }
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation() }
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(false); dragCounter.current = 0
    acceptFile(e.dataTransfer.files?.[0])
  }
  const analyze = async () => {
    if (!file || !file.raw) return;
    setProcessing(true);
    setStatusMessage('Connecting to AI model...');
    setResult(false);
    setErrors({});
    try {
      const hfToken = import.meta.env.VITE_HF_TOKEN || import.meta.env.HF_TOKEN;
      const client = await Client.connect("maxiu-uzumaki/gastroVision", {
        ...(hfToken ? { token: hfToken } : {}),
        status_callback: (status) => {
          if (status.stage === 'building') setStatusMessage('Building Space environment...');
          else if (status.stage === 'running') setStatusMessage('Model ready. Sending image...');
          else if (status.stage === 'sleeping') setStatusMessage('Waking up the AI model (ZeroGPU)...');
          else if (status.stage === 'stopped') setStatusMessage('Starting Space instance...');
          else if (status.stage === 'error') setStatusMessage('Space encountered an error. Retrying...');
          else if (status.message) setStatusMessage(status.message);
        }
      });
      setStatusMessage('Uploading image and running inference...');
      const prediction = await client.predict("/predict", {
        image: file.raw,
      });
      const parsed = parsePredictions(prediction.data);
      if (parsed.length > 0) {
        setDynamicResults(parsed);
        setResult(true);
      } else {
        throw new Error("Could not parse prediction results.");
      }
    } catch (err) {
      console.error(err);
      const msg = err.message || '';
      let friendly = msg;
      if (msg.includes('metadata') || msg.includes('Repository not found') || msg.includes('404')) {
        friendly = 'The AI Space could not be reached. It may be asleep or still starting up — please try again in a few seconds.';
      } else if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('Not authorized')) {
        friendly = 'Access denied. Please ensure your Hugging Face token has access to this private Space.';
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
        friendly = 'Network error. Please check your connection and try again.';
      }
      setErrors({ api: friendly });
    } finally {
      setProcessing(false);
      setStatusMessage('');
    }
  }
  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Please add your name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.'
    if (!form.message.trim()) next.message = 'Tell us a little about your use case.'
    setErrors(next)
    if (!Object.keys(next).length) {
      setSendingEmail(true)
      try {
        const res = await fetch('/api/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(form)
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to send message.')
        }
        setSubmitted(true)
        setForm({ name: '', email: '', message: '' })
      } catch (err) {
        setErrors({ submit: err.message || 'Something went wrong. Please try again.' })
      } finally {
        setSendingEmail(false)
      }
    }
  }

  return <>
    {!loaded && <div className="preloader"><div className="loader-mark"><span></span><span></span><span></span></div><p>GastroVision</p></div>}
    <header className="nav-wrap">
      <nav className="nav" aria-label="Main navigation">
        <button className="brand" onClick={() => goTo('#top')} aria-label="GastroVision home"><span className="brand-mark">G</span><span>GastroVision</span></button>
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <button onClick={() => goTo('#platform')}>Platform</button><button onClick={() => goTo('#how-it-works')}>How it works</button><button onClick={() => goTo('#faq')}>FAQ</button>
          <button className="nav-contact" onClick={() => goTo('#contact')}>Talk to us <Icon name="arrow" size={16}/></button>
        </div>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <Icon name="close"/> : <Icon name="menu"/>}</button>
      </nav>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-orb orb-one"></div><div className="hero-orb orb-two"></div><div className="particles" aria-hidden="true">{Array.from({ length: 22 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</div>
        <div className="section-shell hero-inner">
          <div className="hero-copy reveal"><p className="eyebrow"><span></span>AI-assisted endoscopic insight</p><h1>See more.<br/><em>Sooner.</em></h1><p className="hero-text">Deep learning that helps turn endoscopic images into confident, actionable observations.</p><div className="hero-actions"><button className="button primary" onClick={() => goTo('#analyze')}>Try image analysis <Icon name="arrow" size={18}/></button><button className="text-button" onClick={() => goTo('#how-it-works')}><span className="play"><Icon name="play" size={12}/></span> See how it works</button></div></div>
          <div className="hero-visual reveal">
            <div className="scan-card"><div className="scan-top"><span>LIVE ANALYSIS</span><span className="live-dot"></span></div><div className="endoscopy-image"><img src={polypImg} alt="Illustrative endoscopic image"/><div className="scan-line"></div><div className="detection-box"><span>94.8%</span></div></div><div className="scan-bottom"><div><small>PRIMARY FINDING</small><strong>Possible lesion</strong></div><div className="confidence-ring"><span>95</span></div></div></div>
            <div className="floating-card finding-card"><span className="mini-dot"></span><div><small>FINDING</small><strong>High confidence</strong></div></div><div className="floating-card secure-card"><Icon name="check" size={15}/><span>Encrypted & private</span></div>
          </div>
        </div>
        <div className="hero-foot"><p>Built for better visibility</p><div className="hero-scroll"><span></span> Scroll to explore</div><p>01 — 05</p></div>
      </section>

      <section className="intro section-shell reveal" id="platform"><div className="intro-top"><p className="eyebrow"><span></span>Clarity at every frame</p><h2>Intelligence that<br/>keeps the focus <em>human.</em></h2><p>GastroVision adds a second set of trained eyes to your image review workflow—fast, precise, and uncomplicated.</p></div>
        <div className="bento-grid">
          <article className="bento feature-large"><div className="bento-head"><span className="number">01</span><span className="tag">MULTI-CLASS MODEL</span></div><h3>Six distinct findings.<br/>One clear view.</h3><div className="class-list">{classifications.slice(0, 4).map((item) => <div key={item.name}><span style={{ background: item.color }}></span>{item.name}<b>{item.value}%</b></div>)}</div></article>
          <article className="bento image-card"><img src="https://picsum.photos/seed/gastro-lab/900/1100" alt="Clinician reviewing diagnostic imagery"/><div className="image-card-copy"><span className="tag">MADE FOR CLINICIANS</span><h3>Insight, without interruption.</h3></div></article>
          <article className="bento accuracy-card"><div className="accuracy-circle"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42"/><circle className="gold-stroke" cx="50" cy="50" r="42"/></svg><div><strong>94.8</strong><small>%</small></div></div><p>Top confidence score<br/>from a sample scan</p></article>
          <article className="bento privacy-card"><div className="privacy-icon"><Icon name="check" size={28}/></div><span className="tag">PRIVACY BY DESIGN</span><h3>Secure from upload to result.</h3><p>Built with responsible image handling in mind.</p></article>
        </div>
      </section>

      <section className="analyze-section" id="analyze"><div className="section-shell reveal"><div className="section-heading"><p className="eyebrow"><span></span>Experience GastroVision</p><h2>Bring an image.<br/><em>Find the signal.</em></h2><p>Upload an endoscopic image to preview a GastroVision analysis. This demonstration uses simulated results.</p></div><div className="analyzer">
        <div className="upload-pane" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>{file ? <div className="preview-wrap"><img src={file.src} alt="Selected endoscopic image"/><button className="remove-file" onClick={() => { setFile(null); setResult(false) }} aria-label="Remove image"><Icon name="close" size={16}/></button></div> : <label className={`drop-zone${dragActive ? ' drag-active' : ''}`}><input type="file" accept="image/*" onChange={chooseFile}/>{dragActive ? <><span className="drop-zone-overlay"><span className="drop-icon-ring"><Icon name="upload" size={30}/></span><strong>Release to upload</strong></span></> : <><span className="upload-icon"><Icon name="upload" size={26}/></span><strong>Drop an endoscopic image here</strong><small>JPG, PNG or WEBP up to 10MB</small><span className="browse">Browse files</span></>}</label>}<button className="button primary analyze-button" disabled={!file || processing} onClick={analyze}>{processing ? <><i className="button-spinner"></i> Analyzing image</> : <>Analyze image <Icon name="arrow" size={18}/></>}</button></div>
        <div className="results-pane">{!result && !processing && !errors.api && <div className="empty-state"><div className="empty-art"><span></span><span></span><span></span></div><strong>Analysis will appear here</strong><p>Upload an image and start your scan to see predicted findings and confidence scores.</p></div>}{!result && !processing && errors.api && <div className="empty-state"><strong style={{ color: '#ad4a3e' }}>Analysis Failed</strong><p>{errors.api}</p><button className="button primary" style={{marginTop:'1rem',fontSize:'0.85rem',padding:'0.5rem 1.2rem'}} onClick={analyze}>Retry <Icon name="arrow" size={15}/></button></div>}{processing && <div className="processing-state"><div className="processing-radar"></div><p>Reading visual patterns</p><small>{statusMessage || 'Applying multi-class classification model'}</small></div>}{result && dynamicResults.length > 0 && <div className="result-state"><div className="result-title"><div><small>TOP FINDING</small><h3>{dynamicResults[0].name} <span>{dynamicResults[0].value}%</span></h3></div><span className="result-badge"><Icon name="check" size={15}/> Complete</span></div><div className="result-bars">{dynamicResults.map((item, i) => <div className="result-row" key={item.name}><div><span className="row-dot" style={{ background: getColor(item.name) }}></span><span>{item.name}</span><b>{item.value}%</b></div><div className="bar-track"><i style={{ width: `${item.value}%`, background: getColor(item.name), animationDelay: `${i * 90}ms` }}></i></div></div>)}</div><p className="result-note">For research and decision support only. Always validate results with a qualified clinician.</p></div>}</div>
      </div></div></section>

      <section className="workflow section-shell" id="how-it-works"><div className="workflow-copy reveal"><p className="eyebrow"><span></span>Simple by design</p><h2>From frame to<br/><em>finding.</em></h2></div><div className="steps reveal">{[['01','Upload','Select a clear endoscopic image from your device.'],['02','Analyze','Our model evaluates visual features in moments.'],['03','Review','See every predicted class and confidence score.']].map(([num,title,copy]) => <article className="step" key={num}><span>{num}</span><div><h3>{title}</h3><p>{copy}</p></div><Icon name="arrow" size={20}/></article>)}</div></section>

      <section className="quote-section"><div className="quote-inner reveal"><p className="quote-mark">“</p><blockquote>A more attentive eye for the moments that matter most.</blockquote><div className="quote-rule"></div><p>DESIGNED FOR EARLIER, MORE CONFIDENT OBSERVATION</p></div></section>

      <section className="faq section-shell" id="faq"><div className="faq-heading reveal"><p className="eyebrow"><span></span>Questions, answered</p><h2>Good to<br/><em>know.</em></h2><p>Need something more specific? <button onClick={() => goTo('#contact')}>Talk to our team <Icon name="arrow" size={15}/></button></p></div><div className="accordion reveal">{faqs.map(([question, answer], i) => <article className={activeFaq === i ? 'faq-item active' : 'faq-item'} key={question}><button onClick={() => setActiveFaq(activeFaq === i ? -1 : i)} aria-expanded={activeFaq === i}><span>{question}</span><i><Icon name="plus" size={18}/></i></button><div className="faq-answer"><p>{answer}</p></div></article>)}</div></section>

      <section className="contact section-shell" id="contact"><div className="contact-panel reveal"><div className="contact-copy"><p className="eyebrow"><span></span>Start a conversation</p><h2>Better insight<br/>starts <em>here.</em></h2><p>Tell us how you’re exploring AI-assisted endoscopy. We’ll be in touch shortly.</p></div><form onSubmit={submit} noValidate>{submitted && <div className="form-success"><Icon name="check" size={17}/> Thanks—we’ll be in touch soon.</div>}{errors.submit && <div className="form-error"><Icon name="x" size={17}/> {errors.submit}</div>}<label>Your name<input value={form.name} disabled={sendingEmail} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Alex Morgan" />{errors.name && <small>{errors.name}</small>}</label><label>Work email<input type="email" value={form.email} disabled={sendingEmail} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="alex@clinic.com" />{errors.email && <small>{errors.email}</small>}</label><label>How can we help?<textarea value={form.message} disabled={sendingEmail} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your workflow..." rows="3" />{errors.message && <small>{errors.message}</small>}</label><button className="button primary" type="submit" disabled={sendingEmail}>{sendingEmail ? 'Sending...' : <>Send message <Icon name="arrow" size={18}/></>}</button></form></div></section>
    </main>
    <button className="sticky-cta" onClick={() => goTo('#analyze')}><span>Try GastroVision</span><Icon name="arrow" size={17}/></button>
    <footer className="footer section-shell"><button className="brand" onClick={() => goTo('#top')}><span className="brand-mark">G</span><span>GastroVision</span></button><p>© 2026 GastroVision. Built for clearer decisions.</p><div className="socials"><a href="https://www.linkedin.com/in/kritagya-s-8b4362300/" aria-label="LinkedIn"><Icon name="linkedin" size={18}/></a></div></footer>
  </>
}

export default App
