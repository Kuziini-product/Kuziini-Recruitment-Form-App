import { getDb, initDb, formatTime } from '../db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await initDb()
    const sql = getDb()

    const [{ count: total }] = await sql`SELECT COUNT(*)::int as count FROM applicants`

    const byClass = await sql`
      SELECT classification, COUNT(*)::int as count
      FROM applicants GROUP BY classification ORDER BY classification
    `

    const [{ avg: avgScore }] = await sql`SELECT COALESCE(AVG(interview_score), 0) as avg FROM applicants`
    const [{ avg: avgTime }] = await sql`SELECT COALESCE(AVG(completion_time_seconds), 0)::int as avg FROM applicants`

    const scoreDistribution = await sql`
      SELECT
        CASE
          WHEN (interview_score * 100.0 / NULLIF(max_score, 0)) >= 80 THEN '80-100%'
          WHEN (interview_score * 100.0 / NULLIF(max_score, 0)) >= 60 THEN '60-79%'
          WHEN (interview_score * 100.0 / NULLIF(max_score, 0)) >= 40 THEN '40-59%'
          ELSE '0-39%'
        END as range,
        COUNT(*)::int as count
      FROM applicants GROUP BY range ORDER BY range DESC
    `

    const recentApplicants = await sql`
      SELECT id, full_name, classification, interview_score, max_score, completion_time_seconds, created_at
      FROM applicants ORDER BY created_at DESC LIMIT 5
    `

    // Avg per question
    const allAnswers = await sql`SELECT interview_answers FROM applicants`
    const questionTotals = {}
    const questionCounts = {}

    for (const row of allAnswers) {
      const answers = typeof row.interview_answers === 'string'
        ? JSON.parse(row.interview_answers)
        : row.interview_answers || []
      for (const a of answers) {
        if (!questionTotals[a.question]) {
          questionTotals[a.question] = 0
          questionCounts[a.question] = 0
        }
        questionTotals[a.question] += a.points
        questionCounts[a.question]++
      }
    }

    const avgByQuestion = Object.keys(questionTotals).map((q) => ({
      question: q,
      avgScore: Math.round((questionTotals[q] / questionCounts[q]) * 10) / 10,
      maxPoints: 5,
      responses: questionCounts[q],
    }))

    res.json({
      total,
      byClassification: byClass,
      avgScore: Math.round(Number(avgScore) * 10) / 10,
      avgCompletionTime: Math.round(Number(avgTime)),
      avgCompletionTimeFormatted: formatTime(Math.round(Number(avgTime))),
      scoreDistribution,
      avgByQuestion,
      recentApplicants: recentApplicants.map(r => ({
        ...r,
        score_pct: r.max_score ? Math.round((r.interview_score / r.max_score) * 100) : 0,
        completion_time_formatted: formatTime(r.completion_time_seconds || 0),
      })),
    })
  } catch (err) {
    console.error('Admin stats error:', err)
    res.status(500).json({ error: err.message })
  }
}
