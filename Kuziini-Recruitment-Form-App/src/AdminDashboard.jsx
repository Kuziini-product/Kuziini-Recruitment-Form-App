import { useEffect, useState } from 'react'

const API = ''

function classColor(c) {
  if (c === 'A') return '#16a34a'
  if (c === 'B') return '#ca8a04'
  if (c === 'C') return '#ea580c'
  return '#dc2626'
}

function classLabel(c) {
  if (c === 'A') return 'Excelent'
  if (c === 'B') return 'Bun'
  if (c === 'C') return 'Mediu'
  return 'Slab'
}

// ── AI Profile Generator ──
function generateProfile(a) {
  const answers = a.interview_answers || []
  const hobby = answers.find(ans => ans.type === 'hobby')
  const hearts = answers.filter(ans => ans.type === 'hearts')
  const techAnswers = answers.filter(ans => !ans.type || ans.type === 'choice')
  const pct = a.score_pct || 0

  const profile = { personality: [], professional: [], risks: [], score: 0 }

  // ── Personalitate din muzica ──
  if (a.music_genre === 'classical') {
    profile.personality.push('Perfectionista, ordonat, apreciaza estetica si structura')
    profile.score += 2
  } else if (a.music_genre === 'lofi') {
    profile.personality.push('Creativ, relaxat sub presiune, gandire fluida')
    profile.score += 2
  } else if (a.music_genre === 'jazz') {
    profile.personality.push('Spontan, adaptabil, deschis la improvizatie')
    profile.score += 2
  } else {
    profile.personality.push('Nu a selectat gen muzical — posibil grabit sau dezinteresat de detalii')
    profile.risks.push('Nivel scazut de engagement cu procesul')
  }

  // ── Personalitate din hobby ──
  if (hobby) {
    const h = hobby.selectedAnswer?.toLowerCase() || ''
    if (h.includes('sport')) { profile.personality.push('Disciplinat, competitiv, rezistent la stres'); profile.score += 2 }
    else if (h.includes('studiu')) { profile.personality.push('Curios intelectual, dedicat auto-perfectionarii'); profile.score += 3 }
    else if (h.includes('calatorit')) { profile.personality.push('Deschis la noi perspective, adaptabil cultural'); profile.score += 2 }
    else if (h.includes('filme')) { profile.personality.push('Atent la detalii vizuale, gandire narativa'); profile.score += 1 }
    else if (h.includes('nu am')) { profile.risks.push('Fara hobby declarat — posibil concentrat exclusiv pe munca (risc burnout)'); profile.score -= 1 }
    else if (h.includes('personalizat')) { profile.personality.push('Independent, creativ, nu se conformeaza tiparelor'); profile.score += 2 }
  }

  // ── Inimioare (brand affinity) ──
  const avgHearts = hearts.length > 0 ? hearts.reduce((s, h) => s + h.points, 0) / hearts.length : 0
  if (avgHearts >= 4) { profile.personality.push('Afinitate puternica cu brandul Kuziini — motivatie intrinseca'); profile.score += 3 }
  else if (avgHearts >= 2.5) { profile.personality.push('Interes moderat pentru brand — motivatie mai degraba financiara'); profile.score += 1 }
  else if (hearts.length > 0) { profile.risks.push('Afinitate scazuta cu brandul — posibil aplica din nevoie, nu din dorinta') }

  // ── Profil profesional din raspunsuri tehnice ──
  const techScore = techAnswers.reduce((s, a) => s + (a.points || 0), 0)
  const techMax = techAnswers.reduce((s, a) => s + (a.maxPoints || 5), 0)
  const techPct = techMax > 0 ? (techScore / techMax) * 100 : 0

  if (techPct >= 80) { profile.professional.push('Nivel tehnic avansat — poate lucra autonom pe proiecte complexe'); profile.score += 3 }
  else if (techPct >= 60) { profile.professional.push('Nivel tehnic bun — necesita supervizare minima'); profile.score += 2 }
  else if (techPct >= 40) { profile.professional.push('Nivel tehnic mediu — va necesita training si mentorat'); profile.score += 1 }
  else { profile.professional.push('Nivel tehnic insuficient — nu corespunde cerintelor rolului'); profile.score -= 2 }

  // ── Consistenta raspunsurilor ──
  const points = techAnswers.map(a => a.points)
  const allSame = points.length > 2 && points.every(p => p === points[0])
  const allMax = points.length > 2 && points.every(p => p >= 4)
  if (allSame && points[0] < 3) {
    profile.risks.push('ATENTIE: Toate raspunsurile au acelasi punctaj scazut — posibil selectate la intamplare')
    profile.score -= 3
  }
  if (allMax) {
    profile.professional.push('Raspunsuri constant la nivel maxim — fie expert autentic, fie raspunsuri exagerate')
  }

  // ── Timp completare ──
  const time = a.completion_time_seconds || 0
  if (time < 60) {
    profile.risks.push('Formular completat in sub 1 minut — raspunsuri probabil superficiale')
    profile.score -= 2
  } else if (time < 180) {
    profile.professional.push('Completare rapida dar acceptabila — persoana decisiva')
  } else if (time > 600) {
    profile.professional.push('A petrecut mult timp — atent la detalii sau indecis')
    profile.score += 1
  }

  // ── CV si motivatie ──
  if (a.has_cv) { profile.professional.push('A atasat CV — candidatura serioasa'); profile.score += 2 }
  else { profile.risks.push('Fara CV atasat — seriozitate redusa') }

  const motivation = a.motivation || ''
  if (motivation.length > 200) { profile.professional.push('Motivatie detaliata (' + motivation.length + ' caractere) — candidat implicat'); profile.score += 2 }
  else if (motivation.length > 50) { profile.professional.push('Motivatie adecvata') }
  else { profile.risks.push('Motivatie foarte scurta — efort minim depus') }

  // ── Nota finala ──
  const maxProfileScore = 20
  profile.finalScore = Math.max(0, Math.min(10, Math.round((profile.score / maxProfileScore) * 10)))

  return profile
}

function ProfileCard({ applicant }) {
  const p = generateProfile(applicant)
  const scoreColor = p.finalScore >= 7 ? '#16a34a' : p.finalScore >= 4 ? '#ca8a04' : '#dc2626'

  return (
    <div className="ai-profile">
      <div className="ai-profile-header">
        <h3>Profil AI — Analiza Psihologica &amp; Profesionala</h3>
        <div className="ai-score" style={{ background: scoreColor }}>
          {p.finalScore}/10
        </div>
      </div>

      {p.personality.length > 0 && (
        <div className="ai-section">
          <h4>🧠 Profil Psihologic</h4>
          <ul>{p.personality.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}

      {p.professional.length > 0 && (
        <div className="ai-section">
          <h4>💼 Profil Profesional</h4>
          <ul>{p.professional.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}

      {p.risks.length > 0 && (
        <div className="ai-section ai-risks">
          <h4>⚠️ Semnale de atentie</h4>
          <ul>{p.risks.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}

      <div className="ai-tags">
        {applicant.music_genre && <span className="ai-tag">🎵 {applicant.music_genre}</span>}
        {applicant.gender && <span className="ai-tag">👤 {applicant.gender}</span>}
        {applicant.has_cv && <span className="ai-tag ai-tag-good">📄 CV atasat</span>}
        {applicant.has_photo && <span className="ai-tag ai-tag-good">📷 Foto</span>}
        {applicant.tour_visited && <span className="ai-tag ai-tag-good">🏠 Tur 360° ({applicant.tour_time_seconds > 0 ? `${Math.floor(applicant.tour_time_seconds/60)}m ${applicant.tour_time_seconds%60}s` : 'vizitat'})</span>}
        {applicant.attempt_number > 1 && <span className="ai-tag ai-tag-warn">🔄 Re-aplicare #{applicant.attempt_number}</span>}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value" style={color ? { color } : {}}>
        {value}
      </div>
      {sub && <div className="admin-stat-sub">{sub}</div>}
    </div>
  )
}

export default function AdminDashboard({ onExit, onHome }) {
  useEffect(() => {
    document.body.classList.add('admin-active')
    return () => document.body.classList.remove('admin-active')
  }, [])

  const [stats, setStats] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [best, setBest] = useState(null)
  const [top5, setTop5] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [expandedData, setExpandedData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [lastCount, setLastCount] = useState(0)
  const [newAlert, setNewAlert] = useState(false)

  // Register service worker + check notification permission
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    setPushEnabled(Notification.permission === 'granted')
  }, [])

  // Poll for new applicants every 30s
  useEffect(() => {
    if (!stats) return
    setLastCount(stats.total)

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/stats')
        const newStats = await res.json()
        if (newStats.total > lastCount) {
          setNewAlert(true)
          setLastCount(newStats.total)
          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification('Kuziini Recruitment', {
              body: `Aplicare noua! Total: ${newStats.total} aplicanti.`,
              icon: '/logo-kuziini.png',
            })
          }
          // Auto-refresh data
          loadData()
          setTimeout(() => setNewAlert(false), 5000)
        }
      } catch {}
    }, 30000)

    return () => clearInterval(interval)
  }, [stats, lastCount])

  async function enableNotifications() {
    if (!('Notification' in window)) return alert('Browser-ul nu suporta notificari.')
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      setPushEnabled(true)
      new Notification('Kuziini Recruitment', { body: 'Notificarile sunt activate! Vei fi anuntat la fiecare aplicare noua.', icon: '/logo-kuziini.png' })
    }
  }

  // Settings
  const [notifEmail, setNotifEmail] = useState(() => localStorage.getItem('kuziini_notif_email') || 'my@kuziini.ro')
  const [notifPhone, setNotifPhone] = useState(() => localStorage.getItem('kuziini_notif_phone') || '0723333221')
  const [musicClassical, setMusicClassical] = useState(() => localStorage.getItem('kuziini_music_classical') || 'https://www.youtube.com/watch?v=hN_q-_nGv4U')
  const [musicLofi, setMusicLofi] = useState(() => localStorage.getItem('kuziini_music_lofi') || 'https://www.youtube.com/watch?v=5qap5aO4i9A')
  const [musicJazz, setMusicJazz] = useState(() => localStorage.getItem('kuziini_music_jazz') || 'https://www.youtube.com/watch?v=Dx5qFachd3A')
  const [startClassical, setStartClassical] = useState(() => localStorage.getItem('kuziini_start_classical') || '48')
  const [startLofi, setStartLofi] = useState(() => localStorage.getItem('kuziini_start_lofi') || '0')
  const [startJazz, setStartJazz] = useState(() => localStorage.getItem('kuziini_start_jazz') || '0')
  const [settingsSaved, setSettingsSaved] = useState(false)

  const [previewIframe, setPreviewIframe] = useState(null)

  function previewMusic(url, startSec) {
    // Extract ID
    const input = url || ''
    let id = input
    if (!/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      const m = input.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
      if (m) id = m[1]
    }
    if (!id) return
    const sec = parseInt(startSec) || 0
    // Toggle off if same
    if (previewIframe === id) {
      setPreviewIframe(null)
      return
    }
    setPreviewIframe(id + '|' + sec)
  }

  function saveSettings() {
    localStorage.setItem('kuziini_notif_email', notifEmail)
    localStorage.setItem('kuziini_notif_phone', notifPhone)
    localStorage.setItem('kuziini_music_classical', musicClassical)
    localStorage.setItem('kuziini_music_lofi', musicLofi)
    localStorage.setItem('kuziini_music_jazz', musicJazz)
    localStorage.setItem('kuziini_start_classical', startClassical)
    localStorage.setItem('kuziini_start_lofi', startLofi)
    localStorage.setItem('kuziini_start_jazz', startJazz)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 3000)
  }

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [statsRes, applicantsRes, bestRes] = await Promise.all([
        fetch(`${API}/api/admin/stats`),
        fetch(`${API}/api/admin/applicants`),
        fetch(`${API}/api/admin/best`),
      ])
      setStats(await statsRes.json())
      setApplicants(await applicantsRes.json())
      const bestData = await bestRes.json()
      setBest(bestData.best)
      setTop5(bestData.top5 || [])
    } catch (err) {
      console.error('Failed to load admin data:', err)
    }
    setLoading(false)
  }

  async function toggleDetail(id) {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedData(null)
      return
    }
    const res = await fetch(`${API}/api/admin/applicant?id=${id}`)
    setExpandedData(await res.json())
    setExpandedId(id)
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div className="spinner" />
            <p style={{ color: '#6b7280' }}>Se incarca datele...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-container">

        {/* ════════ HEADER ════════ */}
        <div className="admin-header">
          <div>
            <h1>Kuziini Recruitment Admin</h1>
            <p className="admin-subtitle">Panou de management aplicanti — toate datele intr-o singura pagina</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {newAlert && <span className="new-applicant-alert">Aplicant nou!</span>}
            {!pushEnabled ? (
              <button className="btn btn-small btn-notif" onClick={enableNotifications}>🔔 Activeaza notificari</button>
            ) : (
              <span className="notif-active-badge">🔔 Notificari active</span>
            )}
            <button className="btn btn-small" onClick={loadData}>Reincarca</button>
            {onHome && <button className="btn btn-small" onClick={onHome}>🏠 Home</button>}
            {onExit && <button className="btn btn-small" onClick={onExit}>🚪 Deconectare</button>}
          </div>
        </div>

        {/* ════════ STATS OVERVIEW ════════ */}
        {stats && (
          <>
            <div className="admin-stats-grid">
              <StatCard label="Total aplicanti" value={stats.total} />
              <StatCard
                label="Scor mediu"
                value={stats.avgScore}
                sub={`din ${applicants[0]?.max_score || 40} puncte`}
              />
              <StatCard label="Timp mediu completare" value={stats.avgCompletionTimeFormatted} />
              <StatCard
                label="Cel mai bun candidat"
                value={best?.full_name || 'N/A'}
                sub={best ? `${best.score_pct}% — Clasa ${best.classification}` : ''}
                color={best ? classColor(best.classification) : undefined}
              />
            </div>

            {/* ════════ CLASSIFICATION + SCORE DISTRIBUTION ════════ */}
            <div className="admin-two-cols">
              <div className="admin-card">
                <h2>Distributie clasificari</h2>
                <div className="class-distribution">
                  {['A', 'B', 'C', 'D'].map((c) => {
                    const item = stats.byClassification.find((b) => b.classification === c)
                    const count = item?.count || 0
                    const pct = stats.total ? Math.round((count / stats.total) * 100) : 0
                    return (
                      <div key={c} className="class-bar-row">
                        <span className="class-badge" style={{ background: classColor(c), color: '#fff' }}>
                          {c}
                        </span>
                        <span className="class-badge-label">{classLabel(c)}</span>
                        <div className="class-bar-track">
                          <div className="class-bar-fill" style={{ width: `${pct}%`, background: classColor(c) }} />
                        </div>
                        <span className="class-bar-count">{count} ({pct}%)</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="admin-card">
                <h2>Distributie scoruri</h2>
                <div className="class-distribution">
                  {stats.scoreDistribution.map((s) => (
                    <div key={s.range} className="class-bar-row">
                      <span className="score-range-label">{s.range}</span>
                      <div className="class-bar-track">
                        <div
                          className="class-bar-fill"
                          style={{
                            width: `${stats.total ? (s.count / stats.total) * 100 : 0}%`,
                            background: '#6366f1',
                          }}
                        />
                      </div>
                      <span className="class-bar-count">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ════════ AVG PER QUESTION ════════ */}
            {stats.avgByQuestion.length > 0 && (
              <div className="admin-card">
                <h2>Scor mediu per intrebare</h2>
                <div className="question-stats">
                  {stats.avgByQuestion.map((q, i) => (
                    <div key={i} className="question-stat-row">
                      <div className="question-stat-text">{q.question}</div>
                      <div className="question-stat-bar-wrap">
                        <div className="question-stat-bar" style={{ width: `${(q.avgScore / q.maxPoints) * 100}%` }} />
                      </div>
                      <span className="question-stat-val">{q.avgScore}/{q.maxPoints}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════ TOP CANDIDATI (RECOMANDARI) ════════ */}
        {best && (
          <div className="admin-card best-card">
            <h2>Recomandare — Cel mai potrivit candidat</h2>
            <div className="best-header">
              <div className="best-rank"><span className="best-star">&#9733;</span> #1</div>
              <div className="best-info">
                <div className="best-name">{best.full_name}</div>
                <div className="best-meta">{best.email} | {best.phone} | Exp. Corpus: {best.corpus_years} ani</div>
              </div>
              <div className="best-score-circle" style={{ borderColor: classColor(best.classification) }}>
                <span className="best-score-val">{best.score_pct}%</span>
                <span className="best-score-class">{best.classification}</span>
              </div>
            </div>
            <ProfileCard applicant={best} />
            {top5.length > 1 && (
              <div className="top5-list">
                {top5.slice(1).map((a) => (
                  <div key={a.id} className="top5-item">
                    <span className="top5-rank">#{a.rank}</span>
                    <span className="top5-name">{a.full_name}</span>
                    <span className="class-badge-sm" style={{ background: classColor(a.classification) }}>{a.classification}</span>
                    <span className="top5-score">{a.score_pct}%</span>
                    <span className="top5-time">{a.completion_time_formatted}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════ TOTI APLICANTII ════════ */}
        <div className="admin-card">
          <h2>Toti aplicantii ({applicants.length})</h2>
          {applicants.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
              Niciun aplicant inca. Datele vor aparea dupa prima aplicare completata.
            </p>
          ) : (
            <div className="applicants-list">
              {applicants.map((a) => (
                <div key={a.id} className="applicant-row-wrap">
                  <div className="applicant-row" onClick={() => toggleDetail(a.id)}>
                    <div className="applicant-main">
                      <span className="class-badge-sm" style={{ background: classColor(a.classification) }}>
                        {a.classification}
                      </span>
                      <div className="applicant-name-col">
                        <strong>{a.full_name}</strong>
                        <span className="applicant-sub">{a.email} | {a.phone}</span>
                      </div>
                    </div>
                    <div className="applicant-stats">
                      <div className="applicant-stat">
                        <span className="applicant-stat-label">Scor</span>
                        <span className="applicant-stat-val" style={{ color: classColor(a.classification) }}>
                          {a.score_pct}%
                        </span>
                      </div>
                      <div className="applicant-stat">
                        <span className="applicant-stat-label">Corpus</span>
                        <span className="applicant-stat-val">{a.corpus_years} ani</span>
                      </div>
                      <div className="applicant-stat">
                        <span className="applicant-stat-label">Timp</span>
                        <span className="applicant-stat-val">{a.completion_time_formatted}</span>
                      </div>
                      <div className="applicant-stat">
                        <span className="applicant-stat-label">Data</span>
                        <span className="applicant-stat-val">{new Date(a.created_at).toLocaleDateString('ro-RO')}</span>
                      </div>
                    </div>
                    <span className="applicant-expand">{expandedId === a.id ? '▲' : '▼'}</span>
                  </div>

                  {/* Expanded detail inline */}
                  {expandedId === a.id && expandedData && (
                    <div className="applicant-detail">
                      <div className="detail-grid">
                        <div className="detail-item"><span>Oras</span><strong>{expandedData.city || '-'}</strong></div>
                        <div className="detail-item"><span>Experienta totala</span><strong>{expandedData.experience_years} ani</strong></div>
                        <div className="detail-item"><span>Experienta Corpus</span><strong>{expandedData.corpus_years} ani</strong></div>
                        <div className="detail-item"><span>Rol actual</span><strong>{expandedData.current_role || '-'}</strong></div>
                        <div className="detail-item"><span>Salariu dorit</span><strong>{expandedData.expected_salary || '-'}</strong></div>
                        <div className="detail-item"><span>Disponibil din</span><strong>{expandedData.available_from || '-'}</strong></div>
                        <div className="detail-item"><span>Relocare</span><strong>{expandedData.relocate ? 'Da' : 'Nu'}</strong></div>
                        <div className="detail-item"><span>Timp completare</span><strong>{expandedData.completion_time_formatted}</strong></div>
                        <div className="detail-item"><span>Portfolio</span><strong>{expandedData.portfolio_link || '-'}</strong></div>
                        <div className="detail-item"><span>LinkedIn</span><strong>{expandedData.linkedin || '-'}</strong></div>
                      </div>

                      {expandedData.motivation && (
                        <div className="detail-motivation">
                          <h3>Motivatie</h3>
                          <p>{expandedData.motivation}</p>
                        </div>
                      )}

                      <ProfileCard applicant={expandedData} />

                      <div className="detail-answers">
                        <h3>Raspunsuri ({expandedData.interview_score}/{expandedData.max_score} puncte)</h3>
                        <div className="answers-grid">
                          {expandedData.interview_answers.map((ans, i) => (
                            <div key={i} className="answer-card">
                              <div className="answer-q">{i + 1}. {ans.question}</div>
                              <div className="answer-a">{ans.selectedAnswer}</div>
                              <div className="answer-score" style={{
                                color: ans.points >= ans.maxPoints * 0.6 ? '#16a34a' : ans.points > 0 ? '#ca8a04' : '#dc2626'
                              }}>
                                {ans.points}/{ans.maxPoints}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ════════ SETARI ════════ */}
        <div className="admin-card">
          <h2>Setari</h2>
          <div className="admin-settings">
            <h3 className="settings-section-title">Notificari</h3>
            <div className="settings-row">
              <label>Email notificari</label>
              <input
                type="email"
                value={notifEmail}
                onChange={(e) => setNotifEmail(e.target.value)}
                placeholder="my@kuziini.ro"
              />
            </div>
            <div className="settings-row">
              <label>Telefon notificari</label>
              <input
                type="tel"
                value={notifPhone}
                onChange={(e) => setNotifPhone(e.target.value)}
                placeholder="0723333221"
              />
            </div>

            <h3 className="settings-section-title" style={{ marginTop: 24 }}>Melodii pe gen muzical (link YouTube)</h3>
            <div className="music-setting-row">
              <label>🎻 Clasica</label>
              <input type="url" value={musicClassical} onChange={(e) => setMusicClassical(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
              <input type="number" min="0" value={startClassical} onChange={(e) => setStartClassical(e.target.value)} className="start-sec-input" title="Secunda start" />
              <span className="start-sec-label">sec</span>
              <button type="button" className="btn btn-small btn-play" onClick={() => previewMusic(musicClassical, startClassical)}>&#9654; Play</button>
            </div>
            <div className="music-setting-row">
              <label>🎧 Lo-Fi</label>
              <input type="url" value={musicLofi} onChange={(e) => setMusicLofi(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
              <input type="number" min="0" value={startLofi} onChange={(e) => setStartLofi(e.target.value)} className="start-sec-input" title="Secunda start" />
              <span className="start-sec-label">sec</span>
              <button type="button" className="btn btn-small btn-play" onClick={() => previewMusic(musicLofi, startLofi)}>&#9654; Play</button>
            </div>
            <div className="music-setting-row">
              <label>🎷 Jazz</label>
              <input type="url" value={musicJazz} onChange={(e) => setMusicJazz(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
              <input type="number" min="0" value={startJazz} onChange={(e) => setStartJazz(e.target.value)} className="start-sec-input" title="Secunda start" />
              <span className="start-sec-label">sec</span>
              <button type="button" className="btn btn-small btn-play" onClick={() => previewMusic(musicJazz, startJazz)}>&#9654; Play</button>
            </div>

            {previewIframe && (
              <div className="music-preview">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>Preview melodie (de la sec {previewIframe.split('|')[1]})</span>
                  <button className="btn btn-small" onClick={() => setPreviewIframe(null)}>&#9632; Stop</button>
                </div>
                <iframe
                  width="100%" height="80"
                  src={`https://www.youtube.com/embed/${previewIframe.split('|')[0]}?autoplay=1&start=${previewIframe.split('|')[1]}`}
                  allow="autoplay"
                  style={{ border: 'none', borderRadius: 8 }}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', marginTop: 16 }}>
              <button className="btn btn-primary" onClick={saveSettings} style={{ padding: '12px 28px' }}>
                Salveaza setarile
              </button>
              {settingsSaved && <span className="settings-saved">Salvat!</span>}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
