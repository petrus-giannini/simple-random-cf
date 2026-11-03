// ════════════════════════════════════════════════════════════════════════════
//  GENERATORE CODICE FISCALE ITALIANO
//  Regole ufficiali Agenzia delle Entrate
// ════════════════════════════════════════════════════════════════════════════

// ── Dati anagrafici (caricati da file CSV nella root del sito) ───────────────

const FILE_NOMI_M  = "nomi_maschili.csv";
const FILE_NOMI_F  = "nomi_femminili.csv";
const FILE_COGNOMI = "cognomi.csv";
const FILE_COMUNI  = "COMUNI.csv"; // intestazioni: "Denominazione IT";"Codice AT"

let NOMI_M = [];
let NOMI_F = [];
let COGNOMI = [];
let COMUNI = []; // { nome, codice }

/**
 * Scarica un CSV (separatore ";", prima riga = intestazioni) e restituisce
 * le righe come array di array di celle.
 */
async function caricaCsv(url) {
  const risposta = await fetch(url, { cache: "no-cache" });
  if (!risposta.ok) throw new Error(url + ": HTTP " + risposta.status);
  const testo = (await risposta.text()).replace(/^\uFEFF/, "");
  return testo
    .split(/\r?\n/)
    .slice(1) // intestazioni
    .filter(riga => riga.trim() !== "")
    .map(riga => riga.split(";").map(c => c.trim()));
}

async function caricaDati() {
  const [nomiM, nomiF, cognomi, comuni] = await Promise.all([
    caricaCsv(FILE_NOMI_M),
    caricaCsv(FILE_NOMI_F),
    caricaCsv(FILE_COGNOMI),
    caricaCsv(FILE_COMUNI)
  ]);

  NOMI_M  = nomiM.map(r => r[0]).filter(Boolean);
  NOMI_F  = nomiF.map(r => r[0]).filter(Boolean);
  COGNOMI = cognomi.map(r => r[0]).filter(Boolean);

  // Si scartano i codici non validi (es. "ND" = non disponibile)
  COMUNI = comuni
    .map(r => ({ nome: r[0], codice: r[1] }))
    .filter(c => /^[A-Z]\d{3}$/.test(c.codice));

  if (!NOMI_M.length || !NOMI_F.length || !COGNOMI.length || !COMUNI.length) {
    throw new Error("Uno o più file CSV sono vuoti");
  }
}

const MESI = "ABCDEHLMPRST"; // Tabella mesi ufficiale

// Tabella caratteri di controllo — posizioni dispari (1-based: 1,3,5,...)
const DISPARI = {
  '0':1,'1':0,'2':5,'3':7,'4':9,'5':13,'6':15,'7':17,'8':19,'9':21,
  'A':1,'B':0,'C':5,'D':7,'E':9,'F':13,'G':15,'H':17,'I':19,'J':21,
  'K':2,'L':4,'M':18,'N':20,'O':11,'P':3,'Q':6,'R':8,'S':12,'T':14,
  'U':16,'V':10,'W':22,'X':25,'Y':24,'Z':23
};

// Tabella caratteri di controllo — posizioni pari (2-based: 2,4,6,...)
const PARI = {
  '0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,
  'A':0,'B':1,'C':2,'D':3,'E':4,'F':5,'G':6,'H':7,'I':8,'J':9,
  'K':10,'L':11,'M':12,'N':13,'O':14,'P':15,'Q':16,'R':17,'S':18,'T':19,
  'U':20,'V':21,'W':22,'X':23,'Y':24,'Z':25
};

// ── Utility ──────────────────────────────────────────────────────────────────

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Normalizza un nome/cognome per il calcolo del CF: maiuscolo, senza accenti,
 * senza spazi, apostrofi, trattini o altri caratteri non alfabetici.
 */
function normalizza(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

function estraiVocali(s) {
  return s.replace(/[^AEIOU]/g, '');
}

function estraiConsonanti(s) {
  return s.replace(/[^BCDFGHJKLMNPQRSTVWXYZ]/g, '');
}

// ── Codifica delle singole parti ─────────────────────────────────────────────

/**
 * Codifica cognome: consonanti + vocali + X (fino a 3 caratteri)
 */
function codificaCognome(cognome) {
  cognome = normalizza(cognome);
  const c = estraiConsonanti(cognome);
  const v = estraiVocali(cognome);
  return (c + v + "XXX").slice(0, 3);
}

/**
 * Codifica nome:
 *  - se le consonanti sono >= 4: usa la 1ª, 3ª e 4ª consonante
 *  - altrimenti: consonanti + vocali + X (fino a 3)
 */
function codificaNome(nome) {
  nome = normalizza(nome);
  const c = estraiConsonanti(nome);
  const v = estraiVocali(nome);
  if (c.length >= 4) {
    return c[0] + c[2] + c[3];
  }
  return (c + v + "XXX").slice(0, 3);
}

/**
 * Codifica anno: ultime 2 cifre
 */
function codificaAnno(anno) {
  return String(anno).slice(-2);
}

/**
 * Codifica mese: lettera dalla tabella ufficiale (A=gen, B=feb, ...)
 */
function codificaMese(mese) {
  return MESI[mese - 1]; // mese: 1-12
}

/**
 * Codifica giorno: giorno del mese (+40 per le donne), zero-padded
 */
function codificaGiorno(giorno, sesso) {
  const g = sesso === 'F' ? giorno + 40 : giorno;
  return String(g).padStart(2, '0');
}

/**
 * Calcola il carattere di controllo (16° carattere)
 */
function calcolaCarattereControllo(cf15) {
  let somma = 0;
  for (let i = 0; i < 15; i++) {
    const c = cf15[i];
    // posizioni 1,3,5,... (indici 0,2,4,...) → tabella DISPARI
    somma += (i % 2 === 0) ? DISPARI[c] : PARI[c];
  }
  return String.fromCharCode(65 + (somma % 26));
}

// ── Generatore principale ────────────────────────────────────────────────────

/**
 * Genera un codice fiscale italiano casuale valido secondo le regole ufficiali
 */
function generaCodiceFiscale() {
  const sesso = Math.random() < 0.5 ? 'M' : 'F';
  const nome    = sesso === 'M' ? rand(NOMI_M) : rand(NOMI_F);
  const cognome = rand(COGNOMI);
  const anno    = randInt(1950, 2005);
  const mese    = randInt(1, 12);

  // Giorni per mese (con gestione anno bisestile)
  const giorniPerMese = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (anno % 4 === 0 && (anno % 100 !== 0 || anno % 400 === 0)) {
    giorniPerMese[1] = 29;
  }
  const giorno = randInt(1, giorniPerMese[mese - 1]);

  const comune = rand(COMUNI);

  // Assemblaggio delle 15 parti + carattere di controllo
  const parteCognome = codificaCognome(cognome);
  const parteNome    = codificaNome(nome);
  const parteAnno    = codificaAnno(anno);
  const parteMese    = codificaMese(mese);
  const parteGiorno  = codificaGiorno(giorno, sesso);
  const parteComune  = comune.codice;

  const cf15 = parteCognome + parteNome + parteAnno + parteMese + parteGiorno + parteComune;
  const carattereControllo = calcolaCarattereControllo(cf15);

  return cf15 + carattereControllo;
}

// ════════════════════════════════════════════════════════════════════════════
//  THEME SWITCHER
// ════════════════════════════════════════════════════════════════════════════

const THEMES = ["acido", "stalingrado", "classico-chiaro", "classico-scuro"];

const THEME_LABELS = {
  "acido":           "Acido",
  "stalingrado":     "Stalingrado",
  "classico-chiaro": "Classico Chiaro",
  "classico-scuro":  "Classico Scuro"
};

let currentThemeIndex = 0;

function applyTheme(index) {
  const theme = THEMES[index];
  document.body.className = "theme-" + theme;
  document.getElementById("theme-label").textContent = THEME_LABELS[theme];
  document.getElementById("theme-slider").value = index;
  currentThemeIndex = index;
}

// ════════════════════════════════════════════════════════════════════════════
//  UI — EVENT LISTENERS
// ════════════════════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  const output   = document.getElementById("cf-output");
  const genBtn   = document.getElementById("gen-btn");
  const copyBtn  = document.getElementById("copy-btn");
  const tooltip  = document.getElementById("copy-tooltip");
  const slider   = document.getElementById("theme-slider");

  const keepBox  = document.getElementById("keep-memory");
  const keepCount = document.getElementById("keep-count");
  const spacer   = document.getElementById("scroll-spacer");

  // Imposta il numero massimo dello slider in base ai temi disponibili
  slider.max = THEMES.length - 1;

  let altezzaSpacer = 0; // spazio aggiunto in fondo per consentire lo scorrimento

  function righe() {
    return output.value === "" ? [] : output.value.split("\n");
  }

  function aggiornaContatore() {
    const n = righe().length;
    keepCount.textContent = (keepBox.checked && n) ? "(" + n + ")" : "";
  }

  // Adatta l'altezza del box al numero di righe
  function adattaAltezza() {
    output.style.height = "auto";
    const bordi = output.offsetHeight - output.clientHeight;
    output.style.height = (output.scrollHeight + bordi) + "px";
  }

  /**
   * Esegue la modifica e poi fa scorrere la pagina in modo che il pulsante
   * "Genera" resti nella stessa posizione sullo schermo (e quindi sotto il mouse).
   */
  function mantieniPulsanteFermo(modifica) {
    const prima = genBtn.getBoundingClientRect().top;
    modifica();
    const delta = genBtn.getBoundingClientRect().top - prima;
    if (delta === 0) return;

    // Se la pagina non è abbastanza lunga per scorrere, si aggiunge spazio in fondo
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const mancante = window.scrollY + delta - max;
    if (mancante > 0) {
      altezzaSpacer += mancante;
      spacer.style.height = altezzaSpacer + "px";
    }
    window.scrollBy({ top: delta, left: 0, behavior: "instant" });
  }

  // Riporta la pagina allo stato iniziale: box vuoto, nessuno spazio extra, scroll in cima
  function ripristinaStatoIniziale() {
    output.value = "";
    output.classList.remove("has-value");
    output.style.height = "";
    altezzaSpacer = 0;
    spacer.style.height = "0px";
    aggiornaContatore();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }

  keepBox.addEventListener("change", aggiornaContatore);

  // Genera CF al click del pulsante
  genBtn.addEventListener("click", function (e) {
    // Effetto ripple
    const rect   = this.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.classList.add("ripple");
    const size   = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px
    `;
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    const cf = generaCodiceFiscale();

    mantieniPulsanteFermo(() => {
      // Con "Conserva" attivo il nuovo CF va a capo nel box, altrimenti lo sostituisce
      output.value = (keepBox.checked && output.value !== "") ? output.value + "\n" + cf : cf;
      output.classList.add("has-value");
      adattaAltezza();
    });

    aggiornaContatore();
  });

  // Copia negli appunti: copia il contenuto del box, poi lo svuota e riporta la pagina all'inizio
  copyBtn.addEventListener("click", () => {
    if (!output.value) return;
    const testo = output.value;

    const fatto = () => {
      tooltip.classList.add("show");
      setTimeout(() => tooltip.classList.remove("show"), 1500);
      ripristinaStatoIniziale();
    };

    navigator.clipboard.writeText(testo).then(fatto).catch(() => {
      // Fallback per browser senza Clipboard API
      output.select();
      document.execCommand("copy");
      fatto();
    });
  });

  // Selezione automatica al click sul campo
  output.addEventListener("click", () => {
    if (output.value) output.select();
  });

  // Cambio tema tramite slider
  slider.addEventListener("input", () => {
    applyTheme(parseInt(slider.value, 10));
  });

  // Tema iniziale
  applyTheme(0);

  // Caricamento dei dati dai file CSV: il pulsante resta disabilitato fino al termine
  const placeholderOriginale = output.placeholder;
  genBtn.disabled = true;
  output.placeholder = "Caricamento dati…";
  caricaDati()
    .then(() => {
      genBtn.disabled = false;
      output.placeholder = placeholderOriginale;
    })
    .catch(err => {
      console.error("Errore nel caricamento dei CSV:", err);
      output.placeholder = "Errore: dati non caricati (serve un server web)";
    });
});
