import { getDb, initDb, formatTime } from '../db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await initDb()
    const sql = getDb()

    const rows = await sql`
      SELECT *,
        (interview_score * 1.0 / NULLIF(max_score, 0)) as score_ratio
      FROM applicants
      ORDER BY score_ratio DESC NULLS LAST, completion_time_seconds ASC, created_at ASC
      LIMIT 5
    `

    if (rows.length === 0) return res.json({ best: null, top5: [] })

    const top5 = rows.map((r, i) => ({
      ...r,
      rank: i + 1,
      interview_answers: typeof r.interview_answers === 'string' ? JSON.parse(r.interview_answers) : r.interview_answers,
      score_pct: r.max_score ? Math.round((r.interview_score / r.max_score) * 100) : 0,
      completion_time_formatted: formatTime(r.completion_time_seconds || 0),
      recommendation: i === 0
        ? 'Cel mai potrivit candidat - recomandat pentru interviu final'
        : `Alternativa #${i + 1}`,
    }))

    res.json({ best: top5[0], top5 })
  } catch (err) {
    console.error('Admin best error:', err)
    res.status(500).json({ error: err.message })
  }
}
