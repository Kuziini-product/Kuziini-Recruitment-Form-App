import { getDb, initDb, formatTime } from '../db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing id' })

  try {
    await initDb()
    const sql = getDb()

    const [row] = await sql`SELECT * FROM applicants WHERE id = ${id}`
    if (!row) return res.status(404).json({ error: 'Not found' })

    res.json({
      ...row,
      interview_answers: typeof row.interview_answers === 'string' ? JSON.parse(row.interview_answers) : row.interview_answers,
      score_pct: row.max_score ? Math.round((row.interview_score / row.max_score) * 100) : 0,
      completion_time_formatted: formatTime(row.completion_time_seconds || 0),
    })
  } catch (err) {
    console.error('Admin applicant detail error:', err)
    res.status(500).json({ error: err.message })
  }
}
