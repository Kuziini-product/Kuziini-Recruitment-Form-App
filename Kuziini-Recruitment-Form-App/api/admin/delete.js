import { getDb, initDb } from '../db.js'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing id' })

  try {
    await initDb()
    const sql = getDb()
    await sql`DELETE FROM applicants WHERE id = ${id}`
    res.json({ success: true })
  } catch (err) {
    console.error('Delete error:', err)
    res.status(500).json({ error: err.message })
  }
}
