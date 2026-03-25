import { useEffect, useState } from 'react'

const API = ''

function classColor(c) {
  if (c === 'A') return '#16a34a'
  if (c === 'B') return '#ca8a04'
  if (c === 'C') return '#ea580c'
  return '#dc2626'
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

function ScoreBar({ pct, classification }) {
  return (
    <div className="score-bar-wrap">
      <div
        className="score-bar-fill"
        style={{ width: `${pct}%`, background: classColor(classification) }}
      />
      <span className="score-bar-label">{pct}%</span>
    </div>
  )
}

export default function AdminDashboard({ onExit }) {
  const [stats, setStats] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [best, setBest] = useState(null)
  const [top5, setTop5] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview') // overview | applicants | best | detail

  useEffect(() => {
    loadData()
  }, [])

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

  async function viewDetail(id) {
    const res = await fetch(`${API}/api/admin/applicant?id=${id}`)
    setDetail(await res.json())
    setSelectedId(id)
    setTab('detail')
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <div className="interview-loading">
            <div className="spinner" />
            <p>Se incarca datele...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1>Kuziini Recruitment Admin</h1>
            <p className="admin-subtitle">Panou de management aplicanti</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={loadData}>
              Reincarca datele
            </button>
            {onExit && (
              <button className="btn btn-secondary" onClick={onExit}>
                Inapoi la formular
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === 'overview' ? 'admin-tab-active' : ''}`}
            onClick={() => setTab('overview')}
          >
            Statistici
          </button>
          <button
            className={`admin-tab ${tab === 'applicants' ? 'admin-tab-active' : ''}`}
            onClick={() => setTab('applicants')}
          >
            Toti aplicantii ({applicants.length})
          </button>
          <button
            className={`admin-tab ${tab === 'best' ? 'admin-tab-active' : ''}`}
            onClick={() => setTab('best')}
          >
            Recomandari
          </button>
          {tab === 'detail' && (
            <button className="admin-tab admin-tab-active">
              Detalii #{selectedId}
            </button>
          )}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && stats && (
          <div className="admin-section">
            <div className="admin-stats-grid">
              <StatCard label="Total aplicanti" value={stats.total} />
              <StatCard
                label="Scor mediu"
                value={stats.avgScore}
                sub={`din ${applicants[0]?.max_score || 40} puncte`}
              />
              <StatCard
                label="Timp mediu completare"
                value={stats.avgCompletionTimeFormatted}
              />
              <StatCard
                label="Cel mai bun"
                value={best?.full_name || '-'}
                sub={best ? `${best.score_pct}% - Clasa ${best.classification}` : ''}
                color={best ? classColor(best.classification) : undefined}
              />
            </div>

            {/* Classification distribution */}
            <div className="admin-card">
              <h2>Distributie pe clasificari</h2>
              <div className="class-distribution">
                {['A', 'B', 'C', 'D'].map((c) => {
                  const item = stats.byClassification.find((b) => b.classification === c)
                  const count = item?.count || 0
                  const pct = stats.total ? Math.round((count / stats.total) * 100) : 0
                  return (
                    <div key={c} className="class-bar-row">
                      <span
                        className="class-badge"
                        style={{ background: classColor(c), color: '#fff' }}
                      >
                        {c}
                      </span>
                      <div className="class-bar-track">
                        <div
                          className="class-bar-fill"
                          style={{ width: `${pct}%`, background: classColor(c) }}
                        />
                      </div>
                      <span className="class-bar-count">
                        {count} ({pct}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Score distribution */}
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

            {/* Average per question */}
            {stats.avgByQuestion.length > 0 && (
              <div className="admin-card">
                <h2>Scor mediu per intrebare</h2>
                <div className="question-stats">
                  {stats.avgByQuestion.map((q, i) => (
                    <div key={i} className="question-stat-row">
                      <div className="question-stat-text">{q.question}</div>
                      <div className="question-stat-bar-wrap">
                        <div
                          className="question-stat-bar"
                          style={{ width: `${(q.avgScore / q.maxPoints) * 100}%` }}
                        />
                      </div>
                      <span className="question-stat-val">
                        {q.avgScore}/{q.maxPoints}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent applicants */}
            {stats.recentApplicants.length > 0 && (
              <div className="admin-card">
                <h2>Ultimii aplicanti</h2>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nume</th>
                      <th>Clasa</th>
                      <th>Scor</th>
                      <th>Timp</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentApplicants.map((a) => (
                      <tr
                        key={a.id}
                        className="admin-row-clickable"
                        onClick={() => viewDetail(a.id)}
                      >
                        <td>{a.full_name}</td>
                        <td>
                          <span
                            className="class-badge-sm"
                            style={{ background: classColor(a.classification) }}
                          >
                            {a.classification}
                          </span>
                        </td>
                        <td>{a.score_pct}%</td>
                        <td>{a.completion_time_formatted}</td>
                        <td>{new Date(a.created_at).toLocaleDateString('ro-RO')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── APPLICANTS TAB ── */}
        {tab === 'applicants' && (
          <div className="admin-section">
            <div className="admin-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nume</th>
                    <th>Email</th>
                    <th>Telefon</th>
                    <th>Clasa</th>
                    <th>Scor</th>
                    <th>Timp completare</th>
                    <th>Data</th>
                    <th>Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((a) => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td><strong>{a.full_name}</strong></td>
                      <td>{a.email}</td>
                      <td>{a.phone}</td>
                      <td>
                        <span
                          className="class-badge-sm"
                          style={{ background: classColor(a.classification) }}
                        >
                          {a.classification}
                        </span>
                      </td>
                      <td>
                        <ScoreBar pct={a.score_pct} classification={a.classification} />
                      </td>
                      <td>{a.completion_time_formatted}</td>
                      <td>{new Date(a.created_at).toLocaleDateString('ro-RO')}</td>
                      <td>
                        <button
                          className="btn btn-small"
                          onClick={() => viewDetail(a.id)}
                        >
                          Detalii
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {applicants.length === 0 && (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>
                  Niciun aplicant inca.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── BEST / RECOMMENDATIONS TAB ── */}
        {tab === 'best' && (
          <div className="admin-section">
            {best ? (
              <>
                <div className="admin-card best-card">
                  <div className="best-header">
                    <div className="best-rank">
                      <span className="best-star">&#9733;</span> #1
                    </div>
                    <div>
                      <h2>{best.full_name}</h2>
                      <p className="admin-subtitle">{best.recommendation}</p>
                    </div>
                    <div
                      className="best-score-circle"
                      style={{ borderColor: classColor(best.classification) }}
                    >
                      <span className="best-score-val">{best.score_pct}%</span>
                      <span className="best-score-class">{best.classification}</span>
                    </div>
                  </div>
                  <div className="best-details">
                    <div><strong>Email:</strong> {best.email}</div>
                    <div><strong>Telefon:</strong> {best.phone}</div>
                    <div><strong>Exp. Corpus:</strong> {best.corpus_years} ani</div>
                    <div><strong>Exp. totala:</strong> {best.experience_years} ani</div>
                    <div><strong>Salariu dorit:</strong> {best.expected_salary || '-'}</div>
                    <div><strong>Timp completare:</strong> {best.completion_time_formatted}</div>
                  </div>
                  <button className="btn btn-primary" onClick={() => viewDetail(best.id)}>
                    Vezi profilul complet
                  </button>
                </div>

                {top5.length > 1 && (
                  <div className="admin-card">
                    <h2>Top 5 candidati</h2>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Nume</th>
                          <th>Clasa</th>
                          <th>Scor</th>
                          <th>Timp</th>
                          <th>Recomandare</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {top5.map((a) => (
                          <tr key={a.id}>
                            <td>
                              <strong>#{a.rank}</strong>
                            </td>
                            <td>{a.full_name}</td>
                            <td>
                              <span
                                className="class-badge-sm"
                                style={{ background: classColor(a.classification) }}
                              >
                                {a.classification}
                              </span>
                            </td>
                            <td>{a.score_pct}%</td>
                            <td>{a.completion_time_formatted}</td>
                            <td className="recommendation-text">{a.recommendation}</td>
                            <td>
                              <button
                                className="btn btn-small"
                                onClick={() => viewDetail(a.id)}
                              >
                                Detalii
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="admin-card" style={{ textAlign: 'center', padding: 60 }}>
                <p style={{ color: '#6b7280' }}>Niciun aplicant inca. Recomandarea va aparea dupa prima aplicare.</p>
              </div>
            )}
          </div>
        )}

        {/* ── DETAIL TAB ── */}
        {tab === 'detail' && detail && (
          <div className="admin-section">
            <button
              className="btn btn-secondary"
              onClick={() => setTab('applicants')}
              style={{ marginBottom: 16 }}
            >
              &larr; Inapoi la lista
            </button>

            <div className="admin-card">
              <div className="detail-header">
                <div>
                  <h2>{detail.full_name}</h2>
                  <p className="admin-subtitle">{detail.email} | {detail.phone}</p>
                </div>
                <div
                  className="detail-class-badge"
                  style={{ background: classColor(detail.classification) }}
                >
                  <div className="detail-class-letter">{detail.classification}</div>
                  <div className="detail-class-score">{detail.score_pct}%</div>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-item"><span>Oras</span><strong>{detail.city || '-'}</strong></div>
                <div className="detail-item"><span>Experienta totala</span><strong>{detail.experience_years} ani</strong></div>
                <div className="detail-item"><span>Experienta Corpus</span><strong>{detail.corpus_years} ani</strong></div>
                <div className="detail-item"><span>Rol actual</span><strong>{detail.current_role || '-'}</strong></div>
                <div className="detail-item"><span>Salariu dorit</span><strong>{detail.expected_salary || '-'}</strong></div>
                <div className="detail-item"><span>Disponibil din</span><strong>{detail.available_from || '-'}</strong></div>
                <div className="detail-item"><span>Relocare</span><strong>{detail.relocate ? 'Da' : 'Nu'}</strong></div>
                <div className="detail-item"><span>Timp completare</span><strong>{detail.completion_time_formatted}</strong></div>
                <div className="detail-item"><span>Data aplicare</span><strong>{new Date(detail.created_at).toLocaleString('ro-RO')}</strong></div>
                <div className="detail-item"><span>Portfolio link</span><strong>{detail.portfolio_link || '-'}</strong></div>
                {detail.portfolio_file && (
                  <div className="detail-item">
                    <span>Portfolio fisier</span>
                    <a href={`${API}/uploads/${detail.portfolio_file}`} target="_blank" rel="noreferrer">
                      Descarca
                    </a>
                  </div>
                )}
                <div className="detail-item"><span>LinkedIn</span><strong>{detail.linkedin || '-'}</strong></div>
              </div>

              <div className="detail-motivation">
                <h3>Motivatie</h3>
                <p>{detail.motivation}</p>
              </div>

              <div className="detail-answers">
                <h3>Raspunsuri Mini-Interviu ({detail.interview_score}/{detail.max_score} puncte)</h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Intrebare</th>
                      <th>Raspuns</th>
                      <th>Punctaj</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.interview_answers.map((a, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{a.question}</td>
                        <td>{a.selectedAnswer}</td>
                        <td>
                          <strong style={{ color: a.points >= a.maxPoints * 0.6 ? '#16a34a' : a.points > 0 ? '#ca8a04' : '#dc2626' }}>
                            {a.points}/{a.maxPoints}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
