import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import nodemailer from 'nodemailer'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import { mkdirSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Uploads directory ──
const uploadsDir = join(__dirname, 'uploads')
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir)

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e6)
      cb(null, unique + extname(file.originalname))
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
})

// ── Database setup ──
const db = new Database(join(__dirname, 'recruitment.db'))
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS applicants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT,
    experience_years TEXT,
    corpus_years TEXT,
    current_role TEXT,
    portfolio_link TEXT,
    portfolio_file TEXT,
    linkedin TEXT,
    motivation TEXT,
    expected_salary TEXT,
    available_from TEXT,
    relocate INTEGER DEFAULT 0,
    interview_answers TEXT,
    interview_score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    classification TEXT DEFAULT 'C',
    completion_time_seconds INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`)

// Add columns if they don't exist (migration for existing DBs)
const cols = db.prepare("PRAGMA table_info(applicants)").all().map(c => c.name)
if (!cols.includes('max_score')) db.exec('ALTER TABLE applicants ADD COLUMN max_score INTEGER DEFAULT 0')
if (!cols.includes('completion_time_seconds')) db.exec('ALTER TABLE applicants ADD COLUMN completion_time_seconds INTEGER DEFAULT 0')
if (!cols.includes('portfolio_file')) db.exec('ALTER TABLE applicants ADD COLUMN portfolio_file TEXT')
if (!cols.includes('portfolio_link')) {
  db.exec('ALTER TABLE applicants ADD COLUMN portfolio_link TEXT')
}

// ── Email transporter ──
let transporter = null

async function getTransporter() {
  if (transporter) return transporter

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  } else {
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
    console.log('Using Ethereal test email. Preview URLs will appear in console.')
  }
  return transporter
}

// ── Scoring & Classification ──
function classifyApplicant(score, maxScore) {
  const pct = (score / maxScore) * 100
  if (pct >= 80) return { classification: 'A', label: 'Excelent - Prioritate ridicata' }
  if (pct >= 60) return { classification: 'B', label: 'Bun - Potrivit pentru interviu' }
  if (pct >= 40) return { classification: 'C', label: 'Mediu - Necesita evaluare suplimentara' }
  return { classification: 'D', label: 'Sub asteptari - Nu se potriveste profilului' }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

// ── Express app ──
const app = express()
app.use(cors())
app.use(express.json())

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir))

// ══════════════════════════════════════════
//  POST /api/apply — save applicant
// ══════════════════════════════════════════
app.post('/api/apply', upload.single('portfolio'), async (req, res) => {
  try {
    let payload
    if (req.file) {
      // multipart form — JSON is in the 'data' field
      payload = JSON.parse(req.body.data)
    } else {
      payload = req.body
    }

    const { formData, interviewAnswers, interviewScore, maxScore, completionTimeSeconds } = payload
    const { classification, label } = classifyApplicant(interviewScore, maxScore)

    const stmt = db.prepare(`
      INSERT INTO applicants
        (full_name, phone, email, city, experience_years, corpus_years,
         current_role, portfolio_link, portfolio_file, linkedin, motivation,
         expected_salary, available_from, relocate, interview_answers,
         interview_score, max_score, classification, completion_time_seconds)
      VALUES
        (@full_name, @phone, @email, @city, @experience_years, @corpus_years,
         @current_role, @portfolio_link, @portfolio_file, @linkedin, @motivation,
         @expected_salary, @available_from, @relocate, @interview_answers,
         @interview_score, @max_score, @classification, @completion_time_seconds)
    `)

    const result = stmt.run({
      full_name: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      city: formData.city || '',
      experience_years: formData.experienceYears,
      corpus_years: formData.corpusYears,
      current_role: formData.currentRole || '',
      portfolio_link: formData.portfolio || '',
      portfolio_file: req.file ? req.file.filename : '',
      linkedin: formData.linkedin || '',
      motivation: formData.motivation,
      expected_salary: formData.expectedSalary || '',
      available_from: formData.availableFrom || '',
      relocate: formData.relocate ? 1 : 0,
      interview_answers: JSON.stringify(interviewAnswers),
      interview_score: interviewScore,
      max_score: maxScore,
      classification,
      completion_time_seconds: completionTimeSeconds || 0,
    })

    // Send email
    try {
      const transport = await getTransporter()
      const info = await transport.sendMail({
        from: '"Kuziini Recruitment" <noreply@kuziini.ro>',
        to: 'my@kuziini.com',
        subject: `[${classification}] Aplicare noua: ${formData.fullName} - Proiectant Mobilier`,
        html: buildEmailHtml(formData, interviewAnswers, interviewScore, maxScore, classification, label, completionTimeSeconds),
      })
      const previewUrl = nodemailer.getTestMessageUrl(info)
      if (previewUrl) console.log('Email preview:', previewUrl)
    } catch (emailErr) {
      console.error('Email send failed (applicant still saved):', emailErr.message)
    }

    res.json({
      success: true,
      id: result.lastInsertRowid,
      classification,
      classificationLabel: label,
      score: interviewScore,
      maxScore,
    })
  } catch (err) {
    console.error('Apply error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ══════════════════════════════════════════
//  ADMIN API ENDPOINTS
// ══════════════════════════════════════════

// GET /api/admin/applicants — all applicants with parsed answers
app.get('/api/admin/applicants', (req, res) => {
  const rows = db.prepare('SELECT * FROM applicants ORDER BY created_at DESC').all()
  const parsed = rows.map((r) => ({
    ...r,
    interview_answers: JSON.parse(r.interview_answers || '[]'),
    score_pct: r.max_score ? Math.round((r.interview_score / r.max_score) * 100) : 0,
    completion_time_formatted: formatTime(r.completion_time_seconds || 0),
  }))
  res.json(parsed)
})

// GET /api/admin/stats — aggregate statistics
app.get('/api/admin/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM applicants').get().count
  const byClass = db.prepare(`
    SELECT classification, COUNT(*) as count
    FROM applicants GROUP BY classification ORDER BY classification
  `).all()

  const avgScore = db.prepare('SELECT AVG(interview_score) as avg FROM applicants').get().avg || 0
  const avgTime = db.prepare('SELECT AVG(completion_time_seconds) as avg FROM applicants').get().avg || 0

  const scoreDistribution = db.prepare(`
    SELECT
      CASE
        WHEN (interview_score * 100.0 / NULLIF(max_score, 0)) >= 80 THEN '80-100%'
        WHEN (interview_score * 100.0 / NULLIF(max_score, 0)) >= 60 THEN '60-79%'
        WHEN (interview_score * 100.0 / NULLIF(max_score, 0)) >= 40 THEN '40-59%'
        ELSE '0-39%'
      END as range,
      COUNT(*) as count
    FROM applicants GROUP BY range ORDER BY range DESC
  `).all()

  const avgByQuestion = getAverageByQuestion()

  const recentApplicants = db.prepare(`
    SELECT id, full_name, classification, interview_score, max_score, completion_time_seconds, created_at
    FROM applicants ORDER BY created_at DESC LIMIT 5
  `).all()

  res.json({
    total,
    byClassification: byClass,
    avgScore: Math.round(avgScore * 10) / 10,
    avgCompletionTime: Math.round(avgTime),
    avgCompletionTimeFormatted: formatTime(Math.round(avgTime)),
    scoreDistribution,
    avgByQuestion,
    recentApplicants: recentApplicants.map(r => ({
      ...r,
      score_pct: r.max_score ? Math.round((r.interview_score / r.max_score) * 100) : 0,
      completion_time_formatted: formatTime(r.completion_time_seconds || 0),
    })),
  })
})

// GET /api/admin/best — recommendation for best applicant
app.get('/api/admin/best', (req, res) => {
  const rows = db.prepare(`
    SELECT *, (interview_score * 1.0 / NULLIF(max_score, 0)) as score_ratio
    FROM applicants
    ORDER BY score_ratio DESC, completion_time_seconds ASC, created_at ASC
    LIMIT 5
  `).all()

  if (rows.length === 0) return res.json({ best: null, top5: [] })

  const top5 = rows.map((r, i) => ({
    ...r,
    rank: i + 1,
    interview_answers: JSON.parse(r.interview_answers || '[]'),
    score_pct: r.max_score ? Math.round((r.interview_score / r.max_score) * 100) : 0,
    completion_time_formatted: formatTime(r.completion_time_seconds || 0),
    recommendation: i === 0
      ? 'Cel mai potrivit candidat - recomandat pentru interviu final'
      : `Alternativa #${i + 1}`,
  }))

  res.json({ best: top5[0], top5 })
})

// GET /api/admin/applicant/:id — single applicant detail
app.get('/api/admin/applicant/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM applicants WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json({
    ...row,
    interview_answers: JSON.parse(row.interview_answers || '[]'),
    score_pct: row.max_score ? Math.round((row.interview_score / row.max_score) * 100) : 0,
    completion_time_formatted: formatTime(row.completion_time_seconds || 0),
  })
})

// Helper: calculate avg score per question
function getAverageByQuestion() {
  const rows = db.prepare('SELECT interview_answers FROM applicants').all()
  if (rows.length === 0) return []

  const questionTotals = {}
  const questionCounts = {}

  for (const row of rows) {
    const answers = JSON.parse(row.interview_answers || '[]')
    for (const a of answers) {
      if (!questionTotals[a.question]) {
        questionTotals[a.question] = 0
        questionCounts[a.question] = 0
      }
      questionTotals[a.question] += a.points
      questionCounts[a.question]++
    }
  }

  return Object.keys(questionTotals).map((q) => ({
    question: q,
    avgScore: Math.round((questionTotals[q] / questionCounts[q]) * 10) / 10,
    maxPoints: 5,
    responses: questionCounts[q],
  }))
}

// ── Email HTML builder ──
function buildEmailHtml(form, answers, score, maxScore, classification, label, completionTime) {
  const answerRows = answers
    .map(
      (a, i) => `
    <tr>
      <td style="padding:8px;border:1px solid #e5e7eb;">${i + 1}. ${a.question}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;">${a.selectedAnswer}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${a.points}/${a.maxPoints}</td>
    </tr>`
    )
    .join('')

  return `
  <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
    <div style="background:#111827;color:#fff;padding:24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:22px;">Aplicare noua - Proiectant Mobilier</h1>
      <p style="margin:8px 0 0;opacity:0.8;">Clasificare: <strong style="font-size:18px;">${classification}</strong> - ${label}</p>
    </div>
    <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;">
      <h2 style="margin:0 0 16px;color:#111827;">Date Personale</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:6px 0;color:#6b7280;width:200px;">Nume complet</td><td><strong>${form.fullName}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Telefon</td><td>${form.phone}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td>${form.email}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Oras</td><td>${form.city || '-'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Experienta totala</td><td>${form.experienceYears} ani</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Experienta Corpus</td><td>${form.corpusYears} ani</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Rol actual</td><td>${form.currentRole || '-'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Salariu dorit</td><td>${form.expectedSalary || '-'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Disponibil din</td><td>${form.availableFrom || '-'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Portfolio</td><td>${form.portfolio || '-'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">LinkedIn</td><td>${form.linkedin || '-'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Relocare</td><td>${form.relocate ? 'Da' : 'Nu'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Timp completare</td><td>${formatTime(completionTime || 0)}</td></tr>
      </table>

      <h2 style="margin:0 0 8px;color:#111827;">Motivatie</h2>
      <p style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e5e7eb;">${form.motivation}</p>

      <h2 style="margin:24px 0 12px;color:#111827;">Rezultate Mini-Interviu</h2>
      <div style="background:${classification === 'A' ? '#dcfce7' : classification === 'B' ? '#fef9c3' : classification === 'C' ? '#fed7aa' : '#fecaca'};padding:16px;border-radius:8px;margin-bottom:16px;text-align:center;">
        <div style="font-size:32px;font-weight:bold;">${score}/${maxScore}</div>
        <div style="font-size:14px;margin-top:4px;">Clasificare: <strong>${classification}</strong> - ${label}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Intrebare</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Raspuns</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;">Punctaj</th>
          </tr>
        </thead>
        <tbody>${answerRows}</tbody>
      </table>
    </div>
    <div style="background:#f8fafc;padding:16px;text-align:center;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;">
      <p style="margin:0;color:#6b7280;font-size:13px;">Trimis automat de Kuziini Recruitment App</p>
    </div>
  </div>`
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Kuziini Recruitment API running on http://localhost:${PORT}`)
})
