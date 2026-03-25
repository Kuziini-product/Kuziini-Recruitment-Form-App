import { getDb, initDb, formatTime } from '../db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await initDb()
    const sql = getDb()

    const rows = await sql`SELECT * FROM applicants ORDER BY created_at DESC`

    const parsed = rows.map((r) => ({
      ...r,
      interview_answers: typeof r.interview_answers === 'string' ? JSON.parse(r.interview_answers) : r.interview_answers,
      score_pct: r.max_score ? Math.round((r.interview_score / r.max_score) * 100) : 0,
      completion_time_formatted: formatTime(r.completion_time_seconds || 0),
    }))

    res.json(parsed)
  } catch (err) {
    console.error('Admin applicants error:', err)
    res.status(500).json({ error: err.message })
  }
}
