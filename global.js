/* --------------------v5.6 (GS1 Ísland)--------------------- */
/* --------------------------------------------------------- */
/* ------------- GRUNNSTILLINGAR & AÐGERÐIR --------------- */
/* --------------------------------------------------------- */

const $ = (el) => document.querySelector(el);
const $$ = (el) => document.querySelectorAll(el);

// Greinir hvort tæki sé snertitæki
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
addEventListener('dragstart', (e) => e.preventDefault());

/* --------------------------------------------------------- */
/* -------------------- SLÓÐA-STILLINGAR -------------------- */
/* --------------------------------------------------------- */
// HTML skrárnar eru í /is/, assets í rót (img, svg, video, json)
const ROOT = "../";

// Lagar allar slóðir (../media/ → ../)
function normalizePath(p) {
  if (!p) return p;
  if (/^https?:\/\//i.test(p)) return p; // full slóð
  let q = String(p).replace(/^\.\//, '').replace(/^\/+/, '');
  q = q.replace(/^(\.\.\/)+/g, '');
  q = q.replace(/^media\//, '');
  return ROOT + q;
}

// Lagar slóðir inni í HTML texta (í popupum o.s.frv.)
function rewriteHtmlAssets(html) {
  if (!html) return html;
  html = html.replace(
    /(src|href)=["'](?:\.\/|\/|..\/)?media\/(svg|img|video)\/([^"']+)["']/gi,
    (_, attr, kind, rest) => `${attr}="${ROOT}${kind}/${rest}"`
  );
  return html;
}

/* --------------------------------------------------------- */
/* ------------------ LANDSCAPE / PORTRAIT ----------------- */
/* --------------------------------------------------------- */
const aside = $('aside');

if (isTouch) {
  addEventListener('DOMContentLoaded', () => {
    if (window.innerHeight < window.innerWidth && window.innerWidth < 768) {
      aside.classList.remove('from-bottom');
    }
  });
  addEventListener('orientationchange', () => {
    window.location.reload();
    aside.classList.toggle('from-bottom');
  });
}

/* --------------------------------------------------------- */
/* ------------------ HLEÐUR JSON EFNI ---------------------- */
/* --------------------------------------------------------- */
const language = document.documentElement.getAttribute('lang');
let contents;
let sceneTot;

(async () => {
  try {
    // hleður JSON úr /json/ möppu
    const response = await fetch(`../json/${language}.json?${Date.now()}`);
    contents = await response.json();
    sceneTot = contents.length;
  } catch (error) {
    console.error('impossible að hlaða efni (JSON fannst ekki)', error);
  }
})();

/* --------------------------------------------------------- */
/* ------------------- FASTAR OG BREYTUR -------------------- */
/* --------------------------------------------------------- */
const tutorialArea = $('#tutorial');
const chapters = $('#chapters');
const subchapters = $('nav');
const tab = $('#toggleTab');
const skipBtn = $('#skip');
const label = $('.chap-text small');
const title = $('#title');
const prevBtn = $('#prev');
const nextBtn = $('#next');
const plusArea = $('#popup-area');
const popupsBtn = $$('.plus-btn');
const popupsTxt = $$('#popup-area .popup-text');
const video = $('video');
const videoBox = $('.videobox');

const timing = 1600;
const switchTime = timing * 0.33;
let scene = 0;
let subScene = 0;
let actualSub = 0;
let clickSkip = 0;

/* --------------------------------------------------------- */
/* --------------------- TUTORIAL --------------------------- */
/* --------------------------------------------------------- */
function tooltipOpen(el, direction) {
  if (el.classList.contains('toggle')) el.classList.remove('toggle');
  el.classList.remove(`${direction}`);
  el.style.zIndex = 999;
  el.style.pointerEvents = 'none';
}

function tooltipClose(el) {
  el.classList.add('toggle');
  el.style = '';
}

function tutorial() {
  tutorialArea.style.opacity = 1;
  tutorialArea.style.pointerEvents = 'auto';
  skipBtn.classList.remove('from-right');
  popupsBtn.forEach(btn => btn.classList.remove('pulse'));
  tooltipOpen(chapters, 'from-bottom');
}

function skip() {
  clickSkip++;
  if (clickSkip == 1) {
    tooltipClose(chapters);
    tooltipOpen(subchapters, 'from-top');
  } else if (clickSkip == 2) {
    tooltipClose(subchapters);
    skipBtn.querySelector('p').textContent = `${contents[0].start}`;
    tooltipOpen(plusArea, 'flush');
  } else if (clickSkip == 3) {
    tooltipClose(plusArea);
    tutorialArea.style = '';
    popupsBtn.forEach(btn => btn.classList.add('pulse'));
    skipBtn.classList.add('from-right');
    setTimeout(() => skipBtn.querySelector('p').textContent = `${contents[0].next}`, 400);
    clickSkip = 0;
  }
}

/* --------------------------------------------------------- */
/* --------------------- DYNAMIC TEXT ----------------------- */
/* --------------------------------------------------------- */
function dynamicText() {
  label.innerText = contents[scene].label;
  title.innerText = contents[scene].title;
  setTimeout(() => title.classList.add('switching'), 100);

  setTimeout(() => {
    const popups = ['popup1', 'popup2', 'popup3'];
    popups.forEach((popup, i) => {
      const currentPopup = contents[scene].subchapters[subScene][popup];
      if (currentPopup) {
        popupsBtn[i].style.top = currentPopup.top;
        popupsBtn[i].style.left = currentPopup.left;
        popupsTxt[i].innerHTML = rewriteHtmlAssets(currentPopup.text);
      } else {
        popupsBtn[i].style.top = '-65px';
        popupsBtn[i].style.left = '-65px';
      }
    });
  }, switchTime);
}

/* --------------------------------------------------------- */
/* --------------------- START FUNCTION --------------------- */
/* --------------------------------------------------------- */
function start() {
  const opening = $('#opening');
  const tutorialViewed = localStorage.getItem('tutorialGs1');
  dynamicText();

  if (!tutorialViewed) {
    tutorial();
  } else {
    chapters.classList.add('toggle');
    chapters.classList.remove('from-bottom');
    plusArea.classList.add('toggle');
    setTimeout(() => {
      subchapters.classList.add('toggle');
      subchapters.classList.remove('from-top');
    }, timing * 0.5);
    setTimeout(() => {
      popupsBtn.forEach(btn => btn.classList.add('pulse'));
      plusArea.classList.remove('flush');
    }, timing);
  }

  opening.classList.add('from-right');
  setTimeout(() => opening.classList.add('d-none'), 500);

  videoBox.classList.add('change');
  videoBox.classList.remove('quick-left');

  setTimeout(() => {
    const src = contents[0]?.subchapters?.[0]?.src;
    video.src = normalizePath(src);
  }, switchTime);

  const dots = $('#dots');
  for (let i = 0; i < sceneTot; i++) {
    const dot = document.createElement('span');
    dot.classList.add('b-pill');
    if (i == 0) dot.classList.add('bg-white');
    dots.appendChild(dot);
  }

  localStorage.setItem('tutorialGs1', 'view');
}

/* --------------------------------------------------------- */
/* ---------------- CHAPTERS / SUBCHAPTERS ------------------ */
/* --------------------------------------------------------- */
function subBtnHandler(i) {
  const subBtn = $$('nav button');
  plusArea.classList.add('flush');
  subBtn.forEach(btn => {
    btn.classList.remove('active');
    btn.disabled = true;
  });

  const activeIndex = i !== undefined ? i : 0;
  setTimeout(() => subBtn[activeIndex].classList.add('active'), 100);

  setTimeout(() => {
    subBtn.forEach(btn => {
      if (!btn.classList.contains('active')) btn.disabled = false;
    });
    plusArea.classList.remove('flush');
  }, timing);
}

function btnHandler() {
  nextBtn.disabled = scene >= sceneTot - 1;
  prevBtn.disabled = scene <= 0;
}
btnHandler();

function changeContent(i) {
  videoBox.classList.remove('change', 'change-inverse');
  subScene = i !== undefined ? i : 0;
  const dots = $$('.chap-text span');
  tab.style.left = `${subScene * 33.33}%`;
  dots.forEach(dot => dot.classList.remove('bg-white'));
  setTimeout(() => dots[scene].classList.add('bg-white'), 100);
  setTimeout(() => {
    const src = contents[scene].subchapters[subScene].src;
    video.src = normalizePath(src);
  }, switchTime);
  popupsTxt.forEach(popup => popup.scrollTop = 0);
}

function toggleSubmenu() {
  subchapters.classList.add('from-top');
  setTimeout(() => subchapters.classList.remove('from-top'), timing / 2);
}

function chapterNavigation(increment) {
  scene += increment;
  actualSub = 0;
  changeContent();
  toggleSubmenu();
  title.classList.remove('switching');
  dynamicText();
  setTimeout(() => videoBox.classList.toggle(increment > 0 ? 'change' : 'change-inverse'), 100);
  subBtnHandler();
  btnHandler();
}

function prev() { chapterNavigation(-1); }
function next() { chapterNavigation(1); }

/* --------------------------------------------------------- */
/* --------------------- SUBCHAPTERS ------------------------ */
/* --------------------------------------------------------- */
let activeBtn = $('.active');
if (activeBtn) activeBtn.disabled = true;

function sub(i) {
  changeContent(i);
  subBtnHandler(i);
  dynamicText();
  setTimeout(() => {
    videoBox.classList.toggle(i > actualSub ? 'change' : 'change-inverse');
    actualSub = i;
  }, 100);
}
