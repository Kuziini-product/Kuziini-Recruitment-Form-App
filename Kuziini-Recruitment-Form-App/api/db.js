import { neon } from '@neondatabase/serverless'

let sql

export function getDb() {
  if (!sql) {
    const dbUrl = process.env.DATABASE_URL || process.env.Recrutment_DATABASE_URL || process.env.Recrutment_POSTGRES_URL
    if (!dbUrl) throw new Error('DATABASE_URL not configured')
    sql = neon(dbUrl)
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
      gender TEXT DEFAULT '',
      music_genre TEXT DEFAULT '',
      city TEXT DEFAULT '',
      experience_years TEXT DEFAULT '',
      corpus_years TEXT DEFAULT '',
      "current_role" TEXT DEFAULT '',
      portfolio_link TEXT DEFAULT '',
      portfolio_file TEXT DEFAULT '',
      linkedin TEXT DEFAULT '',
      motivation TEXT DEFAULT '',
      expected_salary TEXT DEFAULT '',
      available_from TEXT DEFAULT '',
      relocate BOOLEAN DEFAULT false,
      has_cv BOOLEAN DEFAULT false,
      has_photo BOOLEAN DEFAULT false,
      interview_answers JSONB DEFAULT '[]',
      interview_score INTEGER DEFAULT 0,
      max_score INTEGER DEFAULT 0,
      classification TEXT DEFAULT 'C',
      ai_analysis TEXT DEFAULT '',
      completion_time_seconds INTEGER DEFAULT 0,
      attempt_number INTEGER DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `
  // Add columns if missing (migration)
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'applicants'`
  const colNames = cols.map(c => c.column_name)
  if (!colNames.includes('gender')) await sql`ALTER TABLE applicants ADD COLUMN gender TEXT DEFAULT ''`
  if (!colNames.includes('music_genre')) await sql`ALTER TABLE applicants ADD COLUMN music_genre TEXT DEFAULT ''`
  if (!colNames.includes('has_cv')) await sql`ALTER TABLE applicants ADD COLUMN has_cv BOOLEAN DEFAULT false`
  if (!colNames.includes('has_photo')) await sql`ALTER TABLE applicants ADD COLUMN has_photo BOOLEAN DEFAULT false`
  if (!colNames.includes('ai_analysis')) await sql`ALTER TABLE applicants ADD COLUMN ai_analysis TEXT DEFAULT ''`
  if (!colNames.includes('attempt_number')) await sql`ALTER TABLE applicants ADD COLUMN attempt_number INTEGER DEFAULT 1`
  if (!colNames.includes('tour_visited')) await sql`ALTER TABLE applicants ADD COLUMN tour_visited BOOLEAN DEFAULT false`
  if (!colNames.includes('tour_time_seconds')) await sql`ALTER TABLE applicants ADD COLUMN tour_time_seconds INTEGER DEFAULT 0`
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

// AI personality analysis based on choices
export function analyzeApplicant(formData, answers) {
  const traits = []
  const hobby = answers.find(a => a.type === 'hobby')
  const musicGenre = formData.musicGenre || ''

  // Music analysis
  if (musicGenre === 'classical') traits.push('Apreciaza estetica si perfectiunea - profil analitic')
  else if (musicGenre === 'lofi') traits.push('Relaxat si concentrat - profil creativ si adaptabil')
  else if (musicGenre === 'jazz') traits.push('Deschis la improvizatie si spontaneitate - profil flexibil')

  // Hobby analysis
  if (hobby) {
    const h = hobby.selectedAnswer.toLowerCase()
    if (h.includes('sport')) traits.push('Disciplinat si competitiv - bun pentru deadline-uri')
    else if (h.includes('studiu')) traits.push('Curios si dedicat invatarii continue - se va adapta rapid')
    else if (h.includes('calatorit')) traits.push('Deschis la experienta noi si perspective diverse')
    else if (h.includes('filme')) traits.push('Atent la detalii vizuale si povestire - bun pentru prezentari')
    else if (h.includes('nu am')) traits.push('Concentrat exclusiv pe munca - risc de burnout')
    else if (h.includes('personalizat')) traits.push('Creativ si independent - isi urmeaza propriile pasiuni')
  }

  // Answer consistency check
  const techScores = answers.filter(a => a.type === 'choice' || !a.type).map(a => a.points)
  const allSame = techScores.length > 2 && techScores.every(s => s === techScores[0])
  if (allSame) traits.push('ATENTIE: Raspunsuri identice - posibil selectate la intamplare')

  // Check if always picked first option (after shuffle - would be random points)
  // Tour visit
  if (formData.tourVisited) {
    const tourTime = formData.tourTimeSeconds || 0
    if (tourTime > 120) { traits.push(`A explorat turul virtual ${Math.floor(tourTime/60)}m — interes real pentru spatiul Kuziini`); profile.score += 3 }
    else if (tourTime > 30) { traits.push('A vizitat turul virtual — curiozitate activa'); profile.score += 1 }
    else { traits.push('A deschis turul virtual dar a stat putin — curiozitate superficiala') }
  }

  const hasWrittenMotivation = (formData.motivation || '').length > 100
  if (hasWrittenMotivation) traits.push('Motivatie detaliata - candidat serios si implicat')

  const scorePct = answers.reduce((s, a) => s + a.points, 0) / Math.max(answers.reduce((s, a) => s + (a.maxPoints || 5), 0), 1) * 100
  if (scorePct >= 80 && musicGenre && hobby?.selectedAnswer !== 'Nu am hobby')
    traits.push('Profil complet si echilibrat - RECOMANDARE PUTERNICA')

  return traits.join('. ') + '.'
}
