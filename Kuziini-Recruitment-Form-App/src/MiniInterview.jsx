import { useState, useRef, useEffect, useCallback } from 'react'
import {
  technicalQuestions,
  kuziiniQuestions,
  TOTAL_MAX_SCORE,
} from './interviewQuestions'
import { questionsI18n } from './i18n'

// ── Shuffle options per question (seeded by question id for consistency) ──
function shuffleWithSeed(arr, seed) {
  const shuffled = [...arr]
  let s = typeof seed === 'string' ? seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : seed
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Shuffle all choice-type questions' options, preserving original index for i18n
const allQuestions = [...technicalQuestions, ...kuziiniQuestions].map((q) => {
  if (q.options) {
    const tagged = q.options.map((o, idx) => ({ ...o, _oi: idx }))
    return { ...q, options: shuffleWithSeed(tagged, q.id) }
  }
  return q
})

// Map question IDs to i18n keys
const qIdToKey = { 1: 'q1', 2: 'q2', 3: 'q3', hobby: 'qHobby', 4: 'q4', 5: 'q5', 6: 'q6', k1: 'k1', k2: 'k2', k3: 'k3', k4: 'k4' }
// Map option texts (RO) to i18n keys for each question
const optionKeys = {
  1: ['q1o1', 'q1o2', 'q1o3', 'q1o4'],
  2: ['q2o1', 'q2o2', 'q2o3', 'q2o4'],
  3: ['q3o1', 'q3o2', 'q3o3', 'q3o4'],
  4: ['q4o1', 'q4o2', 'q4o3', 'q4o4'],
  5: ['q5o1', 'q5o2', 'q5o3', 'q5o4'],
  6: ['q6o1', 'q6o2', 'q6o3', 'q6o4'],
  k1: ['k1o1', 'k1o2', 'k1o3', 'k1o4'],
  k3: ['k3o1', 'k3o2', 'k3o3', 'k3o4'],
}
// Hobby option i18n keys
const hobbyKeys = ['hobbySport', 'hobbyStudy', 'hobbyTravel', 'hobbyMovies', 'hobbyNone', 'hobbyCustom']

// ── Falling hearts particle system ──
function FallingHearts({ count }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (count <= 0) {
      setParticles([])
      return
    }
    // Generate particles based on count (more hearts = more particles)
    const numParticles = count * 6
    const newParticles = Array.from({ length: numParticles }, (_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 1.5 + Math.random() * 2,
      size: 0.6 + Math.random() * 1.2,
      drift: (Math.random() - 0.5) * 40,
    }))
    setParticles(newParticles)

    const timer = setTimeout(() => setParticles([]), 4000)
    return () => clearTimeout(timer)
  }, [count])

  if (particles.length === 0) return null

  return (
    <div className="falling-hearts-container">
      {particles.map((p) => (
        <span
          key={p.id}
          className="falling-heart"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            fontSize: `${p.size}rem`,
            '--drift': `${p.drift}px`,
          }}
        >
          {'\u2764\uFE0F'}
        </span>
      ))}
    </div>
  )
}

function HeartsRating({ max, value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="hearts-rating-wrap">
      <FallingHearts count={value} />
      <div className="hearts-rating">
        {Array.from({ length: max }, (_, i) => {
          const idx = i + 1
          const active = idx <= (hover || value)
          return (
            <button
              key={i}
              type="button"
              className={`heart-btn ${active ? 'heart-active' : ''}`}
              onClick={() => onChange(idx)}
              onMouseEnter={() => setHover(idx)}
              onMouseLeave={() => setHover(0)}
            >
              {active ? '\u2764\uFE0F' : '\u{1F90D}'}
            </button>
          )
        })}
        {value > 0 && <span className="hearts-label">{value}/{max}</span>}
      </div>
    </div>
  )
}

export default function MiniInterview({ formData, cvFile, startTime, onComplete, onBack, lang = 'ro' }) {
  const qt = (key) => questionsI18n[key] ? (questionsI18n[key][lang] || questionsI18n[key].ro) : key
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [heartsValue, setHeartsValue] = useState(0)
  const [customHobby, setCustomHobby] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Portfolio upload state (shown after interview if score > 70%)
  const [showUpload, setShowUpload] = useState(false)
  const [portfolioFile, setPortfolioFile] = useState(null)
  const fileInputRef = useRef(null)

  const q = allQuestions[currentQ]
  const total = allQuestions.length
  const progress = Math.round((currentQ / total) * 100)
  const isHeartsQ = q?.type === 'hearts'
  const isHobbyQ = q?.type === 'hobby'

  const techCount = technicalQuestions.length
  const sectionLabel =
    isHobbyQ ? (lang === 'ro' ? 'Personalitate' : 'Personality') : currentQ < techCount ? (lang === 'ro' ? 'Evaluare Tehnica' : 'Technical Evaluation') : (lang === 'ro' ? 'Despre Kuziini' : 'About Kuziini')

  function handleSelect(optIndex) {
    setSelected(optIndex)
  }

  function canProceed() {
    if (isHeartsQ) return heartsValue > 0
    if (isHobbyQ) {
      if (selected === null) return false
      const opt = q.options[selected]
      if (opt.custom) return customHobby.trim().length > 0
      return true
    }
    return selected !== null
  }

  function buildAnswer() {
    if (isHeartsQ) {
      return {
        question: q.question,
        selectedAnswer: `${heartsValue}/${q.maxHearts} inimioare`,
        points: heartsValue * q.pointsPerHeart,
        maxPoints: q.maxHearts * q.pointsPerHeart,
        type: 'hearts',
      }
    }
    if (isHobbyQ) {
      const opt = q.options[selected]
      return {
        question: q.question,
        selectedAnswer: opt.custom ? `Personalizat: ${customHobby}` : opt.text,
        points: opt.points,
        maxPoints: Math.max(...q.options.map((o) => o.points)),
        type: 'hobby',
      }
    }
    const option = q.options[selected]
    return {
      question: q.question,
      selectedAnswer: option.text,
      points: option.points,
      maxPoints: Math.max(...q.options.map((o) => o.points)),
      type: 'choice',
    }
  }

  function handleNext() {
    if (!canProceed()) return

    const newAnswers = [...answers, buildAnswer()]
    setAnswers(newAnswers)
    setSelected(null)
    setHeartsValue(0)
    setCustomHobby('')

    if (currentQ < total - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      checkScoreAndProceed(newAnswers)
    }
  }

  function checkScoreAndProceed(finalAnswers) {
    const totalScore = finalAnswers.reduce((s, a) => s + a.points, 0)
    const pct = (totalScore / TOTAL_MAX_SCORE) * 100
    if (pct >= 70) {
      setShowUpload(true)
    } else {
      submitAll(finalAnswers, null)
    }
  }

  function handleSkipUpload() {
    submitAll(answers, null)
  }

  // Save partial + send abandon email when user quits
  async function savePartialAndQuit() {
    try {
      await fetch('/api/partial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData }),
      })
    } catch {}
    onBack()
  }

  function handleSubmitWithUpload() {
    submitAll(answers, portfolioFile)
  }

  function handlePrev() {
    if (currentQ === 0) {
      savePartialAndQuit()
      return
    }
    setAnswers(answers.slice(0, -1))
    setCurrentQ(currentQ - 1)
    setSelected(null)
    setHeartsValue(0)
  }

  async function submitAll(finalAnswers, file) {
    setSubmitting(true)
    setError('')

    const totalScore = finalAnswers.reduce((s, a) => s + a.points, 0)
    const completionSeconds = Math.round((Date.now() - startTime) / 1000)

    try {
      const payload = {
        formData,
        interviewAnswers: finalAnswers,
        interviewScore: totalScore,
        maxScore: TOTAL_MAX_SCORE,
        completionTimeSeconds: completionSeconds,
      }

      let res
      if (file) {
        const fd = new FormData()
        fd.append('data', JSON.stringify(payload))
        fd.append('portfolio', file)
        res = await fetch('/api/apply', {
          method: 'POST',
          body: fd,
        })
      } else {
        res = await fetch('/api/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Server error')

      onComplete({
        score: totalScore,
        maxScore: TOTAL_MAX_SCORE,
        classification: data.classification,
        classificationLabel: data.classificationLabel,
        answers: finalAnswers,
      })
    } catch (err) {
      setError(`Eroare la trimitere: ${err.message}. Verificati ca serverul ruleaza.`)
      setSubmitting(false)
    }
  }

  // ── Loading state ──
  if (submitting && !error) {
    return (
      <div className="page">
        <div className="container success-wrap">
          <section className="card interview-card">
            <div className="interview-loading">
              <div className="spinner" />
              <p>{lang === 'ro' ? 'Se trimite aplicarea...' : 'Submitting application...'}</p>
            </div>
          </section>
        </div>
      </div>
    )
  }

  // ── Portfolio upload screen ──
  if (showUpload) {
    return (
      <div className="page">
        <div className="container success-wrap">
          <section className="card interview-card">
            <div className="interview-header">
              <h1>{lang === 'ro' ? 'Felicitari!' : 'Congratulations!'}</h1>
              <p className="interview-subtitle">
                {lang === 'ro' ? 'Ai obtinut un scor excelent! Poti incarca optional un portofoliu sau CV pentru a-ti consolida aplicarea.' : 'You got an excellent score! You can optionally upload a portfolio or CV to strengthen your application.'}
              </p>
            </div>

            <div className="upload-zone">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={(e) => setPortfolioFile(e.target.files[0] || null)}
              />
              <div
                className="upload-area"
                onClick={() => fileInputRef.current?.click()}
              >
                {portfolioFile ? (
                  <div className="upload-selected">
                    <span className="upload-file-icon">&#128196;</span>
                    <span>{portfolioFile.name}</span>
                    <span className="upload-size">
                      ({(portfolioFile.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <span className="upload-cloud-icon">&#128228;</span>
                    <p>{lang === 'ro' ? 'Click pentru a incarca un fisier' : 'Click to upload a file'}</p>
                    <span className="upload-hint">PDF, DOC, ZIP, JPG — max 10 MB</span>
                  </div>
                )}
              </div>
            </div>

            {error && <div className="error interview-error">{error}</div>}

            <div className="interview-footer">
              <button className="btn btn-secondary" onClick={handleSkipUpload} type="button">
                {lang === 'ro' ? 'Sari peste' : 'Skip'}
              </button>
              <button className="btn btn-primary" onClick={handleSubmitWithUpload} type="button">
                {portfolioFile ? (lang === 'ro' ? 'Trimite cu portofoliu' : 'Submit with portfolio') : (lang === 'ro' ? 'Trimite aplicarea' : 'Submit application')}
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  // ── Interview questions ──
  return (
    <div className="page">
      <div className="container success-wrap">
        <section className="card interview-card">
          <div className="interview-header">
            <div className="section-badge">{sectionLabel}</div>
            <h1>{lang === 'ro' ? 'Mini-Interviu' : 'Mini-Interview'}</h1>
            <p className="interview-subtitle">
              {lang === 'ro' ? 'Raspunde la urmatoarele intrebari pentru a ne ajuta sa evaluam profilul tau.' : 'Answer the following questions to help us evaluate your profile.'}
            </p>
            <div className="interview-progress-bar">
              <div className="interview-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="interview-progress-text">
              {lang === 'ro' ? 'Intrebarea' : 'Question'} {currentQ + 1} {lang === 'ro' ? 'din' : 'of'} {total}
            </span>
          </div>

          <div className="interview-question">
            <div className="question-row">
              <button className="back-arrow" onClick={handlePrev} type="button" title={currentQ === 0 ? 'Inapoi la formular' : 'Inapoi'}>
                &#8592;
              </button>
              <h2 className="question-text">{qIdToKey[q.id] ? qt(qIdToKey[q.id]) : q.question}</h2>
            </div>

            {isHobbyQ ? (
              <div className="hobby-grid">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`hobby-btn ${selected === i ? 'hobby-active' : ''}`}
                    onClick={() => { setSelected(i); setCustomHobby('') }}
                  >
                    <span className="hobby-icon">{opt.icon}</span>
                    <span className="hobby-label">{hobbyKeys[opt._oi != null ? opt._oi : i] ? qt(hobbyKeys[opt._oi != null ? opt._oi : i]) : opt.text}</span>
                  </button>
                ))}
                {selected !== null && q.options[selected]?.custom && (
                  <input
                    className="hobby-custom-input"
                    type="text"
                    value={customHobby}
                    onChange={(e) => setCustomHobby(e.target.value)}
                    placeholder={lang === 'ro' ? 'Scrie hobby-ul tau...' : 'Write your hobby...'}
                    autoFocus
                  />
                )}
              </div>
            ) : isHeartsQ ? (
              <HeartsRating
                max={q.maxHearts}
                value={heartsValue}
                onChange={setHeartsValue}
              />
            ) : (
              <div className="options-list">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    className={`option-btn ${selected === i ? 'option-selected' : ''}`}
                    onClick={() => handleSelect(i)}
                    type="button"
                  >
                    <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                    <span className="option-text">{optionKeys[q.id] && opt._oi != null ? qt(optionKeys[q.id][opt._oi]) : opt.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <div className="error interview-error">{error}</div>}

          <div className="interview-footer">
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!canProceed()}
              type="button"
            >
              {currentQ < total - 1 ? (lang === 'ro' ? 'Urmatoarea' : 'Next') : (lang === 'ro' ? 'Finalizeaza' : 'Submit')}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
