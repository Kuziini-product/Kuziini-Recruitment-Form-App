import { useState, useRef, useEffect, useCallback } from 'react'
import {
  technicalQuestions,
  kuziiniQuestions,
  TOTAL_MAX_SCORE,
} from './interviewQuestions'

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

// Shuffle all choice-type questions' options
const allQuestions = [...technicalQuestions, ...kuziiniQuestions].map((q) => {
  if (q.options) {
    return { ...q, options: shuffleWithSeed(q.options, q.id) }
  }
  return q
})

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

export default function MiniInterview({ formData, startTime, onComplete, onBack }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [heartsValue, setHeartsValue] = useState(0)
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

  const techCount = technicalQuestions.length
  const sectionLabel =
    currentQ < techCount ? 'Evaluare Tehnica' : 'Despre Kuziini'

  function handleSelect(optIndex) {
    setSelected(optIndex)
  }

  function canProceed() {
    if (isHeartsQ) return heartsValue > 0
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

  function handleSubmitWithUpload() {
    submitAll(answers, portfolioFile)
  }

  function handlePrev() {
    if (currentQ === 0) {
      onBack()
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
              <p>Se trimite aplicarea...</p>
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
              <h1>Felicitari!</h1>
              <p className="interview-subtitle">
                Ai obtinut un scor excelent! Poti incarca optional un portofoliu sau CV
                pentru a-ti consolida aplicarea.
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
                    <p>Click pentru a incarca un fisier</p>
                    <span className="upload-hint">PDF, DOC, ZIP, JPG — max 10 MB</span>
                  </div>
                )}
              </div>
            </div>

            {error && <div className="error interview-error">{error}</div>}

            <div className="interview-footer">
              <button className="btn btn-secondary" onClick={handleSkipUpload} type="button">
                Sari peste
              </button>
              <button className="btn btn-primary" onClick={handleSubmitWithUpload} type="button">
                {portfolioFile ? 'Trimite cu portofoliu' : 'Trimite aplicarea'}
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
            <h1>Mini-Interviu</h1>
            <p className="interview-subtitle">
              Raspunde la urmatoarele intrebari pentru a ne ajuta sa evaluam profilul tau.
            </p>
            <div className="interview-progress-bar">
              <div className="interview-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="interview-progress-text">
              Intrebarea {currentQ + 1} din {total}
            </span>
          </div>

          <div className="interview-question">
            <h2 className="question-text">{q.question}</h2>

            {isHeartsQ ? (
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
                    <span className="option-text">{opt.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <div className="error interview-error">{error}</div>}

          <div className="interview-footer">
            <button className="btn btn-secondary" onClick={handlePrev} type="button">
              {currentQ === 0 ? 'Inapoi la formular' : 'Inapoi'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!canProceed()}
              type="button"
            >
              {currentQ < total - 1 ? 'Urmatoarea' : 'Finalizeaza'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
