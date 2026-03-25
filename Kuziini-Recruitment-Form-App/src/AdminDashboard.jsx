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

export default function AdminDashboard({ onExit }) {
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

  // Settings
  const [notifEmail, setNotifEmail] = useState(() => localStorage.getItem('kuziini_notif_email') || 'my@kuziini.com')
  const [notifPhone, setNotifPhone] = useState(() => localStorage.getItem('kuziini_notif_phone') || '0723333221')
  const [settingsSaved, setSettingsSaved] = useState(false)

  function saveSettings() {
    localStorage.setItem('kuziini_notif_email', notifEmail)
    localStorage.setItem('kuziini_notif_phone', notifPhone)
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
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-small" onClick={loadData}>Reincarca</button>
            {onExit && <button className="btn btn-small" onClick={onExit}>Inapoi la formular</button>}
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

        {/* ════════ SETARI NOTIFICARI ════════ */}
        <div className="admin-card">
          <h2>Setari notificari</h2>
          <div className="admin-settings">
            <div className="settings-row">
              <label>Email notificari</label>
              <input
                type="email"
                value={notifEmail}
                onChange={(e) => setNotifEmail(e.target.value)}
                placeholder="my@kuziini.com"
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
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
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
