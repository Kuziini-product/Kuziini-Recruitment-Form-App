export default async function handler(req, res) {
  const { id, email, reason } = req.query

  // If reason provided, save it and show confirmation
  if (reason) {
    const dbUrl = process.env.DATABASE_URL || process.env.Recrutment_DATABASE_URL || process.env.Recrutment_POSTGRES_URL
    if (dbUrl && id) {
      try {
        const { getDb, initDb } = await import('./db.js')
        await initDb()
        const sql = getDb()
        await sql`UPDATE applicants SET status = 'quit', motivation = ${decodeURIComponent(reason)} WHERE id = ${id}`
      } catch {}
    }

    res.setHeader('Content-Type', 'text/html')
    return res.send(`
      <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Kuziini Recruitment</title></head>
      <body style="font-family:Arial;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f6f8;margin:0;">
        <div style="text-align:center;max-width:500px;padding:40px;">
          <h1 style="color:#111827;">Multumim pentru feedback!</h1>
          <p style="color:#6b7280;">Am inregistrat motivul tau. Iti dorim mult succes in continuare!</p>
          <p style="color:#9ca3af;font-size:13px;">— Echipa Kuziini</p>
        </div>
      </body></html>
    `)
  }

  // Show quit form (asking for reason)
  res.setHeader('Content-Type', 'text/html')
  res.send(`
    <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Renunta - Kuziini Recruitment</title>
    <style>
      body { font-family:Arial; display:flex; align-items:center; justify-content:center; min-height:100vh; background:#f5f6f8; margin:0; }
      .box { text-align:center; max-width:500px; padding:40px; background:#fff; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.08); }
      textarea { width:100%; min-height:120px; padding:14px; border:2px solid #d1d5db; border-radius:8px; font-family:inherit; font-size:15px; margin:16px 0; resize:vertical; box-sizing:border-box; }
      textarea:focus { border-color:#c9a84c; outline:none; }
      button { padding:14px 32px; background:#c9a84c; color:#111; border:none; font-weight:bold; font-size:14px; cursor:pointer; border-radius:4px; letter-spacing:1px; }
      button:hover { background:#b8922f; }
    </style></head>
    <body>
      <div class="box">
        <h1 style="color:#111827;font-size:22px;">Ne pare rau ca pleci</h1>
        <p style="color:#6b7280;">Te rugam sa ne spui motivul pentru care renunti la aplicare:</p>
        <form onsubmit="window.location='/api/quit?id=${id || ''}&email=${encodeURIComponent(email || '')}&reason='+encodeURIComponent(document.getElementById('r').value);return false;">
          <textarea id="r" placeholder="Scrie motivul aici..." required></textarea>
          <button type="submit">TRIMITE SI RENUNTA</button>
        </form>
      </div>
    </body></html>
  `)
}
