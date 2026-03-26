import { useEffect, useMemo, useRef, useState } from 'react'
import MiniInterview from './MiniInterview'
import AdminDashboard from './AdminDashboard'
import { LangToggle, useT, useLang } from './i18n'

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

// ── YouTube Music Player (persistent, never unmounts) ──
function MusicPlayer({ genre }) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const currentGenreRef = useRef(null)
  const apiReadyRef = useRef(false)

  // Load YouTube API once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      apiReadyRef.current = true
      return
    }
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev()
      apiReadyRef.current = true
    }
  }, [])

  // Play/switch genre
  useEffect(() => {
    if (!genre || genre === currentGenreRef.current) return
    currentGenreRef.current = genre

    function tryCreate() {
      if (!apiReadyRef.current || !window.YT?.Player) {
        setTimeout(tryCreate, 500)
        return
      }
      const g = getGenres().find((gg) => gg.id === genre)
      if (!g) return

      // Destroy previous player
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
        playerRef.current = null
      }

      // Need a fresh div because YT.Player replaces the element
      if (containerRef.current) {
        containerRef.current.innerHTML = '<div id="yt-music"></div>'
      }

      playerRef.current = new window.YT.Player('yt-music', {
        width: 320, height: 180,
        videoId: g.ytId,
        playerVars: { autoplay: 1, controls: 0, loop: 1, playlist: g.ytId, start: g.start || 0, origin: window.location.origin },
        events: {
          onReady: (e) => {
            e.target.setVolume(0)
            e.target.seekTo(g.start || 0, true)
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

    tryCreate()
  }, [genre])

  // Listen for first user interaction to unblock autoplay
  useEffect(() => {
    function onInteract() {
      try { playerRef.current?.playVideo() } catch {}
    }
    document.addEventListener('click', onInteract, { once: true })
    document.addEventListener('touchstart', onInteract, { once: true })
    return () => {
      document.removeEventListener('click', onInteract)
      document.removeEventListener('touchstart', onInteract)
    }
  }, [])

  return (
    <div style={{ position: 'fixed', left: -9999, top: -9999, width: 320, height: 180, opacity: 0.01, pointerEvents: 'none', zIndex: -1 }}>
      <div ref={containerRef}><div id="yt-music" /></div>
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
  const t = useT()
  const { lang } = useLang()
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('kuziini_admin') === 'true')
  const [showLogin, setShowLogin] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  // PWA install
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    function onBeforeInstall(e) {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', () => setInstalled(true))
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }

  function loginAdmin() {
    localStorage.setItem('kuziini_admin', 'true')
    setIsAdmin(true)
    setShowLogin(false)
  }

  function logoutAdmin() {
    localStorage.removeItem('kuziini_admin')
    setIsAdmin(false)
  }
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState('welcome') // welcome | form | cvPrompt | interview | success
  const [result, setResult] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [cvFile, setCvFile] = useState(null)
  const [tourVisited, setTourVisited] = useState(false)
  const [tourTimeSeconds, setTourTimeSeconds] = useState(0)
  const tourStartRef = useRef(null)
  const photoInputRef = useRef(null)
  const cvInputRef = useRef(null)
  const startTimeRef = useRef(Date.now())

  // Track when user returns from tour
  useEffect(() => {
    function onFocus() {
      if (tourStartRef.current) {
        const elapsed = Math.round((Date.now() - tourStartRef.current) / 1000)
        setTourTimeSeconds(prev => prev + elapsed)
        tourStartRef.current = null
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  function openTour() {
    setTourVisited(true)
    tourStartRef.current = Date.now()
    window.open('https://www.kuziini.ro/tur360/?startscene=0&startlookat=284.26,-2.18,119.19,0,0;', '_blank')
  }

  const completion = useMemo(() => {
    const fields = ['fullName', 'phone', 'email', 'city', 'experienceYears', 'corpusYears', 'currentRole', 'portfolio', 'linkedin', 'motivation', 'expectedSalary', 'availableFrom']
    const filled = fields.filter((k) => String(form[k]).trim() !== '').length + (form.gdpr ? 1 : 0) + (form.gender ? 1 : 0) + (form.musicGenre ? 1 : 0)
    return Math.round((filled / (fields.length + 3)) * 100)
  }, [form])

  // Save partial when user leaves during interview (browser back, close tab, refresh)
  useEffect(() => {
    function saveOnLeave() {
      if ((step === 'interview' || step === 'cvPrompt') && form.email) {
        navigator.sendBeacon('/api/partial', new Blob([JSON.stringify({ formData: form })], { type: 'application/json' }))
      }
    }

    // Intercept browser back button
    if (step === 'interview' || step === 'cvPrompt' || step === 'form') {
      window.history.pushState(null, '', window.location.href)
      function onPopState() {
        if (step === 'interview') {
          saveOnLeave()
          setStep('form')
          window.history.pushState(null, '', window.location.href)
        } else if (step === 'cvPrompt') {
          setStep('form')
          window.history.pushState(null, '', window.location.href)
        } else if (step === 'form') {
          setStep('welcome')
          window.history.pushState(null, '', window.location.href)
        }
      }
      window.addEventListener('popstate', onPopState)
      window.addEventListener('beforeunload', saveOnLeave)
      return () => {
        window.removeEventListener('popstate', onPopState)
        window.removeEventListener('beforeunload', saveOnLeave)
      }
    }
  }, [step, form])

  useEffect(() => {
    if (window.location.hash === '#admin') setShowLogin(true)
    function onHash() { if (window.location.hash === '#admin') setShowLogin(true) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Music player rendered always (never unmounts)
  const musicPlayer = <MusicPlayer genre={form.musicGenre} />

  if (isAdmin) return <AdminDashboard onExit={logoutAdmin} onHome={() => setIsAdmin(false)} />

  const loginModal = showLogin && (
    <AdminLogin onSuccess={loginAdmin} onCancel={() => setShowLogin(false)} />
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
    else if (!/^(\+?4?0?|0)[7][0-9]{8}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Numarul de telefon nu este valid. Ex: 07xx xxx xxx'
    if (!form.email.trim()) e.email = 'Email-ul este obligatoriu.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Adresa de email nu este valida.'
    if (!form.gender) e.gender = 'Selecteaza genul.'
    if (!form.city.trim()) e.city = 'Orasul este obligatoriu.'
    if (!form.experienceYears.trim()) e.experienceYears = 'Experienta totala este obligatorie.'
    if (!form.corpusYears.trim()) e.corpusYears = 'Experienta in Corpus este obligatorie.'
    if (!form.currentRole.trim()) e.currentRole = 'Rolul actual este obligatoriu.'
    if (!form.availableFrom.trim()) e.availableFrom = 'Disponibilitatea este obligatorie.'
    if (!form.expectedSalary.trim()) e.expectedSalary = 'Salariul dorit este obligatoriu.'
    if (!form.motivation.trim()) e.motivation = 'Motivatia este obligatorie.'
    if (!form.gdpr) e.gdpr = 'Acordul GDPR este obligatoriu.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const isAdminSession = localStorage.getItem('kuziini_admin') === 'true'

  function handleSubmit(event) {
    event.preventDefault()
    // Admin can skip validation
    if (!isAdminSession && !validate()) {
      setTimeout(() => {
        const firstErr = document.querySelector('.error')
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      return
    }
    // If no CV attached, show CV prompt (skip for admin)
    if (!isAdminSession && !cvFile && !form.portfolio.trim()) {
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
        {musicPlayer}
        {loginModal}
        <LangToggle />
        <div className="welcome-page">
          <div className="welcome-content">
            {/* Top half — logo only, large and centered */}
            <div className="logo-wrap">
              <img src="/logo-kuziini.png" alt="Kuziini" className="logo-img" />
              <div className="logo-flash" />
            </div>

            {/* Bottom half — title, music, CTA */}
            <div className="welcome-bottom">
              <h1 className="welcome-title">{t('welcomeTitle')}</h1>
              <div className="gold-line" style={{ margin: '20px auto 28px' }} />

              <p className="welcome-sub">{t('welcomeSub')}</p>
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
                {t('welcomeStart')}
              </button>

              {installPrompt && !installed && (
                <button className="install-btn" onClick={handleInstall}>
                  &#128229; {t('installBtn')}
                </button>
              )}

              <div className="welcome-scroll-hint">
                <span>&#8595;</span>
              </div>
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
        {musicPlayer}
        <LangToggle />
        <div className="page">
          <button className="page-back-btn" onClick={() => { setStep('form'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} title="Inapoi">&#8592;</button>
          {isAdminSession && (
            <button className="page-next-btn" onClick={() => { setStep('interview'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} title="Sari la interviu (admin)">&#8594;</button>
          )}
          <div className="container success-wrap">
            <section className="card interview-card">
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>📄</div>
                <h1 style={{ fontSize: '1.8rem', marginBottom: 12 }}>{t('cvForgot')}</h1>
                <p className="interview-subtitle" style={{ maxWidth: 500, margin: '0 auto 28px' }}>
                  {lang === 'ro' ? 'Candidatii care ataseaza un CV au cu' : 'Candidates who attach a CV have a'} <strong style={{ color: 'var(--gold)', fontSize: '1.3em' }}>90%</strong> {t('cvBoost')}
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
                    {t('cvContinueWithout')}
                  </button>
                  <button className="btn btn-primary" onClick={() => { setStep('interview'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                    {cvFile ? t('cvContinueWith') : t('cvContinue')}
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
        {musicPlayer}
        <LangToggle />
        <MiniInterview
          formData={{ ...form, hasCv: !!cvFile, hasPhoto: !!photoFile, tourVisited, tourTimeSeconds }}
          cvFile={cvFile}
          startTime={startTimeRef.current}
          onComplete={handleInterviewComplete}
          onBack={handleInterviewBack}
          lang={lang}
          isAdmin={isAdminSession}
        />
      </>
    )
  }

  // ── STEP: SUCCESS ──
  if (step === 'success') {
    return (
      <>
        <CursorGlow />
        {musicPlayer}
        <LangToggle />
        <div className="page">
          <button className="page-back-btn" onClick={resetForm} title="Inapoi">&#8592;</button>
          <div className="container success-wrap">
            <Reveal>
              <section className="card success-card">
                <div className="success-icon">&#10003;</div>
                <h1 className="success-thanks">{t('thankYou')}</h1>
                <h2 className="success-name">{form.fullName}</h2>
                <div className="gold-line" style={{ margin: '20px auto 28px' }} />
                <p className="success-message">
                  {lang === 'ro' ? 'Echipa' : 'The'} <strong>Kuziini</strong> {t('thankYouMsg1')}
                </p>
                <p className="success-message" style={{ marginTop: 16 }}>
                  {t('thankYouMsg2')}
                </p>
                <div className="success-signature">
                  <div className="logo-wrap" style={{ width: '120px', margin: '24px auto 16px' }}>
                    <img src="/logo-kuziini.png" alt="Kuziini" className="logo-img" />
                  </div>
                  <span>Echipa Kuziini Recruitment</span>
                </div>
                <button className="btn btn-primary" onClick={resetForm} style={{ marginTop: 28 }}>{t('backToHome')}</button>
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
      <LangToggle />
      <div className="page">
        <button className="page-back-btn" onClick={() => { setStep('welcome'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} title="Inapoi">&#8592;</button>
        {isAdminSession && (
          <button className="page-next-btn" onClick={() => { setStep('interview'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} title="Sari la interviu (admin)">&#8594;</button>
        )}
        <div className="container layout">
          <section className="card main-card">
            <Reveal>
              <p className="lead" style={{ marginTop: 0 }}>
                {t('formLead')}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 8px' }}>
                <img src="/corpus-logo.png" alt="Corpus Solutions 3D" style={{ maxWidth: '180px', height: 'auto', opacity: 0.85 }} />
              </div>
            </Reveal>

            <Reveal>
              <form onSubmit={handleSubmit} className="form-grid">

                {/* ── Gender + Photo ── */}
                <div className="two-cols">
                  <Field label={t('labelGender')} required error={errors.gender}>
                    <div className="gender-selector">
                      {[{ v: 'masculin', l: t('genderM'), i: '♂' }, { v: 'feminin', l: t('genderF'), i: '♀' }, { v: 'altul', l: t('genderO'), i: '⚧' }].map((g) => (
                        <button key={g.v} type="button"
                          className={`gender-btn ${form.gender === g.v ? 'gender-active' : ''}`}
                          onClick={() => updateField('gender', g.v)}
                        >
                          <span>{g.i}</span> {g.l}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label={t('labelPhoto')}>
                    <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={(e) => setPhotoFile(e.target.files[0] || null)} />
                    <div className="photo-upload" onClick={() => photoInputRef.current?.click()}>
                      {photoFile ? (
                        <div className="photo-preview">
                          <img src={URL.createObjectURL(photoFile)} alt="Preview" />
                          <span>{photoFile.name}</span>
                        </div>
                      ) : (
                        <span className="photo-placeholder">{lang === 'ro' ? '📷 Adauga o foto' : '📷 Add a photo'}</span>
                      )}
                    </div>
                  </Field>
                </div>

                <div className="two-cols">
                  <Field label={t('labelName')} required error={errors.fullName}>
                    <input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Andrei Popescu" />
                  </Field>
                  <Field label={t('labelAge')} required error={errors.age}>
                    <input type="number" min="18" max="65" value={form.age} onChange={(e) => updateField('age', e.target.value)} placeholder="28" />
                  </Field>
                </div>

                <div className="two-cols">
                  <Field label={t('labelPhone')} required error={errors.phone}>
                    <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="07xx xxx xxx" />
                  </Field>
                  <Field label={t('labelEmail')} required error={errors.email}>
                    <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="name@email.com" />
                  </Field>
                </div>

                <div className="two-cols">
                  <Field label={t('labelCity')} required error={errors.city}>
                    <input value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="Bucuresti" />
                  </Field>
                  <Field label={t('labelExperience')} required error={errors.experienceYears}>
                    <input value={form.experienceYears} onChange={(e) => updateField('experienceYears', e.target.value)} placeholder="4" />
                  </Field>
                </div>

                <div className="two-cols">
                  <Field label={t('labelCorpusYears')} required error={errors.corpusYears}>
                    <input value={form.corpusYears} onChange={(e) => updateField('corpusYears', e.target.value)} placeholder="2" />
                  </Field>
                </div>

                <div className="two-cols">
                  <Field label={t('labelCurrentRole')} required error={errors.currentRole}>
                    <input value={form.currentRole} onChange={(e) => updateField('currentRole', e.target.value)} placeholder={lang === 'ro' ? 'Proiectant mobilier senior' : 'Senior furniture designer'} />
                  </Field>
                  <Field label={t('labelAvailable')} required error={errors.availableFrom}>
                    <input value={form.availableFrom} onChange={(e) => updateField('availableFrom', e.target.value)} placeholder={lang === 'ro' ? 'Imediat / 30 zile' : 'Immediately / 30 days'} />
                  </Field>
                </div>

                <div className="two-cols">
                  <Field label={t('labelPortfolio')}>
                    <input value={form.portfolio} onChange={(e) => updateField('portfolio', e.target.value)} placeholder="Link Drive / PDF / website" />
                  </Field>
                  <Field label={t('labelLinkedin')}>
                    <input value={form.linkedin} onChange={(e) => updateField('linkedin', e.target.value)} placeholder="LinkedIn profile link" />
                  </Field>
                </div>

                {/* ── CV Upload ── */}
                <Field label={t('labelCv')}>
                  <input ref={cvInputRef} type="file" accept=".pdf,.doc,.docx,.zip" style={{ display: 'none' }}
                    onChange={(e) => setCvFile(e.target.files[0] || null)} />
                  <div className="upload-area" onClick={() => cvInputRef.current?.click()} style={{ padding: '14px 16px', minHeight: 52 }}>
                    {cvFile ? (
                      <div className="upload-selected">
                        <span className="upload-file-icon">&#128196;</span>
                        <span>{cvFile.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--ash)', fontSize: '0.85rem' }}>{lang === 'ro' ? 'Click pentru a incarca CV (PDF, DOC)' : 'Click to upload CV (PDF, DOC)'}</span>
                    )}
                  </div>
                </Field>

                <Field label={t('labelSalary')} required error={errors.expectedSalary}>
                  <input value={form.expectedSalary} onChange={(e) => updateField('expectedSalary', e.target.value)} placeholder="0" />
                </Field>

                <Field label={t('labelMotivation')} required error={errors.motivation}>
                  <textarea rows="6" value={form.motivation} onChange={(e) => updateField('motivation', e.target.value)}
                    placeholder={lang === 'ro' ? 'Spune-ne ce tipuri de proiecte ai facut, cat de bine stapanesti Corpus Solutions si partea de executie.' : 'Tell us about the types of projects you have done, how well you know Corpus Solutions and the production side.'} />
                </Field>

                <div className="checks">
                  <label className="check-row">
                    <input type="checkbox" checked={form.relocate} onChange={(e) => updateField('relocate', e.target.checked)} />
                    <span>{t('labelRelocate')}</span>
                  </label>
                  <label className="check-row">
                    <input type="checkbox" checked={form.gdpr} onChange={(e) => updateField('gdpr', e.target.checked)} />
                    <span>{t('labelGdpr')} *</span>
                  </label>
                  {errors.gdpr ? <div className="error">{errors.gdpr}</div> : null}
                </div>

                <div className="form-footer">
                  <span>{lang === 'ro' ? 'Completare' : 'Completion'}: {completion}%</span>
                  <button type="submit" className="btn btn-primary">{t('btnConfirm')}</button>
                </div>
              </form>
            </Reveal>
          </section>

          <aside className="side-column">
            <Reveal>
              <section className="card side-card">
                <h2>{lang === 'ro' ? 'Rolul' : 'The Role'}</h2>
                <ul>
                  <li>{lang === 'ro' ? 'Proiectare corpuri si ansambluri de mobilier premium' : 'Design of premium furniture bodies and assemblies'}</li>
                  <li>{lang === 'ro' ? 'Liste de materiale si accesorii pentru productie' : 'Material and accessory lists for production'}</li>
                  <li>{lang === 'ro' ? 'Optimizare tehnica pentru executie corecta' : 'Technical optimization for correct execution'}</li>
                  <li>{lang === 'ro' ? 'Colaborare directa cu designul si productia' : 'Direct collaboration with design and production'}</li>
                </ul>
              </section>
            </Reveal>

            <Reveal>
              <section className="card side-card">
                <h2>{lang === 'ro' ? 'Ce cauta Kuziini' : 'What Kuziini looks for'}</h2>
                <ul>
                  <li>{lang === 'ro' ? 'Experienta reala in Corpus Solutions' : 'Real experience in Corpus Solutions'}</li>
                  <li>{lang === 'ro' ? 'Cunostinte de accesorii si logica de montaj' : 'Knowledge of accessories and assembly logic'}</li>
                  <li>{lang === 'ro' ? 'Atentie la detaliu si gandire de productie' : 'Attention to detail and production thinking'}</li>
                  <li>{lang === 'ro' ? 'Seriozitate, viteza si autonomie' : 'Reliability, speed and autonomy'}</li>
                </ul>
              </section>
            </Reveal>

            <Reveal>
              <div className="experience-btn-card" onClick={openTour} role="button" tabIndex={0}>
                <div className="experience-bg" />
                <div className="experience-overlay" />
                <div className="experience-card-content">
                  <div className="experience-spinning-logo">
                    <img src="/logo-kuziini.png" alt="" />
                  </div>
                  <strong className="experience-card-title">{t('sidebarExperience')}</strong>
                  {tourVisited && (
                    <span className="tour-visited-badge">
                      {lang === 'ro' ? 'Vizitat' : 'Visited'} {tourTimeSeconds > 0 ? `(${Math.floor(tourTimeSeconds/60)}m ${tourTimeSeconds%60}s)` : ''}
                    </span>
                  )}
                  <span className="experience-card-finger">
                    <span className="finger-hand">&#128072;</span>
                    <span className="finger-sparkle">&#10024;</span>
                  </span>
                </div>
              </div>
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
