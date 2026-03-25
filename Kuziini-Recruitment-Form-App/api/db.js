import { neon } from '@neondatabase/serverless'

let sql

export function getDb() {
  if (!sql) {
    sql = neon(process.env.DATABASE_URL)
  }
  return sql
}

export async function initDb() {
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS applicants (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      city TEXT DEFAULT '',
      experience_years TEXT DEFAULT '',
      corpus_years TEXT DEFAULT '',
      current_role TEXT DEFAULT '',
      portfolio_link TEXT DEFAULT '',
      portfolio_file TEXT DEFAULT '',
      linkedin TEXT DEFAULT '',
      motivation TEXT DEFAULT '',
      expected_salary TEXT DEFAULT '',
      available_from TEXT DEFAULT '',
      relocate BOOLEAN DEFAULT false,
      interview_answers JSONB DEFAULT '[]',
      interview_score INTEGER DEFAULT 0,
      max_score INTEGER DEFAULT 0,
      classification TEXT DEFAULT 'C',
      completion_time_seconds INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `
}

export function classifyApplicant(score, maxScore) {
  const pct = (score / maxScore) * 100
  if (pct >= 80) return { classification: 'A', label: 'Excelent - Prioritate ridicata' }
  if (pct >= 60) return { classification: 'B', label: 'Bun - Potrivit pentru interviu' }
  if (pct >= 40) return { classification: 'C', label: 'Mediu - Necesita evaluare suplimentara' }
  return { classification: 'D', label: 'Sub asteptari - Nu se potriveste profilului' }
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
