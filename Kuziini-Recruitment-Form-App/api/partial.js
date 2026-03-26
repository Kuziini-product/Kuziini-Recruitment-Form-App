import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { formData } = req.body

    let insertedId = null
    const dbUrl = process.env.DATABASE_URL || process.env.Recrutment_DATABASE_URL || process.env.Recrutment_POSTGRES_URL

    if (dbUrl) {
      try {
        const { getDb, initDb } = await import('./db.js')
        await initDb()
        const sql = getDb()

        // Add status column if missing
        const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'applicants'`
        if (!cols.map(c => c.column_name).includes('status')) {
          await sql`ALTER TABLE applicants ADD COLUMN status TEXT DEFAULT 'completed'`
        }

        // Check if this email already has a partial entry
        const existing = await sql`SELECT id FROM applicants WHERE email = ${formData.email} AND status = 'partial' LIMIT 1`

        if (existing.length > 0) {
          // Update existing partial
          insertedId = existing[0].id
          await sql`UPDATE applicants SET
            full_name = ${formData.fullName}, phone = ${formData.phone},
            gender = ${formData.gender || ''}, music_genre = ${formData.musicGenre || ''},
            age = ${formData.age || ''}, city = ${formData.city || ''},
            experience_years = ${formData.experienceYears || ''},
            corpus_years = ${formData.corpusYears || ''},
            "current_role" = ${formData.currentRole || ''},
            expected_salary = ${formData.expectedSalary || ''},
            available_from = ${formData.availableFrom || ''},
            motivation = ${formData.motivation || ''},
            status = 'partial'
          WHERE id = ${insertedId}`
        } else {
          // Insert new partial
          const [row] = await sql`
            INSERT INTO applicants
              (full_name, phone, email, gender, music_genre, age, city,
               experience_years, corpus_years, "current_role", expected_salary,
               available_from, motivation, status, interview_score, max_score, classification)
            VALUES
              (${formData.fullName}, ${formData.phone}, ${formData.email},
               ${formData.gender || ''}, ${formData.musicGenre || ''}, ${formData.age || ''},
               ${formData.city || ''}, ${formData.experienceYears || ''},
               ${formData.corpusYears || ''}, ${formData.currentRole || ''},
               ${formData.expectedSalary || ''}, ${formData.availableFrom || ''},
               ${formData.motivation || ''}, 'partial', 0, 0, 'P')
            RETURNING id`
          insertedId = row.id
        }
      } catch (dbErr) {
        console.error('DB partial save failed:', dbErr.message)
      }
    }

    // Send abandon email to applicant
    try {
      const fromEmail = process.env.SMTP_USER || 'my@kuziini.ro'
      let transporter
      if (process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        })
      } else {
        const testAccount = await nodemailer.createTestAccount()
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email', port: 587, secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        })
      }

      const appUrl = 'https://kuziini-recruitment.vercel.app'

      // Email to applicant
      await transporter.sendMail({
        from: `"Echipa Kuziini" <${fromEmail}>`,
        to: formData.email,
        subject: 'Ai inceput aplicarea dar nu ai terminat - Kuziini Recruitment',
        html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#111827;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;color:#c9a84c;font-size:24px;">Hei, ${formData.fullName}!</h1>
          </div>
          <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;">
            <p style="font-size:16px;color:#374151;line-height:1.7;">
              Am observat ca ai inceput sa completezi formularul de aplicare pentru pozitia de
              <strong>Proiectant Mobilier</strong> la Kuziini, dar nu ai finalizat mini-interviul.
            </p>
            <p style="font-size:16px;color:#374151;line-height:1.7;">
              Suntem interesati de profilul tau! Ai dori sa continui aplicarea?
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${appUrl}" style="display:inline-block;padding:16px 36px;background:#c9a84c;color:#111;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:1px;margin-right:12px;border-radius:4px;">CONTINUA APLICAREA</a>
              <a href="${appUrl}/api/quit?id=${insertedId}&email=${encodeURIComponent(formData.email)}" style="display:inline-block;padding:16px 36px;background:#f3f4f6;color:#374151;text-decoration:none;font-size:14px;letter-spacing:1px;border:1px solid #d1d5db;border-radius:4px;">RENUNTA</a>
            </div>
            <p style="font-size:13px;color:#9ca3af;text-align:center;">
              Daca renunti, te vom ruga sa ne spui motivul.
            </p>
          </div>
          <div style="background:#f8fafc;padding:16px;text-align:center;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;">
            <p style="margin:0;color:#9ca3af;font-size:13px;">Echipa Kuziini Recruitment | my@kuziini.ro</p>
          </div>
        </div>`
      })

      // Notify admin
      await transporter.sendMail({
        from: `"Kuziini Recruitment" <${fromEmail}>`,
        to: 'my@kuziini.ro',
        subject: `[RENUNTAT] ${formData.fullName} - a abandonat mini-interviul`,
        html: `<div style="font-family:Arial;padding:24px;">
          <h2 style="color:#dc2626;">Aplicant care a renuntat la mini-interviu</h2>
          <p><strong>Nume:</strong> ${formData.fullName}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Telefon:</strong> ${formData.phone}</p>
          <p><strong>Oras:</strong> ${formData.city || '-'}</p>
          <p><strong>Experienta Corpus:</strong> ${formData.corpusYears || '-'} ani</p>
          <p style="color:#6b7280;font-size:13px;">Un email de follow-up a fost trimis automat.</p>
        </div>`
      })

    } catch (emailErr) {
      console.error('Abandon email failed:', emailErr.message)
    }

    res.json({ success: true, id: insertedId })
  } catch (err) {
    console.error('Partial save error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
