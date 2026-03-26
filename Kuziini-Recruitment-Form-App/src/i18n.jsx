import { createContext, useContext, useState } from 'react'

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('kuziini_lang') || 'ro')
  function toggle() {
    const next = lang === 'ro' ? 'en' : 'ro'
    setLang(next)
    localStorage.setItem('kuziini_lang', next)
  }
  return <LangContext.Provider value={{ lang, setLang, toggle }}>{children}</LangContext.Provider>
}

export function useLang() { return useContext(LangContext) }

export function LangToggle() {
  const { lang, toggle } = useLang()
  return (
    <button className="lang-toggle" onClick={toggle} title={lang === 'ro' ? 'Switch to English' : 'Schimba in Romana'}>
      {lang === 'ro' ? (
        <svg viewBox="0 0 36 24" width="28" height="18"><rect width="12" height="24" fill="#002B7F"/><rect x="12" width="12" height="24" fill="#FCD116"/><rect x="24" width="12" height="24" fill="#CE1126"/></svg>
      ) : (
        <svg viewBox="0 0 36 24" width="28" height="18"><rect width="36" height="24" fill="#00247d"/><path d="M0,0 L36,24 M36,0 L0,24" stroke="#fff" strokeWidth="4"/><path d="M0,0 L36,24 M36,0 L0,24" stroke="#cf142b" strokeWidth="2.5"/><path d="M18,0 V24 M0,12 H36" stroke="#fff" strokeWidth="6"/><path d="M18,0 V24 M0,12 H36" stroke="#cf142b" strokeWidth="3.5"/></svg>
      )}
    </button>
  )
}

// ══════════════════════════════════════════════════
//  TRANSLATIONS
// ══════════════════════════════════════════════════

const t = {
  // ── Welcome page ──
  welcomeTitle: { ro: 'Aplica pentru rolul de Proiectant Mobilier', en: 'Apply for Furniture Designer Position' },
  welcomeSub: { ro: 'Alege atmosfera potrivita', en: 'Choose your atmosphere' },
  welcomeStart: { ro: 'Incepe aplicarea', en: 'Start Application' },
  installBtn: { ro: 'Instaleaza pe desktop', en: 'Install on desktop' },

  // ── Form labels ──
  formLead: { ro: 'Cautam un profesionist cu experienta reala in proiectare mobilier si lucru in Corpus Solutions 3D.', en: 'We are looking for a professional with real experience in furniture design and Corpus Solutions 3D.' },
  labelGender: { ro: 'Gen', en: 'Gender' },
  genderM: { ro: 'Masculin', en: 'Male' },
  genderF: { ro: 'Feminin', en: 'Female' },
  genderO: { ro: 'Prefer sa nu spun', en: 'Prefer not to say' },
  labelAge: { ro: 'Varsta', en: 'Age' },
  labelName: { ro: 'Nume complet', en: 'Full name' },
  labelPhone: { ro: 'Telefon', en: 'Phone' },
  labelEmail: { ro: 'Email', en: 'Email' },
  labelCity: { ro: 'Oras', en: 'City' },
  labelExperience: { ro: 'Ani experienta totala', en: 'Total years of experience' },
  labelCorpusYears: { ro: 'Ani experienta Corpus Solutions', en: 'Years of Corpus Solutions experience' },
  labelCurrentRole: { ro: 'Rol actual', en: 'Current role' },
  labelPortfolio: { ro: 'Link portfolio (optional)', en: 'Portfolio link (optional)' },
  labelLinkedin: { ro: 'LinkedIn (optional)', en: 'LinkedIn (optional)' },
  labelMotivation: { ro: 'De ce vrei sa lucrezi cu noi?', en: 'Why do you want to work with us?' },
  labelSalary: { ro: 'Salariu dorit (RON net)', en: 'Expected salary (RON net)' },
  labelAvailable: { ro: 'Disponibil din', en: 'Available from' },
  labelRelocate: { ro: 'Sunt dispus sa ma reloc', en: 'I am willing to relocate' },
  labelGdpr: { ro: 'Sunt de acord cu prelucrarea datelor personale conform GDPR', en: 'I agree to the processing of personal data according to GDPR' },
  labelPhoto: { ro: 'Fotografie (optional)', en: 'Photo (optional)' },
  labelCv: { ro: 'CV (optional)', en: 'CV (optional)' },
  uploadClick: { ro: 'Click pentru a incarca', en: 'Click to upload' },
  uploadHintCv: { ro: 'PDF, DOC — max 10 MB', en: 'PDF, DOC — max 10 MB' },
  uploadHintPhoto: { ro: 'JPG, PNG — max 5 MB', en: 'JPG, PNG — max 5 MB' },
  btnConfirm: { ro: 'Confirma si continua', en: 'Confirm and continue' },

  // ── Form validation ──
  errGender: { ro: 'Selecteaza genul.', en: 'Select your gender.' },
  errAge: { ro: 'Introdu varsta.', en: 'Enter your age.' },
  errName: { ro: 'Numele este obligatoriu.', en: 'Name is required.' },
  errPhone: { ro: 'Telefonul este obligatoriu.', en: 'Phone is required.' },
  errEmail: { ro: 'Email-ul este obligatoriu.', en: 'Email is required.' },
  errEmailInvalid: { ro: 'Adresa de email nu este valida.', en: 'Email address is not valid.' },
  errCity: { ro: 'Orasul este obligatoriu.', en: 'City is required.' },
  errExperience: { ro: 'Experienta totala este obligatorie.', en: 'Total experience is required.' },
  errCorpus: { ro: 'Experienta in Corpus este obligatorie.', en: 'Corpus experience is required.' },
  errRole: { ro: 'Rolul actual este obligatoriu.', en: 'Current role is required.' },
  errAvailable: { ro: 'Disponibilitatea este obligatorie.', en: 'Availability is required.' },
  errSalary: { ro: 'Salariul dorit este obligatoriu.', en: 'Expected salary is required.' },
  errMotivation: { ro: 'Motivatia este obligatorie.', en: 'Motivation is required.' },
  errGdpr: { ro: 'Acordul GDPR este obligatoriu.', en: 'GDPR consent is required.' },

  // ── CV Prompt ──
  cvForgot: { ro: 'Ai uitat CV-ul!', en: 'You forgot your CV!' },
  cvBoost: { ro: 'sanse mai mari sa fie selectati pentru interviu. Incarca-l acum!', en: 'higher chance of being selected for an interview. Upload it now!' },
  cvContinueWithout: { ro: 'Continua fara CV', en: 'Continue without CV' },
  cvContinueWith: { ro: 'Continua cu CV', en: 'Continue with CV' },
  cvContinue: { ro: 'Continua', en: 'Continue' },

  // ── Interview ──
  interviewTitle: { ro: 'Mini-Interviu', en: 'Mini-Interview' },
  interviewSub: { ro: 'Raspunde la urmatoarele intrebari pentru a ne ajuta sa evaluam profilul tau.', en: 'Answer the following questions to help us evaluate your profile.' },
  interviewQ: { ro: 'Intrebarea', en: 'Question' },
  interviewOf: { ro: 'din', en: 'of' },
  interviewNext: { ro: 'Urmatoarea', en: 'Next' },
  interviewFinish: { ro: 'Finalizeaza', en: 'Submit' },
  interviewSending: { ro: 'Se trimite aplicarea...', en: 'Submitting application...' },
  interviewSendErr: { ro: 'Eroare la trimitere', en: 'Submission error' },
  sectionTech: { ro: 'Evaluare Tehnica', en: 'Technical Evaluation' },
  sectionPersonality: { ro: 'Personalitate', en: 'Personality' },
  sectionKuziini: { ro: 'Despre Kuziini', en: 'About Kuziini' },

  // ── Portfolio upload ──
  congratsTitle: { ro: 'Felicitari!', en: 'Congratulations!' },
  congratsSub: { ro: 'Ai obtinut un scor excelent! Poti incarca optional un portofoliu sau CV pentru a-ti consolida aplicarea.', en: 'You got an excellent score! You can optionally upload a portfolio or CV to strengthen your application.' },
  uploadFile: { ro: 'Click pentru a incarca un fisier', en: 'Click to upload a file' },
  uploadHintPortfolio: { ro: 'PDF, DOC, ZIP, JPG — max 10 MB', en: 'PDF, DOC, ZIP, JPG — max 10 MB' },
  skipUpload: { ro: 'Sari peste', en: 'Skip' },
  sendWithPortfolio: { ro: 'Trimite cu portofoliu', en: 'Submit with portfolio' },
  sendApplication: { ro: 'Trimite aplicarea', en: 'Submit application' },

  // ── Success page ──
  thankYou: { ro: 'Multumim!', en: 'Thank you!' },
  thankYouMsg1: { ro: 'iti multumeste ca ai aplicat pentru pozitia de Proiectant Mobilier. Vom evalua solicitarea ta si vom reveni cu un raspuns in cel mai scurt timp.', en: 'thanks you for applying for the Furniture Designer position. We will evaluate your application and get back to you as soon as possible.' },
  thankYouMsg2: { ro: 'Iti dorim o zi frumoasa!', en: 'Have a wonderful day!' },
  backToHome: { ro: 'Inapoi la pagina principala', en: 'Back to home page' },

  // ── Sidebar ──
  sidebarProduction: { ro: 'Productie', en: 'Production' },
  sidebarContact: { ro: 'Contact', en: 'Contact' },
  sidebarExperience: { ro: 'Intra in universul Kuziini', en: 'Enter the Kuziini universe' },

  // ── Music genres ──
  genreClassical: { ro: 'Clasica', en: 'Classical' },
  genreLofi: { ro: 'Lo-Fi', en: 'Lo-Fi' },
  genreJazz: { ro: 'Jazz', en: 'Jazz' },

  // ── Hobby options ──
  hobbySport: { ro: 'Sport', en: 'Sports' },
  hobbyStudy: { ro: 'Studiu', en: 'Study' },
  hobbyTravel: { ro: 'Calatorit', en: 'Travel' },
  hobbyMovies: { ro: 'Filme', en: 'Movies' },
  hobbyNone: { ro: 'Nu am hobby', en: 'No hobby' },
  hobbyCustom: { ro: 'Personalizat', en: 'Custom' },
  hobbyPlaceholder: { ro: 'Scrie hobby-ul tau...', en: 'Write your hobby...' },
}

// Interview questions translations
export const questionsI18n = {
  q1: { ro: 'Care este nivelul tau de cunoastere in Corpus Solutions 3D?', en: 'What is your level of knowledge in Corpus Solutions 3D?' },
  q1o1: { ro: 'Am lucrat extensiv (3+ ani), inclusiv configurari complexe si biblioteci custom', en: 'I have worked extensively (3+ years), including complex configurations and custom libraries' },
  q1o2: { ro: 'Am experienta medie (1-3 ani), proiecte de bucatarii si mobilier standard', en: 'I have medium experience (1-3 years), kitchen and standard furniture projects' },
  q1o3: { ro: 'L-am folosit ocazional', en: 'I used it occasionally' },
  q1o4: { ro: 'Nu am lucrat in Corpus Solutions, dar am experienta in alte programe CAD', en: 'I haven\'t worked in Corpus Solutions, but I have experience with other CAD software' },

  q2: { ro: 'Cum generezi de obicei listele de materiale si accesorii pentru productie?', en: 'How do you usually generate material and accessory lists for production?' },
  q2o1: { ro: 'Export automat din Corpus cu verificare manuala a fiecarui element', en: 'Automatic export from Corpus with manual verification of each element' },
  q2o2: { ro: 'Folosesc export-ul standard din Corpus fara modificari', en: 'I use the standard Corpus export without modifications' },
  q2o3: { ro: 'Creez listele manual in Excel pe baza desenelor', en: 'I create lists manually in Excel based on drawings' },
  q2o4: { ro: 'Nu am generat liste de materiale pana acum', en: 'I haven\'t generated material lists yet' },

  q3: { ro: 'Ce tip de mobilier ai proiectat cel mai frecvent?', en: 'What type of furniture have you designed most frequently?' },
  q3o1: { ro: 'Bucatarii complete, dressinguri, mobilier baie — proiecte complexe cu accesorii premium', en: 'Complete kitchens, wardrobes, bathroom furniture — complex projects with premium accessories' },
  q3o2: { ro: 'Mobilier de bucatarie standard si corpuri individuale', en: 'Standard kitchen furniture and individual cabinets' },
  q3o3: { ro: 'Mobilier simplu: rafturi, dulapuri de hol, birouri', en: 'Simple furniture: shelves, hallway cabinets, desks' },
  q3o4: { ro: 'Nu am proiectat mobilier, dar am cunostinte teoretice', en: 'I haven\'t designed furniture, but I have theoretical knowledge' },

  qHobby: { ro: 'Care este hobby-ul tau preferat?', en: 'What is your favorite hobby?' },

  q4: { ro: 'Cum abordezi o situatie in care clientul cere o configuratie care nu este fezabila tehnic?', en: 'How do you handle a situation where the client requests a technically unfeasible configuration?' },
  q4o1: { ro: 'Propun alternativa tehnica argumentata, cu schita comparativa si costuri', en: 'I propose a reasoned technical alternative, with comparative sketch and costs' },
  q4o2: { ro: 'Explic verbal de ce nu se poate si sugerez o alternativa', en: 'I verbally explain why it\'s not possible and suggest an alternative' },
  q4o3: { ro: 'Trimit cererea catre seful de echipa pentru decizie', en: 'I send the request to the team leader for a decision' },
  q4o4: { ro: 'Incerc sa fac exact ce cere clientul', en: 'I try to do exactly what the client asks' },

  q5: { ro: 'Care este experienta ta cu accesorii de mobilier (balamale, glisiere, sisteme de ridicare)?', en: 'What is your experience with furniture accessories (hinges, slides, lift systems)?' },
  q5o1: { ro: 'Cunosc foarte bine gamele Blum, Hettich, Grass — stiu sa aleg accesoriul potrivit pentru fiecare aplicatie', en: 'I know the Blum, Hettich, Grass ranges very well — I know how to choose the right accessory for each application' },
  q5o2: { ro: 'Am lucrat cu 1-2 branduri si stiu sa configurez balamale si glisiere standard', en: 'I have worked with 1-2 brands and know how to configure standard hinges and slides' },
  q5o3: { ro: 'Am cunostinte de baza, folosesc ce e standard in proiect', en: 'I have basic knowledge, I use what\'s standard in the project' },
  q5o4: { ro: 'Nu am experienta cu accesorii specifice', en: 'I have no experience with specific accessories' },

  q6: { ro: 'Cum iti organizezi munca cand ai mai multe proiecte simultane?', en: 'How do you organize your work when you have multiple simultaneous projects?' },
  q6o1: { ro: 'Prioritizez dupa deadline si complexitate, folosesc un sistem de tracking (digital/fizic)', en: 'I prioritize by deadline and complexity, using a tracking system (digital/physical)' },
  q6o2: { ro: 'Lucrez pe fiecare proiect pe rand, in ordinea primirii', en: 'I work on each project in turn, in the order received' },
  q6o3: { ro: 'Ma concentrez pe proiectul cel mai urgent si il termin inainte de a incepe altul', en: 'I focus on the most urgent project and finish it before starting another' },
  q6o4: { ro: 'Lucrez simultan la toate, avansand putin cate putin', en: 'I work on all of them simultaneously, advancing little by little' },

  k1: { ro: 'Stii ce este Kuziini?', en: 'Do you know what Kuziini is?' },
  k1o1: { ro: 'Da, cunosc brandul foarte bine — am urmarit proiectele si activitatea lor', en: 'Yes, I know the brand very well — I have followed their projects and activity' },
  k1o2: { ro: 'Da, am auzit de Kuziini si stiu ca se ocupa cu mobilier premium', en: 'Yes, I have heard of Kuziini and know they deal with premium furniture' },
  k1o3: { ro: 'Am auzit numele, dar nu stiu detalii', en: 'I have heard the name, but I don\'t know details' },
  k1o4: { ro: 'Nu, nu am auzit de Kuziini pana acum', en: 'No, I haven\'t heard of Kuziini until now' },

  k2: { ro: 'Cat de mult iti plac proiectele Kuziini?', en: 'How much do you like Kuziini projects?' },
  k3: { ro: 'Ai recomanda Kuziini prietenilor sau colegilor?', en: 'Would you recommend Kuziini to friends or colleagues?' },
  k3o1: { ro: 'Absolut, deja am recomandat sau as recomanda oricand', en: 'Absolutely, I have already recommended or would recommend anytime' },
  k3o2: { ro: 'Da, as recomanda daca cineva ar cauta mobilier de calitate', en: 'Yes, I would recommend if someone was looking for quality furniture' },
  k3o3: { ro: 'Poate, depinde de context', en: 'Maybe, depends on the context' },
  k3o4: { ro: 'Nu stiu suficient despre Kuziini ca sa recomand', en: 'I don\'t know enough about Kuziini to recommend' },

  k4: { ro: 'Cat de tare iti doresti sa faci parte din echipa Kuziini?', en: 'How much do you want to be part of the Kuziini team?' },

  // Hobby options (used by MiniInterview hobbyKeys mapping)
  hobbySport: { ro: 'Sport', en: 'Sports' },
  hobbyStudy: { ro: 'Studiu', en: 'Study' },
  hobbyTravel: { ro: 'Calatorit', en: 'Travel' },
  hobbyMovies: { ro: 'Filme', en: 'Movies' },
  hobbyNone: { ro: 'Nu am hobby', en: 'No hobby' },
  hobbyCustom: { ro: 'Personalizat', en: 'Custom' },
}

export function useT() {
  const { lang } = useLang()
  return (key) => {
    if (t[key]) return t[key][lang] || t[key].ro
    return key
  }
}

export function useQT() {
  const { lang } = useLang()
  return (key) => {
    if (questionsI18n[key]) return questionsI18n[key][lang] || questionsI18n[key].ro
    return key
  }
}
