# Kuziini Recruitment Form App

Aplicație React + Vite pregătită pentru publicare și pentru integrare ca pagină de aplicare la job.

## Ce conține
- formular de aplicare pentru postul de Proiectant Mobilier – Corpus Solution 3D
- validare de bază
- ecran de confirmare după trimitere
- structură pregătită pentru integrare ulterioară cu:
  - Formspree
  - Supabase
  - Firebase
  - Google Sheets / email webhook

## Pornire locală
```bash
npm install
npm run dev
```

## Build producție
```bash
npm install
npm run build
npm run preview
```

## GitHub push
În folderul proiectului:
```bash
git init
git branch -M main
git remote add origin https://github.com/Kuziini-product/Kuziini-Recruitment-Form-App.git
git add .
git commit -m "Initial commit - Kuziini Recruitment Form App"
git push -u origin main
```

## Deploy recomandat
- Vercel
- Netlify

## Link recomandat după deploy
- careers.kuziini.ro/proiectant-corpus
- sau subdomeniu de tip recruit.kuziini.ro

## Următorul pas recomandat
Conectarea butonului `Trimite aplicarea` la o bază reală de date sau la email.
