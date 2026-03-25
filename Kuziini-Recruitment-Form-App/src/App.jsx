import { useEffect, useMemo, useRef, useState } from 'react'
import MiniInterview from './MiniInterview'
import AdminDashboard from './AdminDashboard'

// ── Extract YouTube video ID from URL or plain ID ──
function extractYtId(input) {
  if (!input) return null
  // Already a plain ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input
  // URL formats
  const m = input.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : input
}

// ── Music genres (reads localStorage for custom YouTube links) ──
function getGenres() {
  return [
    { id: 'classical', label: 'Clasica', icon: '🎻', ytId: extractYtId(localStorage.getItem('kuziini_music_classical')) || 'hN_q-_nGv4U', start: parseInt(localStorage.getItem('kuziini_start_classical')) || 48 },
    { id: 'lofi', label: 'Lo-Fi', icon: '🎧', ytId: extractYtId(localStorage.getItem('kuziini_music_lofi')) || '1cEy4UyYHI0', start: parseInt(localStorage.getItem('kuziini_start_lofi')) || 0 },
    { id: 'jazz', label: 'Jazz', icon: '🎷', ytId: extractYtId(localStorage.getItem('kuziini_music_jazz')) || 'Dx5qFachd3A', start: parseInt(localStorage.getItem('kuziini_start_jazz')) || 0 },
  ]
}

const initialForm = {
  musicGenre: '',
  gender: '',
  age: '',
  fullName: '',
  phone: '',
  email: '',
  city: '',
  experienceYears: '',
  corpusYears: '',
  currentRole: '',
  portfolio: '',
  linkedin: '',
  motivation: '',
  expectedSalary: '',
  availableFrom: '',
  relocate: false,
  gdpr: false,
}

// ── YouTube Music Player (hidden) ──
function MusicPlayer({ genre }) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    if (!genre) return
    const g = getGenres().find((gg) => gg.id === genre)
    if (!g) return

    function create() {
      if (playerRef.current) { try { playerRef.current.destroy() } catch {} }
      playerRef.current = new window.YT.Player(containerRef.current, {
        width: 320, height: 180,
        videoId: g.ytId,
        playerVars: { autoplay: 1, controls: 0, loop: 1, playlist: g.ytId, start: g.start || 0 },
        events: {
          onReady: (e) => {
            e.target.setVolume(0)
            e.target.playVideo()
            let vol = 0
            const fade = setInterval(() => {
              vol += 1
              if (vol >= 40) { clearInterval(fade); vol = 40 }
              try { e.target.setVolume(vol) } catch {}
            }, 60)
          },
        },
      })
    }

    if (window.YT && window.YT.Player) { create() }
    else {
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); create() }
    }

    // Listen for first interaction to unblock autoplay
    function onInteract() {
      try { playerRef.current?.playVideo() } catch {}
      document.removeEventListener('click', onInteract)
      document.removeEventListener('touchstart', onInteract)
    }
    document.addEventListener('click', onInteract, { once: true })
    document.addEventListener('touchstart', onInteract, { once: true })

    return () => {
      try { playerRef.current?.destroy() } catch {}
      playerRef.current = null
    }
  }, [genre])

  if (!genre) return null
  return (
    <div style={{ position: 'fixed', left: -9999, top: -9999, width: 320, height: 180, opacity: 0.01, pointerEvents: 'none', zIndex: -1 }}>
      <div ref={containerRef} />
    </div>
  )
}

// ── Cursor glow ──
function CursorGlow() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(max-width: 768px)').matches) return
    let raf
    function onMove(e) {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => { el.style.left = e.clientX + 'px'; el.style.top = e.clientY + 'px'; el.classList.add('active') })
    }
    function onLeave() { el.classList.remove('active') }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseleave', onLeave); cancelAnimationFrame(raf) }
  }, [])
  return <div ref={ref} className="cursor-glow" />
}

function Reveal({ children, className = '', delay = 0 }) {
  return <div className={`reveal ${className}`}>{children}</div>
}

function Field({ label, required, error, children }) {
  return (
    <div className="field">
      <label className="label">{label} {required && <span className="required">*</span>}</label>
      {children}
      {error ? <div className="error">{error}</div> : null}
    </div>
  )
}

const ADMIN_PASS = 'Kuziini1'

function AdminLogin({ onSuccess, onCancel }) {
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])
  function handleSubmit(e) {
    e.preventDefault()
    if (pass === ADMIN_PASS) onSuccess()
    else { setError(true); setPass('') }
  }
  return (
    <div className="admin-login-overlay">
      <form className="admin-login-box" onSubmit={handleSubmit}>
        <h2>Kuziini Admin</h2>
        <p>Introduceti parola pentru acces.</p>
        <input ref={inputRef} type="password" value={pass} onChange={(e) => { setPass(e.target.value); setError(false) }} placeholder="Parola" className={error ? 'admin-login-error' : ''} />
        {error && <span className="admin-login-err-text">Parola incorecta</span>}
        <div className="admin-login-btns">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Anuleaza</button>
          <button type="submit" className="btn btn-primary">Acces</button>
        </div>
      </form>
    </div>
  )
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState('welcome') // welcome | form | cvPrompt | interview | success
  const [result, setResult] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [cvFile, setCvFile] = useState(null)
  const photoInputRef = useRef(null)
  const cvInputRef = useRef(null)
  const startTimeRef = useRef(Date.now())

  const completion = useMemo(() => {
    const fields = ['fullName', 'phone', 'email', 'city', 'experienceYears', 'corpusYears', 'currentRole', 'portfolio', 'linkedin', 'motivation', 'expectedSalary', 'availableFrom']
    const filled = fields.filter((k) => String(form[k]).trim() !== '').length + (form.gdpr ? 1 : 0) + (form.gender ? 1 : 0) + (form.musicGenre ? 1 : 0)
    return Math.round((filled / (fields.length + 3)) * 100)
  }, [form])

  useEffect(() => {
    if (window.location.hash === '#admin') setShowLogin(true)
    function onHash() { if (window.location.hash === '#admin') setShowLogin(true) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (isAdmin) return <AdminDashboard onExit={() => setIsAdmin(false)} />

  const loginModal = showLogin && (
    <AdminLogin onSuccess={() => { setShowLogin(false); setIsAdmin(true) }} onCancel={() => setShowLogin(false)} />
  )

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Numele complet este obligatoriu.'
    if (!form.age.trim()) e.age = 'Varsta este obligatorie.'
    if (!form.phone.trim()) e.phone = 'Telefonul este obligatoriu.'
    if (!form.email.trim()) e.email = 'Email-ul este obligatoriu.'
    if (!form.gender) e.gender = 'Selecteaza genul.'
    if (!form.experienceYears.trim()) e.experienceYears = 'Experienta totala este obligatorie.'
    if (!form.corpusYears.trim()) e.corpusYears = 'Experienta in Corpus este obligatorie.'
    if (!form.motivation.trim()) e.motivation = 'Motivatia este obligatorie.'
    if (!form.gdpr) e.gdpr = 'Acordul GDPR este obligatoriu.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return
    // If no CV attached, show CV prompt
    if (!cvFile && !form.portfolio.trim()) {
      setStep('cvPrompt')
    } else {
      setStep('interview')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleInterviewComplete(interviewResult) {
    setResult(interviewResult)
    setStep('success')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleInterviewBack() {
    setStep('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setForm(initialForm)
    setErrors({})
    setResult(null)
    setPhotoFile(null)
    setCvFile(null)
    setStep('welcome')
    startTimeRef.current = Date.now()
  }

  // ── STEP: WELCOME (landing page) ──
  if (step === 'welcome') {
    return (
      <>
        <CursorGlow />
        <MusicPlayer genre={form.musicGenre} />
        {loginModal}
        <div className="welcome-page">
          <div className="welcome-content">
            <div className="logo-wrap">
              <img src="/logo-kuziini.png" alt="Kuziini" className="logo-img" />
              <div className="logo-flash" />
            </div>
            <h1 className="welcome-title">Aplica pentru rolul de Proiectant Mobilier</h1>
            <div className="gold-line" style={{ margin: '24px auto 40px' }} />

            <p className="welcome-sub">Alege atmosfera potrivita</p>
            <div className="genre-selector genre-selector-welcome">
              {getGenres().map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`genre-btn ${form.musicGenre === g.id ? 'genre-active' : ''}`}
                  onClick={() => updateField('musicGenre', g.id)}
                >
                  <span className="genre-icon">{g.icon}</span>
                  <span className="genre-label">{g.label}</span>
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary welcome-start-btn"
              onClick={() => { setStep('form'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            >
              Incepe aplicarea
            </button>

            <div className="welcome-scroll-hint">
              <span>&#8595;</span>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── STEP: CV PROMPT ──
  if (step === 'cvPrompt') {
    return (
      <>
        <CursorGlow />
        <MusicPlayer genre={form.musicGenre} />
        <div className="page">
          <div className="container success-wrap">
            <section className="card interview-card">
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>📄</div>
                <h1 style={{ fontSize: '1.8rem', marginBottom: 12 }}>Ai uitat CV-ul!</h1>
                <p className="interview-subtitle" style={{ maxWidth: 500, margin: '0 auto 28px' }}>
                  Candidatii care ataseaza un CV au cu <strong style={{ color: 'var(--gold)', fontSize: '1.3em' }}>90%</strong> sanse
                  mai mari sa fie selectati pentru interviu. Incarca-l acum!
                </p>
                <div className="upload-zone" style={{ maxWidth: 400, margin: '0 auto' }}>
                  <input ref={cvInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                    onChange={(e) => setCvFile(e.target.files[0] || null)} />
                  <div className="upload-area" onClick={() => cvInputRef.current?.click()}>
                    {cvFile ? (
                      <div className="upload-selected">
                        <span className="upload-file-icon">&#128196;</span>
                        <span>{cvFile.name}</span>
                      </div>
                    ) : (
                      <div className="upload-prompt">
                        <span className="upload-cloud-icon">&#128228;</span>
                        <p>Click pentru a incarca CV-ul</p>
                        <span className="upload-hint">PDF, DOC — max 10 MB</span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 28 }}>
                  <button className="btn btn-secondary" onClick={() => { setStep('interview'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                    Continua fara CV
                  </button>
                  <button className="btn btn-primary" onClick={() => { setStep('interview'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                    {cvFile ? 'Continua cu CV' : 'Continua'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </>
    )
  }

  // ── STEP: INTERVIEW ──
  if (step === 'interview') {
    return (
      <>
        <CursorGlow />
        <MusicPlayer genre={form.musicGenre} />
        <MiniInterview
          formData={{ ...form, hasCv: !!cvFile, hasPhoto: !!photoFile }}
          cvFile={cvFile}
          startTime={startTimeRef.current}
          onComplete={handleInterviewComplete}
          onBack={handleInterviewBack}
        />
      </>
    )
  }

  // ── STEP: SUCCESS ──
  if (step === 'success') {
    const classColor = result?.classification === 'A' ? '#c9a84c' : result?.classification === 'B' ? '#94a3b8' : result?.classification === 'C' ? '#78716c' : '#6b7280'
    return (
      <>
        <CursorGlow />
        <MusicPlayer genre={form.musicGenre} />
        <div className="page">
          <div className="container success-wrap">
            <Reveal>
              <section className="card success-card">
                <div className="success-icon">&#10003;</div>
                <h1>Aplicare trimisa cu succes</h1>
                <p>Multumim, <strong>{form.fullName}</strong>. Candidatura ta a fost inregistrata.</p>
                <div className="classification-badge" style={{ background: classColor }}>
                  <span className="classification-letter">{result?.classification}</span>
                  <span className="classification-label">{result?.classificationLabel}</span>
                </div>
                <div className="score-display">
                  <div className="score-number">{result?.score}</div>
                  <div className="score-max">/ {result?.maxScore} puncte</div>
                </div>
                <div className="summary-grid">
                  <div className="summary-box"><span>Nume</span><strong>{form.fullName}</strong></div>
                  <div className="summary-box"><span>Email</span><strong>{form.email}</strong></div>
                  <div className="summary-box"><span>Telefon</span><strong>{form.phone}</strong></div>
                  <div className="summary-box"><span>Experienta Corpus</span><strong>{form.corpusYears} ani</strong></div>
                </div>
                <p className="success-note">Un email cu datele tale a fost trimis echipei Kuziini.</p>
                <button className="btn btn-primary" onClick={resetForm}>Trimite alta aplicare</button>
              </section>
            </Reveal>
          </div>
        </div>
      </>
    )
  }

  // ── STEP: FORM ──
  return (
    <>
      <CursorGlow />
      <MusicPlayer genre={form.musicGenre} />
      {loginModal}
      <div className="page">
        <div className="container layout">
          <section className="card main-card">
            <Reveal>
              <p className="lead" style={{ marginTop: 0 }}>
                Cautam un profesionist cu experienta reala in proiectare mobilier si lucru in Corpus Solutions 3D.
              </p>
            </Reveal>

            <Reveal>
              <form onSubmit={handleSubmit} className="form-grid">

                {/* ── Gender + Photo ── */}
                <div className="two-cols">
                  <Field label="Gen" required error={errors.gender}>
                    <div className="gender-selector">
                      {[{ v: 'masculin', l: 'Masculin', i: '♂' }, { v: 'feminin', l: 'Feminin', i: '♀' }, { v: 'altul', l: 'Altul', i: '⚧' }].map((g) => (
                        <button key={g.v} type="button"
                          className={`gender-btn ${form.gender === g.v ? 'gender-active' : ''}`}
                          onClick={() => updateField('gender', g.v)}
                        >
                          <span>{g.i}</span> {g.l}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Foto (optional)">
                    <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={(e) => setPhotoFile(e.target.files[0] || null)} />
                    <div className="photo-upload" onClick={() => photoInputRef.current?.click()}>
                      {photoFile ? (
                        <div className="photo-preview">
                          <img src={URL.createObjectURL(photoFile)} alt="Preview" />
                          <span>{photoFile.name}</span>
                        </div>
                      ) : (
                        <span className="photo-placeholder">📷 Adauga o foto</span>
                      )}
                    </div>
                  </Field>
                </div>

                <div className="two-cols">
                  <Field label="Nume complet" required error={errors.fullName}>
                    <input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Andrei Popescu" />
                  </Field>
                  <Field label="Varsta" required error={errors.age}>
                    <input type="number" min="18" max="65" value={form.age} onChange={(e) => updateField('age', e.target.value)} placeholder="28" />
                  </Field>
                </div>

                <div className="two-cols">
                  <Field label="Telefon" required error={errors.phone}>
                    <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="07xx xxx xxx" />
                  </Field>
                  <Field label="Email" required error={errors.email}>
                    <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="nume@email.com" />
                  </Field>
                </div>

                <div className="two-cols">
                  <Field label="Oras">
                    <input value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="Bucuresti" />
                  </Field>
                  <Field label="Experienta totala in mobilier (ani)" required error={errors.experienceYears}>
                    <input value={form.experienceYears} onChange={(e) => updateField('experienceYears', e.target.value)} placeholder="4" />
                  </Field>
                </div>

                <div className="two-cols">
                  <Field label="Experienta in Corpus Solutions (ani)" required error={errors.corpusYears}>
                    <input value={form.corpusYears} onChange={(e) => updateField('corpusYears', e.target.value)} placeholder="2" />
                  </Field>
                </div>

                <div className="two-cols">
                  <Field label="Rol actual">
                    <input value={form.currentRole} onChange={(e) => updateField('currentRole', e.target.value)} placeholder="Proiectant mobilier senior" />
                  </Field>
                  <Field label="Disponibil din">
                    <input value={form.availableFrom} onChange={(e) => updateField('availableFrom', e.target.value)} placeholder="Imediat / 30 zile" />
                  </Field>
                </div>

                <div className="two-cols">
                  <Field label="Portofoliu / CV link">
                    <input value={form.portfolio} onChange={(e) => updateField('portfolio', e.target.value)} placeholder="Link Drive / PDF / website" />
                  </Field>
                  <Field label="LinkedIn">
                    <input value={form.linkedin} onChange={(e) => updateField('linkedin', e.target.value)} placeholder="Link profil LinkedIn" />
                  </Field>
                </div>

                {/* ── CV Upload ── */}
                <Field label="CV / Portofoliu atasat">
                  <input ref={cvInputRef} type="file" accept=".pdf,.doc,.docx,.zip" style={{ display: 'none' }}
                    onChange={(e) => setCvFile(e.target.files[0] || null)} />
                  <div className="upload-area" onClick={() => cvInputRef.current?.click()} style={{ padding: '14px 16px', minHeight: 52 }}>
                    {cvFile ? (
                      <div className="upload-selected">
                        <span className="upload-file-icon">&#128196;</span>
                        <span>{cvFile.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--ash)', fontSize: '0.85rem' }}>Click pentru a incarca CV (PDF, DOC)</span>
                    )}
                  </div>
                </Field>

                <Field label="Salariu net dorit">
                  <input value={form.expectedSalary} onChange={(e) => updateField('expectedSalary', e.target.value)} placeholder="4800 RON" />
                </Field>

                <Field label="Experienta relevanta / motivatie" required error={errors.motivation}>
                  <textarea rows="6" value={form.motivation} onChange={(e) => updateField('motivation', e.target.value)}
                    placeholder="Spune-ne ce tipuri de proiecte ai facut, cat de bine stapanesti Corpus Solutions si partea de executie." />
                </Field>

                <div className="checks">
                  <label className="check-row">
                    <input type="checkbox" checked={form.relocate} onChange={(e) => updateField('relocate', e.target.checked)} />
                    <span>Sunt deschis(a) la lucru on-site / hibrid in Bucuresti.</span>
                  </label>
                  <label className="check-row">
                    <input type="checkbox" checked={form.gdpr} onChange={(e) => updateField('gdpr', e.target.checked)} />
                    <span>Sunt de acord cu prelucrarea datelor mele pentru procesul de recrutare Kuziini. *</span>
                  </label>
                  {errors.gdpr ? <div className="error">{errors.gdpr}</div> : null}
                </div>

                <div className="form-footer">
                  <span>Completare: {completion}%</span>
                  <button type="submit" className="btn btn-primary">Confirma si continua</button>
                </div>
              </form>
            </Reveal>
          </section>

          <aside className="side-column">
            <Reveal>
              <section className="card side-card">
                <h2>Rolul</h2>
                <ul>
                  <li>Proiectare corpuri si ansambluri de mobilier premium</li>
                  <li>Liste de materiale si accesorii pentru productie</li>
                  <li>Optimizare tehnica pentru executie corecta</li>
                  <li>Colaborare directa cu designul si productia</li>
                </ul>
              </section>
            </Reveal>

            <Reveal>
              <section className="card side-card">
                <h2>Ce cauta Kuziini</h2>
                <ul>
                  <li>Experienta reala in Corpus Solutions</li>
                  <li>Cunostinte de accesorii si logica de montaj</li>
                  <li>Atentie la detaliu si gandire de productie</li>
                  <li>Seriozitate, viteza si autonomie</li>
                </ul>
              </section>
            </Reveal>

            <Reveal>
              <a href="https://www.kuziini.ro/tur360/?startscene=0&startlookat=284.26,-2.18,119.19,0,0;"
                target="_blank" rel="noreferrer" className="experience-btn-card">
                <div className="experience-bg" />
                <div className="experience-overlay" />
                <div className="experience-card-content">
                  <span className="experience-card-icon">&#127760;</span>
                  <strong className="experience-card-title">Intra in universul Kuziini</strong>
                  <span className="experience-card-sub">Tur virtual 360° prin showroom</span>
                  <span className="experience-card-arrow">&#8599;</span>
                </div>
              </a>
            </Reveal>

            <Reveal>
              <section className="card side-card">
                <h2 onClick={() => setShowLogin(true)} style={{ cursor: 'pointer' }} title="Kuziini Admin">Contact</h2>
                <p><strong>Email:</strong> my@kuziini.ro</p>
                <p><strong>Telefon:</strong> 0723 333 221</p>
                <p><strong>Echipa:</strong> Kuziini Recruitment</p>
              </section>
            </Reveal>
          </aside>
        </div>
      </div>
    </>
  )
}
