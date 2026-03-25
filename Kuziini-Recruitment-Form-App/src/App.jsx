import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MiniInterview from './MiniInterview'
import AdminDashboard from './AdminDashboard'
import AudioPlayer from './AudioPlayer'

const initialForm = {
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

// ── Scroll reveal hook ──
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useReveal()
  return (
    <div ref={ref} className={`reveal ${delay ? `reveal-delay-${delay}` : ''} ${className}`}>
      {children}
    </div>
  )
}

// ── Cursor glow effect ──
function CursorGlow() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(max-width: 768px)').matches) return
    let raf
    function onMove(e) {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.left = e.clientX + 'px'
        el.style.top = e.clientY + 'px'
        el.classList.add('active')
      })
    }
    function onLeave() { el.classList.remove('active') }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])
  return <div ref={ref} className="cursor-glow" />
}

function Field({ label, required, error, children }) {
  return (
    <div className="field">
      <label className="label">
        {label} {required && <span className="required">*</span>}
      </label>
      {children}
      {error ? <div className="error">{error}</div> : null}
    </div>
  )
}

const ADMIN_PASS = 'Kuziini1'

export default function App() {
  const [isAdmin, setIsAdmin] = useState(window.location.hash === '#admin')
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState('form')
  const [result, setResult] = useState(null)
  const startTimeRef = useRef(Date.now())

  function tryAdminAccess() {
    const pass = prompt('Parola admin:')
    if (pass === ADMIN_PASS) {
      setIsAdmin(true)
    }
  }

  useEffect(() => {
    function onHash() { setIsAdmin(window.location.hash === '#admin') }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (isAdmin) return <AdminDashboard onExit={() => setIsAdmin(false)} />

  const completion = useMemo(() => {
    const visibleFields = [
      'fullName', 'phone', 'email', 'city', 'experienceYears',
      'corpusYears', 'currentRole', 'portfolio', 'linkedin',
      'motivation', 'expectedSalary', 'availableFrom',
    ]
    const filled = visibleFields.filter((key) => String(form[key]).trim() !== '').length + (form.gdpr ? 1 : 0)
    return Math.round((filled / (visibleFields.length + 1)) * 100)
  }, [form])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  function validate() {
    const nextErrors = {}
    if (!form.fullName.trim()) nextErrors.fullName = 'Numele complet este obligatoriu.'
    if (!form.phone.trim()) nextErrors.phone = 'Telefonul este obligatoriu.'
    if (!form.email.trim()) nextErrors.email = 'Email-ul este obligatoriu.'
    if (!form.experienceYears.trim()) nextErrors.experienceYears = 'Experienta totala este obligatorie.'
    if (!form.corpusYears.trim()) nextErrors.corpusYears = 'Experienta in Corpus este obligatorie.'
    if (!form.motivation.trim()) nextErrors.motivation = 'Motivatia este obligatorie.'
    if (!form.gdpr) nextErrors.gdpr = 'Acordul GDPR este obligatoriu.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return
    setStep('interview')
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
    setStep('form')
    startTimeRef.current = Date.now()
  }

  // ── STEP: INTERVIEW ──
  if (step === 'interview') {
    return (
      <>
        <CursorGlow />
        <AudioPlayer />
        <MiniInterview
          formData={form}
          startTime={startTimeRef.current}
          onComplete={handleInterviewComplete}
          onBack={handleInterviewBack}
        />
      </>
    )
  }

  // ── STEP: SUCCESS ──
  if (step === 'success') {
    const classColor =
      result?.classification === 'A'
        ? '#c9a84c'
        : result?.classification === 'B'
        ? '#94a3b8'
        : result?.classification === 'C'
        ? '#78716c'
        : '#6b7280'

    return (
      <>
        <CursorGlow />
        <AudioPlayer />
        <div className="page">
          <div className="container success-wrap">
            <Reveal>
              <section className="card success-card">
                <div className="success-icon">&#10003;</div>
                <h1>Aplicare trimisa cu succes</h1>
                <p>
                  Multumim, <strong>{form.fullName}</strong>. Candidatura ta pentru pozitia de{' '}
                  <strong>Proiectant Mobilier &ndash; Corpus Solutions 3D</strong> a fost inregistrata.
                </p>

                <div className="classification-badge" style={{ background: classColor }}>
                  <span className="classification-letter">{result?.classification}</span>
                  <span className="classification-label">{result?.classificationLabel}</span>
                </div>

                <div className="score-display">
                  <div className="score-number">{result?.score}</div>
                  <div className="score-max">/ {result?.maxScore} puncte</div>
                </div>

                <div className="summary-grid">
                  <div className="summary-box">
                    <span>Nume</span>
                    <strong>{form.fullName}</strong>
                  </div>
                  <div className="summary-box">
                    <span>Email</span>
                    <strong>{form.email}</strong>
                  </div>
                  <div className="summary-box">
                    <span>Telefon</span>
                    <strong>{form.phone}</strong>
                  </div>
                  <div className="summary-box">
                    <span>Experienta Corpus</span>
                    <strong>{form.corpusYears} ani</strong>
                  </div>
                </div>

                <p className="success-note">
                  Un email cu datele tale a fost trimis echipei Kuziini. Vei fi contactat in cel mai scurt timp.
                </p>

                <button className="btn btn-primary" onClick={resetForm}>
                  Trimite alta aplicare
                </button>
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
      <AudioPlayer />
      <div className="page">
        <div className="container layout">
          <section className="card main-card">
            <Reveal>
              <div className="logo-wrap">
                <img src="/logo-kuziini.png" alt="Kuziini" className="logo-img" />
                <div className="logo-flash" />
              </div>
            </Reveal>

            <Reveal delay={1}>
              <h1>Aplica pentru rolul de Proiectant Mobilier</h1>
            </Reveal>

            <Reveal delay={2}>
              <p className="lead">
                Cautam un profesionist cu experienta reala in proiectare mobilier si lucru in Corpus Solutions 3D, cu atentie
                la executie, materiale si logica de productie.
              </p>
              <div className="gold-line" />
            </Reveal>

            <Reveal delay={3}>
              <form onSubmit={handleSubmit} className="form-grid">
                <div className="two-cols">
                  <Field label="Nume complet" required error={errors.fullName}>
                    <input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Andrei Popescu" />
                  </Field>
                  <Field label="Telefon" required error={errors.phone}>
                    <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="07xx xxx xxx" />
                  </Field>
                </div>

                <div className="two-cols">
                  <Field label="Email" required error={errors.email}>
                    <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="nume@email.com" />
                  </Field>
                  <Field label="Oras">
                    <input value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="Bucuresti" />
                  </Field>
                </div>

                <div className="two-cols">
                  <Field label="Experienta totala in mobilier (ani)" required error={errors.experienceYears}>
                    <input value={form.experienceYears} onChange={(e) => updateField('experienceYears', e.target.value)} placeholder="4" />
                  </Field>
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

                <Field label="Salariu net dorit">
                  <input value={form.expectedSalary} onChange={(e) => updateField('expectedSalary', e.target.value)} placeholder="4800 RON" />
                </Field>

                <Field label="Experienta relevanta / motivatie" required error={errors.motivation}>
                  <textarea
                    rows="6"
                    value={form.motivation}
                    onChange={(e) => updateField('motivation', e.target.value)}
                    placeholder="Spune-ne ce tipuri de proiecte ai facut, cat de bine stapanesti Corpus Solutions si partea de executie."
                  />
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
            <Reveal delay={2}>
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

            <Reveal delay={3}>
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

            <Reveal delay={4}>
              <section className="card side-card">
                <h2
                  onClick={tryAdminAccess}
                  style={{ cursor: 'pointer' }}
                  title="Kuziini Admin"
                >Contact</h2>
                <p><strong>Email:</strong> my@kuziini.com</p>
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
