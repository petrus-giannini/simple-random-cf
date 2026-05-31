// ════════════════════════════════════════════════════════════════════════════
//  GENERATORE CODICE FISCALE ITALIANO
//  Regole ufficiali Agenzia delle Entrate
// ════════════════════════════════════════════════════════════════════════════

// ── Dati anagrafici ──────────────────────────────────────────────────────────

const NOMI_M = [
  "MARIO","LUIGI","GIUSEPPE","ANTONIO","GIOVANNI","ROBERTO","STEFANO","MARCO",
  "LUCA","ANDREA","DAVIDE","MATTEO","ALESSANDRO","SIMONE","FRANCO","SERGIO",
  "CARLO","RICCARDO","PAOLO","ANGELO","PIETRO","ENRICO","GIORGIO","CLAUDIO",
  "MASSIMO","VINCENZO","EMANUELE","NICOLA","FILIPPO","TOMMASO"
];

const NOMI_F = [
  "MARIA","ANNA","GIUSEPPINA","ROSA","ANGELA","LUCIA","TERESA","CARMELA",
  "GIOVANNA","ELENA","LAURA","FRANCESCA","GIULIA","SARA","VALENTINA",
  "CHIARA","ALESSIA","SOFIA","GIORGIA","FEDERICA","ROBERTA","PAOLA",
  "MARINA","SERENA","MONICA","BARBARA","CRISTINA","DANIELA","ELISA","IRENE"
];

const COGNOMI = [
  "ROSSI","FERRARI","RUSSO","ESPOSITO","BIANCHI","ROMANO","COLOMBO","RICCI",
  "MARINO","GRECO","BRUNO","GALLO","CONTI","DELUCA","MANCINI","COSTA",
  "GIORDANO","RIZZO","LOMBARDI","MORETTI","BARBIERI","FONTANA","SANTORO",
  "MARINI","RINALDI","CARUSO","FERRARA","GALLI","MARTINI","LEONE","LONGO",
  "GENTILE","MARTINELLI","VITALE","LOMBARDO","SERRA","COPPOLA","DEROSA",
  "PELLEGRINI","PALUMBO","FERRETTI","FERRARO","SILVESTRI","MAZZA","VALENTINI",
  "GIULIANI","MONTI","PIRAS","RIVA","CATTANEO"
];

const COMUNI = [
  { codice: "H501" }, // Roma
  { codice: "F205" }, // Milano
  { codice: "L736" }, // Napoli
  { codice: "A944" }, // Torino
  { codice: "D969" }, // Genova
  { codice: "A662" }, // Bologna
  { codice: "L219" }, // Firenze
  { codice: "L682" }, // Venezia
  { codice: "G273" }, // Palermo
  { codice: "C352" }, // Catania
  { codice: "B157" }, // Bari
  { codice: "L378" }, // Trieste
  { codice: "E379" }, // Verona
  { codice: "G482" }, // Pescara
  { codice: "H223" }, // Parma
  { codice: "C129" }, // Cagliari
  { codice: "D284" }, // Ferrara
  { codice: "G388" }, // Perugia
  { codice: "I628" }, // Salerno
  { codice: "L424" }, // Udine
];

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

  // Imposta il numero massimo dello slider in base ai temi disponibili
  slider.max = THEMES.length - 1;

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

    // Genera e mostra il CF
    const cf = generaCodiceFiscale();
    output.value = cf;
    output.classList.add("has-value", "flashing");
    setTimeout(() => output.classList.remove("flashing"), 400);
  });

  // Copia negli appunti
  copyBtn.addEventListener("click", () => {
    if (!output.value) return;
    navigator.clipboard.writeText(output.value).then(() => {
      tooltip.classList.add("show");
      setTimeout(() => tooltip.classList.remove("show"), 1500);
    }).catch(() => {
      // Fallback per browser che non supportano clipboard API
      output.select();
      document.execCommand("copy");
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
});
