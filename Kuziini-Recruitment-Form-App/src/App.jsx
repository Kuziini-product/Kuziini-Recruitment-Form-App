import { useMemo, useState } from 'react'

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

export default function App() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const completion = useMemo(() => {
    const visibleFields = [
      'fullName',
      'phone',
      'email',
      'city',
      'experienceYears',
      'corpusYears',
      'currentRole',
      'portfolio',
      'linkedin',
      'motivation',
      'expectedSalary',
      'availableFrom',
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
    if (!form.fullName.trim()) nextErrors.fullName = 'Completează numele complet.'
    if (!form.phone.trim()) nextErrors.phone = 'Completează telefonul.'
    if (!form.email.trim()) nextErrors.email = 'Completează emailul.'
    if (!form.experienceYears.trim()) nextErrors.experienceYears = 'Completează experiența totală.'
    if (!form.corpusYears.trim()) nextErrors.corpusYears = 'Completează experiența în Corpus Solution.'
    if (!form.motivation.trim()) nextErrors.motivation = 'Spune-ne pe scurt experiența ta relevantă.'
    if (!form.gdpr) nextErrors.gdpr = 'Este necesar acordul pentru prelucrarea datelor.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    // Pregătit pentru integrare ulterioară cu Supabase / Firebase / Formspree
    console.log('Application payload:', form)
    setSubmitted(true)
  }

  function resetForm() {
    setForm(initialForm)
    setErrors({})
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div className="page">
        <div className="container success-wrap">
          <section className="card success-card">
            <div className="success-icon">✓</div>
            <h1>Aplicare trimisă</h1>
            <p>
              Mulțumim! Candidatura pentru poziția de <strong>Proiectant Mobilier – Corpus Solution 3D</strong> a fost
              înregistrată.
            </p>

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
                <span>Experiență Corpus</span>
                <strong>{form.corpusYears} ani</strong>
              </div>
            </div>

            <button className="btn btn-primary" onClick={resetForm}>
              Trimite altă aplicare
            </button>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="container layout">
        <section className="card main-card">
          <div className="badges">
            <span className="badge badge-brand">Kuziini</span>
            <span className="badge">București</span>
            <span className="badge">Corpus Solution 3D</span>
          </div>

          <h1>Aplică pentru rolul de Proiectant Mobilier</h1>
          <p className="lead">
            Căutăm un profesionist cu experiență reală în proiectare mobilier și lucru în Corpus Solution 3D, cu atenție
            la execuție, materiale și logică de producție.
          </p>

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="two-cols">
              <Field label="Nume complet" required error={errors.fullName}>
                <input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Ex: Andrei Popescu" />
              </Field>
              <Field label="Telefon" required error={errors.phone}>
                <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="Ex: 07xx xxx xxx" />
              </Field>
            </div>

            <div className="two-cols">
              <Field label="Email" required error={errors.email}>
                <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="Ex: nume@email.com" />
              </Field>
              <Field label="Oraș">
                <input value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="Ex: București" />
              </Field>
            </div>

            <div className="two-cols">
              <Field label="Experiență totală în mobilier (ani)" required error={errors.experienceYears}>
                <input value={form.experienceYears} onChange={(e) => updateField('experienceYears', e.target.value)} placeholder="Ex: 4" />
              </Field>
              <Field label="Experiență în Corpus Solution (ani)" required error={errors.corpusYears}>
                <input value={form.corpusYears} onChange={(e) => updateField('corpusYears', e.target.value)} placeholder="Ex: 2" />
              </Field>
            </div>

            <div className="two-cols">
              <Field label="Rol actual">
                <input value={form.currentRole} onChange={(e) => updateField('currentRole', e.target.value)} placeholder="Ex: Proiectant mobilier senior" />
              </Field>
              <Field label="Disponibil din">
                <input value={form.availableFrom} onChange={(e) => updateField('availableFrom', e.target.value)} placeholder="Ex: imediat / 30 zile" />
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

            <div className="two-cols">
              <Field label="Salariu net dorit">
                <input value={form.expectedSalary} onChange={(e) => updateField('expectedSalary', e.target.value)} placeholder="Ex: 7000 RON" />
              </Field>
              <Field label="CV / Portofoliu atașat">
                <div className="upload-placeholder">Variantă demo UI – zona de upload se poate conecta la Supabase / Firebase Storage</div>
              </Field>
            </div>

            <Field label="Experiență relevantă / motivație" required error={errors.motivation}>
              <textarea
                rows="6"
                value={form.motivation}
                onChange={(e) => updateField('motivation', e.target.value)}
                placeholder="Spune-ne ce tipuri de proiecte ai făcut, cât de bine stăpânești Corpus Solution și partea de execuție."
              />
            </Field>

            <div className="checks">
              <label className="check-row">
                <input type="checkbox" checked={form.relocate} onChange={(e) => updateField('relocate', e.target.checked)} />
                <span>Sunt deschis(ă) la lucru on-site / hibrid în București.</span>
              </label>

              <label className="check-row">
                <input type="checkbox" checked={form.gdpr} onChange={(e) => updateField('gdpr', e.target.checked)} />
                <span>Sunt de acord cu prelucrarea datelor mele pentru procesul de recrutare Kuziini. *</span>
              </label>
              {errors.gdpr ? <div className="error">{errors.gdpr}</div> : null}
            </div>

            <div className="form-footer">
              <span>Completare formular: {completion}%</span>
              <button type="submit" className="btn btn-primary">Trimite aplicarea</button>
            </div>
          </form>
        </section>

        <aside className="side-column">
          <section className="card side-card">
            <h2>Rolul</h2>
            <ul>
              <li>Proiectare corpuri și ansambluri de mobilier premium</li>
              <li>Liste de materiale și accesorii pentru producție</li>
              <li>Optimizare tehnică pentru execuție corectă</li>
              <li>Colaborare directă cu designul și producția</li>
            </ul>
          </section>

          <section className="card side-card">
            <h2>Ce caută Kuziini</h2>
            <ul>
              <li>experiență reală în Corpus Solution</li>
              <li>cunoștințe de accesorii și logică de montaj</li>
              <li>atenție la detaliu și gândire de producție</li>
              <li>seriozitate, viteză și autonomie</li>
            </ul>
          </section>

          <section className="card side-card">
            <h2>Contact rapid</h2>
            <p><strong>Email:</strong> recrutare@kuziini.ro</p>
            <p><strong>Telefon:</strong> +40 7xx xxx xxx</p>
            <p><strong>Contact:</strong> Echipa Kuziini Recruitment</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
