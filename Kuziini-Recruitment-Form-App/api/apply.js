import { classifyApplicant, analyzeApplicant } from './db.js'
import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { formData, interviewAnswers, interviewScore, maxScore, completionTimeSeconds } = req.body
    const { classification, label } = classifyApplicant(interviewScore, maxScore)
    const aiAnalysis = analyzeApplicant(formData, interviewAnswers)

    let insertedId = null
    let isReturning = false
    let attemptNumber = 1

    const dbUrl = process.env.DATABASE_URL || process.env.Recrutment_DATABASE_URL || process.env.Recrutment_POSTGRES_URL
    if (dbUrl) {
      try {
        const { getDb, initDb } = await import('./db.js')
        await initDb()
        const sql = getDb()

        // Check if applicant already exists (by email)
        const existing = await sql`SELECT id, COUNT(*)::int as attempts FROM applicants WHERE email = ${formData.email} GROUP BY id ORDER BY id LIMIT 1`
        if (existing.length > 0) {
          isReturning = true
          const total = await sql`SELECT COUNT(*)::int as c FROM applicants WHERE email = ${formData.email}`
          attemptNumber = (total[0]?.c || 0) + 1
        }

        const [row] = await sql`
          INSERT INTO applicants
            (full_name, phone, email, gender, music_genre, city, experience_years, corpus_years,
             "current_role", portfolio_link, linkedin, motivation,
             expected_salary, available_from, relocate, has_cv, has_photo,
             tour_visited, tour_time_seconds,
             interview_answers, interview_score, max_score, classification, ai_analysis,
             completion_time_seconds, attempt_number)
          VALUES
            (${formData.fullName}, ${formData.phone}, ${formData.email},
             ${formData.gender || ''}, ${formData.musicGenre || ''},
             ${formData.city || ''}, ${formData.experienceYears}, ${formData.corpusYears},
             ${formData.currentRole || ''}, ${formData.portfolio || ''}, ${formData.linkedin || ''},
             ${formData.motivation}, ${formData.expectedSalary || ''}, ${formData.availableFrom || ''},
             ${!!formData.relocate}, ${!!formData.hasCv}, ${!!formData.hasPhoto},
             ${!!formData.tourVisited}, ${formData.tourTimeSeconds || 0},
             ${JSON.stringify(interviewAnswers)}, ${interviewScore}, ${maxScore},
             ${classification}, ${aiAnalysis}, ${completionTimeSeconds || 0}, ${attemptNumber})
          RETURNING id
        `
        insertedId = row.id
      } catch (dbErr) {
        console.error('DB save failed:', dbErr.message)
      }
    }

    // Send email
    try {
      let transporter
      if (process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        })
      } else {
        const testAccount = await nodemailer.createTestAccount()
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email', port: 587, secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        })
      }

      const returningNote = isReturning ? `<div style="background:#fef3c7;padding:12px;border-radius:8px;margin-bottom:16px;"><strong>Atentie:</strong> Acest aplicant a mai aplicat anterior (aplicarea #${attemptNumber}).</div>` : ''

      const info = await transporter.sendMail({
        from: '"Kuziini Recruitment" <noreply@kuziini.ro>',
        to: 'my@kuziini.ro',
        subject: `[${classification}]${isReturning ? ' [RE-APLICARE]' : ''} ${formData.fullName} - Proiectant Mobilier`,
        html: buildEmailHtml(formData, interviewAnswers, interviewScore, maxScore, classification, label, completionTimeSeconds, aiAnalysis, returningNote),
      })
      const previewUrl = nodemailer.getTestMessageUrl(info)
      if (previewUrl) console.log('Email preview:', previewUrl)
    } catch (emailErr) {
      console.error('Email failed:', emailErr.message)
    }

    res.json({
      success: true,
      id: insertedId,
      classification,
      classificationLabel: label,
      score: interviewScore,
      maxScore,
      isReturning,
      attemptNumber,
      aiAnalysis,
    })
  } catch (err) {
    console.error('Apply error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

function buildEmailHtml(form, answers, score, maxScore, classification, label, completionTime, aiAnalysis, returningNote) {
  const answerRows = answers.map((a, i) => `
    <tr>
      <td style="padding:8px;border:1px solid #e5e7eb;">${i + 1}. ${a.question}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;">${a.selectedAnswer}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${a.points}/${a.maxPoints}</td>
    </tr>`).join('')

  const fmtTime = (() => { const m = Math.floor((completionTime || 0) / 60); const s = (completionTime || 0) % 60; return m > 0 ? `${m}m ${s}s` : `${s}s` })()

  return `
  <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
    <div style="background:#111827;color:#fff;padding:24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:22px;">Aplicare noua - Proiectant Mobilier</h1>
      <p style="margin:8px 0 0;opacity:0.8;">Clasificare: <strong style="font-size:18px;">${classification}</strong> - ${label}</p>
    </div>
    <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;">
      ${returningNote}
      <h2 style="margin:0 0 16px;color:#111827;">Date Personale</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:6px 0;color:#6b7280;width:200px;">Nume</td><td><strong>${form.fullName}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Gen</td><td>${form.gender || '-'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Gen muzical</td><td>${form.musicGenre || '-'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Telefon</td><td>${form.phone}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td>${form.email}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Oras</td><td>${form.city || '-'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Exp. totala</td><td>${form.experienceYears} ani</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Exp. Corpus</td><td>${form.corpusYears} ani</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Salariu dorit</td><td>${form.expectedSalary || '-'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">CV atasat</td><td>${form.hasCv ? 'Da' : 'Nu'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Foto atasata</td><td>${form.hasPhoto ? 'Da' : 'Nu'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Timp completare</td><td>${fmtTime}</td></tr>
      </table>
      <h2 style="margin:0 0 8px;color:#111827;">Motivatie</h2>
      <p style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e5e7eb;">${form.motivation}</p>

      ${aiAnalysis ? `<h2 style="margin:24px 0 8px;color:#111827;">Analiza AI</h2>
      <p style="background:#f0fdf4;padding:16px;border-radius:8px;border:1px solid #bbf7d0;color:#166534;">${aiAnalysis}</p>` : ''}

      <h2 style="margin:24px 0 12px;color:#111827;">Rezultate Mini-Interviu</h2>
      <div style="background:${classification === 'A' ? '#dcfce7' : classification === 'B' ? '#fef9c3' : classification === 'C' ? '#fed7aa' : '#fecaca'};padding:16px;border-radius:8px;margin-bottom:16px;text-align:center;">
        <div style="font-size:32px;font-weight:bold;">${score}/${maxScore}</div>
        <div style="font-size:14px;margin-top:4px;">${classification} - ${label}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Intrebare</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Raspuns</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;">Punctaj</th>
        </tr></thead>
        <tbody>${answerRows}</tbody>
      </table>
    </div>
    <div style="background:#f8fafc;padding:16px;text-align:center;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;">
      <p style="margin:0;color:#6b7280;font-size:13px;">Kuziini Recruitment App</p>
    </div>
  </div>`
}
