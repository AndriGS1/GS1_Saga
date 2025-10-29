/* --------------------v5.5--------------------- */
/* --------------------------------------------- */
/* ------------- VARIABILI GLOBALI ------------- */
/* --------------------------------------------- */
const $ = (el) => document.querySelector(el);
const $$ = (el) => document.querySelectorAll(el);

// verifica se il device è touch o non lo è
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
// prevengo il comportamento di drag nativo su immagini e link
addEventListener('dragstart', (e) => e.preventDefault());

/* -------------------------------------- */
/* -------- PATH HELPERS (GS1_Saga) ----- */
/* -------------------------------------- */
// HTML sta in /is/, assets stanno nella root del repo
const ROOT = "../"; // percorso dalla pagina /is/ alla root del repo

// Converte qualsiasi path tipo "/media/svg/...", "../media/img/...", "media/video/..."
// in uno valido per la tua struttura: "../svg/...", "../img/...", "../video/..."
function normalizePath(p) {
  if (!p) return p;
  if (/^https?:\/\//i.test(p)) return p; // già assoluto

  // strip leading ./ o / o ../ (le gestiamo noi con ROOT)
  let q = String(p).replace(/^\.\//, '').replace(/^\/+/, '');
  // mappa "media/<type>/" -> "<type>/"
  q = q.replace(/^(\.\.\/)+/g, ''); // togli ../ in input, aggiungiamo ROOT comunque
  q = q.replace(/^media\/(svg|img|video)\//, (_, t) => `${t}/`);

  // se dopo la normalizzazione parte con uno dei tipi noti, ok
  if (/^(svg|img|video|json)\//.test(q)) {
    return ROOT + q;
  }
  // fallback: aggiungi ROOT così almeno è relativo alla root
  return ROOT + q;
}

// Aggiorna asset-URL anche dentro HTML (popup text, ecc.)
function rewriteHtmlAssets(html) {
  if (!html) return html;

  // 1) media/... -> <type>/...
  html = html.replace(
    /(src|href)=["'](?:\.\/|\/|..\/)?media\/(svg|img|video)\/([^"']+)["']/gi,
    (_, attr, kind, rest) => `${attr}="${ROOT}${kind}/${rest}"`
  );

  // 2) nudi <type>/... (senza ROOT) -> prefix con ROOT
  html = html.replace(
    /(src|href)=["'](svg|img|video|json)\/([^"']+)["']/gi,
    (_, attr, kind, rest) => `${attr}="${ROOT}${kind}/${rest}"`
  );

  return html;
}

/* -------------------------------------- */
/* -------- PORTRAIT / LANDSCAPE? ------- */
/* -------------------------------------- */
const aside = $('aside');

if (isTouch) {
  // verico la visualizzazione al caricamento della pagina
  addEventListener('DOMContentLoaded', () => {
    if (window.innerHeight < window.innerWidth && window.innerWidth < 768) {
      // Modalità landscape
      aside.classList.remove('from-bottom');
    }
  });

  // Gestione del cambiamento di orientamento
  addEventListener('orientationchange', () => {
    window.location.reload(); // ricarico la pagina per evitare problemi di resizing
    aside.classList.toggle('from-bottom');
  });
}

/* -------------------------------------- */
/* -------- RECUPERO I CONTENUTI -------- */
/* -------------------------------------- */
const language = document.documentElement.getAttribute('lang');
let contents; // array con tutti i contenuti dinamici 
let sceneTot; // capitoli totali

(async () => {
  try {
    // aggiungo il timestamp dell'ora, in modo da bypassare la cache
    const response = await fetch(`${ROOT}json/${language}.json?${Date.now()}`);
    contents = await response.json();

    // recupero i capitoli totali
    sceneTot = contents.length;
  } catch (error) {
    console.error('impossibile recuperare i contenuti', error);
  }
})();

/* ------------------------------------------ */
/* --------- ELEMENTI PAGINA GLOBALI -------- */
/* ------------------------------------------ */
const tutorialArea = $('#tutorial');
const chapters = $('#chapters');
// subchapters
const subchapters = $('nav');
const tab = $('#toggleTab');
// tutorial button
const skipBtn = $('#skip');
// text content
const label = $('.chap-text small')
const title = $('#title');
// chapters controls
let activeBtn = $('.active');
const prevBtn = $('#prev');
const nextBtn = $('#next');
// popup plus controls
const plusArea = $('#popup-area');
const popupsBtn = $$('.plus-btn');
const popupsTxt = $$('#popup-area .popup-text');
// illustrations element
const video = $('video');
const videoBox = $('.videobox');

/* ------------------------------------------ */
/* ------------ EVENTI AL CLICK ------------- */
/* ------------------------------------------ */
const timing = 1600; // deve essere uguale "$change" nell'scss
const switchTime = timing * .33; // tempistica switch file video
let scene = 0; // counter attuale capitolo visionato
let subScene = 0; let actualSub = 0; // counters attuale sottocapitolo visionato
let clickSkip = 0; // counter utilizzi tutorial button

/* STEP1 TUTORIAL ------------------------------
--------------------------------------------- */
// crea la funzione di "switch" tra i tutorial tooltip
function tooltipOpen(el, direction) {
  // elimino la classe 'toggle' e 'pulse' in caso di restart del tutorial
  if (el.classList.contains('toggle')) el.classList.remove('toggle');

  // attivo l'animazione di entrata
  el.classList.remove(`${direction}`);

  // porto in primo piano l'area spiegata
  el.style.zIndex = 999;
  el.style.pointerEvents = 'none';
}

function tooltipClose(el) {
  el.classList.add('toggle');

  // lo nascondo sotto l'overlay
  el.style = '';
}

function tutorial() {
  tutorialArea.style.opacity = 1;
  tutorialArea.style.pointerEvents = 'auto';

  // mostro il pulsante di "skip"
  skipBtn.classList.remove('from-right');

  // rendo statici i bottoni "+"
  popupsBtn.forEach(btn => btn.classList.remove('pulse'));

  // rendo visibile il menù principale + tooltip
  tooltipOpen(chapters, 'from-bottom');
}

// gestore tutorial "next" & "start" tutorial button
function skip() {
  // Incremento il contatore
  clickSkip++;

  if (clickSkip == 1) {
    tooltipClose(chapters); // nascondo il precedente
    // Prima azione: rendo visibile il menù scene + tooltip
    tooltipOpen(subchapters, 'from-top');
  } else if (clickSkip == 2) {
    tooltipClose(subchapters); // nascondo il precedente
    // cambio testo da "next" a "start"
    skipBtn.querySelector('p').textContent = `${contents[0].start}`;
    // Seconda azione: rendo visibile l'icona "+" + tooltip
    tooltipOpen(plusArea, 'flush');
  } else if (clickSkip == 3) {
    tooltipClose(plusArea); // nascondo il precedente
    // Terza azione: nascondo l'area del tutorial e faccio pulsare i bottoni
    tutorialArea.style = '';
    popupsBtn.forEach(btn => btn.classList.add('pulse'));

    // nascondoo il pulsante di "skip"
    skipBtn.classList.add('from-right');

    // riporto il testo all'originale "next"
    setTimeout(() => skipBtn.querySelector('p').textContent = `${contents[0].next}`, 400);

    clickSkip = 0; // azzero il counter per poter far ripartire il tutorial
  }
};

/* STEP2 START ---------------------------------
--------------------------------------------- */
// gestore posizionamento "+" icon
function dynamicText() {
  // gestore scrittura label + titolo
  label.innerText = contents[scene].label;
  title.innerText = contents[scene].title;
  setTimeout(() => title.classList.add('switching'), 100);

  // inserisco il testo ed il posizionamento dei popup
  setTimeout(() => {
    const popups = ['popup1', 'popup2', 'popup3']; // Definiamo i popup
    popups.forEach((popup, i) => {
      const currentPopup = contents[scene].subchapters[subScene][popup];

      if (currentPopup) {
        // posizione
        popupsBtn[i].style.top = currentPopup.top;
        popupsBtn[i].style.left = currentPopup.left;
        // testo (con normalizzazione asset-URL)
        popupsTxt[i].innerHTML = rewriteHtmlAssets(currentPopup.text);
      } else {
        // Se non esiste, nascondiamo il pulsante
        popupsBtn[i].style.top = '-65px';
        popupsBtn[i].style.left = '-65px';
      }
    });
  }, switchTime);
}

// Inizalizzo la prima scena / capitolo
function start() {
  const opening = $('#opening');

  // verifico se il tutorial è già stato visionato
  const tutorialViewed = localStorage.getItem('tutorialGs1');

  dynamicText();

  // capisco se il tutorial è stato già visionato o meno
  if (!tutorialViewed) {
    tutorial()
  } else {
    // rendo visibile il menù principale
    chapters.classList.add('toggle');
    chapters.classList.remove('from-bottom');

    // nascondo i tootltip
    plusArea.classList.add('toggle');

    // rendo visibile il menù scene
    setTimeout(() => {
      subchapters.classList.add('toggle');
      subchapters.classList.remove('from-top');
    }, timing * .5);

    // rendo visibile l'icona "+"
    setTimeout(() => {
      popupsBtn.forEach(btn => btn.classList.add('pulse'));
      plusArea.classList.remove('flush');
    }, timing);
  }

  // nascondo il testo di apertura
  opening.classList.add('from-right');
  setTimeout(() => opening.classList.add('d-none'), 500);

  // animo il cambio dell'illustrazione iniziale
  videoBox.classList.add('change');
  videoBox.classList.remove('quick-left');

  // cambio il file video (normalizzato)
  setTimeout(() => {
    const src = contents[0]?.subchapters?.[0]?.src;
    video.src = normalizePath(src);
  }, switchTime);

  // creo tanti pallini quanto i capitoli
  const dots = $('#dots');

  for (let i = 0; i < sceneTot; i++) {
    const dot = document.createElement('span');
    dot.classList.add('b-pill');

    if (i == 0) dot.classList.add('bg-white');

    dots.appendChild(dot);
  }

  // creo un local storage che accerta la visione del tutorial
  localStorage.setItem('tutorialGs1', 'view');
}

/* STEP3 CHAPTERS CONTROLS ---------------------
--------------------------------------------- */
// gestore subchapter buttons status
function subBtnHandler(i) {
  const subBtn = $$('nav button');

  // nascondo i "popup buttons"
  plusArea.classList.add('flush');

  // cambio del pulsante "active"
  subBtn.forEach(btn => {
    btn.classList.remove('active');
    btn.disabled = true;
  });

  // Determino il bottone da rendere "active"
  const activeIndex = (i !== undefined) ? i : 0;

  setTimeout(() => {
    subBtn[activeIndex].classList.add('active');
  }, 100);

  // riattivo i sottocapitoli non "active"
  setTimeout(() => {
    subBtn.forEach(btn => {
      if (!btn.classList.contains('active')) {
        btn.disabled = false;
      }
    });

    // mostro i "popup buttons"
    plusArea.classList.remove('flush');
  }, timing);
};

// gestore chapter buttons status
function btnHandler() {
  nextBtn.disabled = scene >= sceneTot - 1;
  prevBtn.disabled = scene <= 0;
}; btnHandler();

function changeContent(i) {
  // Elimina le animazioni precedenti
  videoBox.classList.remove('change', 'change-inverse');
  // Determino l'indice da usare per subchapters
  subScene = (i !== undefined) ? i : 0;

  // coloro i "pallini" di navigazione
  const dots = $$('.chap-text span');

  // sposto la tab sul subchapters "active"
  tab.style.left = `${subScene * 33.33}%`

  dots.forEach(dot => dot.classList.remove('bg-white'));
  setTimeout(() => dots[scene].classList.add('bg-white'), 100);

  // Cambia il file video (normalizzato)
  setTimeout(() => {
    const src = contents[scene].subchapters[subScene].src;
    video.src = normalizePath(src);
  }, switchTime);

  // restart "scroll" interno popup
  popupsTxt.forEach(popup => popup.scrollTop = 0);
}

function toggleSubmenu() {
  // faccio uscire e rientrare il sottomenù
  subchapters.classList.add('from-top');
  setTimeout(() => subchapters.classList.remove('from-top'), timing / 2);
}

// bottoni di navigazione
function chapterNavigation(increment) {
  scene += increment;
  actualSub = 0;
  changeContent();
  toggleSubmenu();

  title.classList.remove('switching');
  dynamicText();

  // ruoto il video
  setTimeout(() => videoBox.classList.toggle(increment > 0 ? 'change' : 'change-inverse'), 100);
  subBtnHandler();
  btnHandler();
}

function prev() {
  chapterNavigation(-1);
}

function next() {
  chapterNavigation(1);
}


/* STEP4 SUBCHAPTERS CONTROLS ------------------
--------------------------------------------- */
// verifico anche che il sottocapitolo "active" sia disabilitato
let activeBtn = $('.active');
if (activeBtn) activeBtn.disabled = true;

function sub(i) {
  changeContent(i);
  subBtnHandler(i);

  // cambio i contenuti
  dynamicText();

  // ruoto verso sinistra
  setTimeout(() => {
    videoBox.classList.toggle(i > actualSub ? 'change' : 'change-inverse');
    actualSub = i;
  }, 100);
}
