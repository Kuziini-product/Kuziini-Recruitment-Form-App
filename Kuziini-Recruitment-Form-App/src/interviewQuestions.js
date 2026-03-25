/**
 * Mini-interviu cu intrebari grila pentru clasificarea candidatilor.
 * Doua sectiuni: Tehnic + Kuziini Brand.
 */

// ── Sectiunea 1: Intrebari Tehnice (grila standard) ──
export const technicalQuestions = [
  {
    id: 1,
    question: 'Care este nivelul tau de cunoastere in Corpus Solutions 3D?',
    options: [
      { text: 'Am lucrat extensiv (3+ ani), inclusiv configurari complexe si biblioteci custom', points: 5 },
      { text: 'Am experienta medie (1-3 ani), proiecte de bucatarii si mobilier standard', points: 3 },
      { text: 'Am cunostinte de baza, am folosit-o ocazional', points: 1 },
      { text: 'Nu am lucrat in Corpus Solutions, dar am experienta in alte programe CAD', points: 0 },
    ],
  },
  {
    id: 2,
    question: 'Cum generezi de obicei listele de materiale si accesorii pentru productie?',
    options: [
      { text: 'Export automat din Corpus cu verificare manuala a fiecarui element', points: 5 },
      { text: 'Folosesc export-ul standard din Corpus fara modificari', points: 3 },
      { text: 'Creez listele manual in Excel pe baza desenelor', points: 1 },
      { text: 'Nu am generat liste de materiale pana acum', points: 0 },
    ],
  },
  {
    id: 3,
    question: 'Ce tip de mobilier ai proiectat cel mai frecvent?',
    options: [
      { text: 'Bucatarii complete, dressinguri, mobilier baie — proiecte complexe cu accesorii premium', points: 5 },
      { text: 'Mobilier de bucatarie standard si corpuri individuale', points: 3 },
      { text: 'Mobilier simplu: rafturi, dulapuri de hol, birouri', points: 1 },
      { text: 'Nu am proiectat mobilier, dar am cunostinte teoretice', points: 0 },
    ],
  },
  {
    id: 4,
    question: 'Cum abordezi o situatie in care clientul cere o configuratie care nu este fezabila tehnic?',
    options: [
      { text: 'Propun alternativa tehnica argumentata, cu schita comparativa si costuri', points: 5 },
      { text: 'Explic verbal de ce nu se poate si sugerez o alternativa', points: 3 },
      { text: 'Trimit cererea catre seful de echipa pentru decizie', points: 1 },
      { text: 'Incerc sa fac exact ce cere clientul', points: 0 },
    ],
  },
  {
    id: 5,
    question: 'Care este experienta ta cu accesorii de mobilier (balamale, glisiere, sisteme de ridicare)?',
    options: [
      { text: 'Cunosc foarte bine gamele Blum, Hettich, Grass — stiu sa aleg accesoriul potrivit pentru fiecare aplicatie', points: 5 },
      { text: 'Am lucrat cu 1-2 branduri si stiu sa configurez balamale si glisiere standard', points: 3 },
      { text: 'Am cunostinte de baza, folosesc ce e standard in proiect', points: 1 },
      { text: 'Nu am experienta cu accesorii specifice', points: 0 },
    ],
  },
  {
    id: 6,
    question: 'Cum iti organizezi munca cand ai mai multe proiecte simultane?',
    options: [
      { text: 'Prioritizez dupa deadline si complexitate, folosesc un sistem de tracking (digital/fizic)', points: 5 },
      { text: 'Lucrez pe fiecare proiect pe rand, in ordinea primirii', points: 3 },
      { text: 'Ma concentrez pe proiectul cel mai urgent si il termin inainte de a incepe altul', points: 2 },
      { text: 'Lucrez simultan la toate, avansand putin cate putin', points: 1 },
    ],
  },
]

// ── Sectiunea 2: Intrebari Kuziini Brand ──
// type: 'choice' = grila normala, 'hearts' = rating cu inimioare (1-5), 'scale' = scala 1-10
export const kuziiniQuestions = [
  {
    id: 'k1',
    question: 'Stii ce este Kuziini?',
    type: 'choice',
    options: [
      { text: 'Da, cunosc brandul foarte bine — am urmarit proiectele si activitatea lor', points: 5 },
      { text: 'Da, am auzit de Kuziini si stiu ca se ocupa cu mobilier premium', points: 3 },
      { text: 'Am auzit numele, dar nu stiu detalii', points: 1 },
      { text: 'Nu, nu am auzit de Kuziini pana acum', points: 0 },
    ],
  },
  {
    id: 'k2',
    question: 'Cat de mult iti plac proiectele Kuziini?',
    type: 'hearts',
    maxHearts: 5,
    pointsPerHeart: 1, // 1-5 points
  },
  {
    id: 'k3',
    question: 'Ai recomanda Kuziini prietenilor sau colegilor?',
    type: 'choice',
    options: [
      { text: 'Absolut, deja am recomandat sau as recomanda oricand', points: 5 },
      { text: 'Da, as recomanda daca cineva ar cauta mobilier de calitate', points: 3 },
      { text: 'Poate, depinde de context', points: 1 },
      { text: 'Nu stiu suficient despre Kuziini ca sa recomand', points: 0 },
    ],
  },
  {
    id: 'k4',
    question: 'Cat de tare iti doresti sa faci parte din echipa Kuziini?',
    type: 'hearts',
    maxHearts: 5,
    pointsPerHeart: 1, // 1-5 points
  },
]

export const TECH_MAX_SCORE = technicalQuestions.reduce(
  (sum, q) => sum + Math.max(...q.options.map((o) => o.points)),
  0
)

export const KUZIINI_MAX_SCORE = kuziiniQuestions.reduce((sum, q) => {
  if (q.type === 'hearts') return sum + q.maxHearts * q.pointsPerHeart
  return sum + Math.max(...q.options.map((o) => o.points))
}, 0)

export const TOTAL_MAX_SCORE = TECH_MAX_SCORE + KUZIINI_MAX_SCORE
