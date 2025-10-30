/* --------------------v5.4 (custom)--------------------- */
/* --------------------------------------------- */
/* ------------- VARIABILI GLOBALI ------------- */
/* --------------------------------------------- */
const $ = (el) => document.querySelector(el);
const $$ = (el) => document.querySelectorAll(el);

/* ---- feature flags ---- */
const TUTORIAL_ENABLED = false; // <— slökkt á kennsluefninu

// touch detection
const isTouch =
  "ontouchstart" in window ||
  navigator.maxTouchPoints > 0 ||
  navigator.msMaxTouchPoints > 0;

// prevent native drag on images/links
addEventListener("dragstart", (e) => e.preventDefault());

/* -------------------------------------- */
/* ----- PATH NORMALIZER (media → /) ---- */
/* -------------------------------------- */
const fixPath = (p) =>
  typeof p === "string"
    ? p
        .replaceAll("../media/video/", "../video/")
        .replaceAll("../media/img/", "../img/")
        .replaceAll("../media/svg/", "../svg/")
    : p;

const fixHtml = (html) =>
  typeof html === "string"
    ? html
        .replaceAll("../media/video/", "../video/")
        .replaceAll("../media/img/", "../img/")
        .replaceAll("../media/svg/", "../svg/")
    : html;

/* -------------------------------------- */
/* -------- PORTRAIT / LANDSCAPE? ------- */
/* -------------------------------------- */
const aside = $("aside");

if (isTouch) {
  addEventListener("DOMContentLoaded", () => {
    if (window.innerHeight < window.innerWidth && window.innerWidth < 768) {
      aside.classList.remove("from-bottom");
    }
  });

  addEventListener("orientationchange", () => {
    window.location.reload();
    aside.classList.toggle("from-bottom");
  });
}

/* -------------------------------------- */
/* -------- RECUPERO I CONTENUTI -------- */
/* -------------------------------------- */
const language = document.documentElement.getAttribute("lang");
let contents; // array con tutti i contenuti dinamici
let sceneTot; // capitoli totali

(async () => {
  try {
    // sækjum rétta JSON (ekki lengur /media/json)
    const response = await fetch(`../json/${language}.json?${Date.now()}`);
    contents = await response.json();

    // leiðréttum slóðir einu sinni í minni (valfrjálst – gott fyrir öll uses)
    contents = contents.map((chapter) => ({
      ...chapter,
      subchapters: chapter.subchapters.map((s) => ({
        ...s,
        src: fixPath(s.src),
        poster: fixPath(s.poster),
        // popup textar eru HTML með <img> etc.
        popup1: s.popup1
          ? { ...s.popup1, text: fixHtml(s.popup1.text) }
          : undefined,
        popup2: s.popup2
          ? { ...s.popup2, text: fixHtml(s.popup2.text) }
          : undefined,
        popup3: s.popup3
          ? { ...s.popup3, text: fixHtml(s.popup3.text) }
          : undefined,
      })),
    }));

    sceneTot = contents.length;
  } catch (error) {
    console.error("impossible to load contents", error);
  }
})();

/* ------------------------------------------ */
/* --------- ELEMENTI PAGINA GLOBALI -------- */
/* ------------------------------------------ */
const tutorialArea = $("#tutorial");
const chapters = $("#chapters");
// subchapters
const subchapters = $("nav");
const tab = $("#toggleTab");
// tutorial button
const skipBtn = $("#skip");
// text content
const label = $(".chap-text small");
const title = $("#title");
// chapters controls
let activeBtn = $(".active");
const prevBtn = $("#prev");
const nextBtn = $("#next");
// popup plus controls
const plusArea = $("#popup-area");
const popupsBtn = $$(".plus-btn");
const popupsTxt = $$("#popup-area .popup-text");
// illustrations element
const video = $("video");
const videoBox = $(".videobox");

/* ------------------------------------------ */
/* ------------ EVENTI AL CLICK ------------- */
/* ------------------------------------------ */
const timing = 1600; // deve essere uguale "$change" nell'scss
const switchTime = timing * 0.33; // tempistica switch file video
let scene = 0; // counter attuale capitolo visionato
let subScene = 0;
let actualSub = 0; // counters attuale sottocapitolo visionato
let clickSkip = 0; // counter utilizzi tutorial button

/* STEP1 TUTORIAL ------------------------------ */
function tooltipOpen(el, direction) {
  if (el.classList.contains("toggle")) el.classList.remove("toggle");
  el.classList.remove(`${direction}`);
  el.style.zIndex = 999;
  el.style.pointerEvents = "none";
}
function tooltipClose(el) {
  el.classList.add("toggle");
  el.style = "";
}
function tutorial() {
  tutorialArea.style.opacity = 1;
  tutorialArea.style.pointerEvents = "auto";
  skipBtn.classList.remove("from-right");
  popupsBtn.forEach((btn) => btn.classList.remove("pulse"));
  tooltipOpen(chapters, "from-bottom");
}
function skip() {
  clickSkip++;
  if (clickSkip == 1) {
    tooltipClose(chapters);
    tooltipOpen(subchapters, "from-top");
  } else if (clickSkip == 2) {
    tooltipClose(subchapters);
    skipBtn.querySelector("p").textContent = `${contents[0].start}`;
    tooltipOpen(plusArea, "flush");
  } else if (clickSkip == 3) {
    tooltipClose(plusArea);
    tutorialArea.style = "";
    popupsBtn.forEach((btn) => btn.classList.add("pulse"));
    skipBtn.classList.add("from-right");
    setTimeout(
      () => (skipBtn.querySelector("p").textContent = `${contents[0].next}`),
      400
    );
    clickSkip = 0;
  }
}

/* STEP2 START --------------------------------- */
function dynamicText() {
  label.innerText = contents[scene].label;
  title.innerText = contents[scene].title;
  setTimeout(() => title.classList.add("switching"), 100);

  setTimeout(() => {
    const popups = ["popup1", "popup2", "popup3"];
    popups.forEach((popup, i) => {
      const currentPopup = contents[scene].subchapters[subScene][popup];
      if (currentPopup) {
        popupsBtn[i].style.top = currentPopup.top;
        popupsBtn[i].style.left = currentPopup.left;
        popupsTxt[i].innerHTML = fixHtml(currentPopup.text); // <—
      } else {
        popupsBtn[i].style.top = "-65px";
        popupsBtn[i].style.left = "-65px";
      }
    });
  }, switchTime);
}

function start() {
  const opening = $("#opening");

  // merkjum kennslu sem "séð" og sleppum yfirlagi
  try {
    localStorage.setItem("tutorialGs1", "view");
  } catch (e) {}

  const tutorialViewed = localStorage.getItem("tutorialGs1");

  dynamicText();

  if (!tutorialViewed && TUTORIAL_ENABLED) {
    tutorial();
  } else {
    chapters.classList.add("toggle");
    chapters.classList.remove("from-bottom");
    plusArea.classList.add("toggle");
    setTimeout(() => {
      subchapters.classList.add("toggle");
      subchapters.classList.remove("from-top");
    }, timing * 0.5);
    setTimeout(() => {
      popupsBtn.forEach((btn) => btn.classList.add("pulse"));
      plusArea.classList.remove("flush");
    }, timing);
  }

  opening.classList.add("from-right");
  setTimeout(() => opening.classList.add("d-none"), 500);

  videoBox.classList.add("change");
  videoBox.classList.remove("quick-left");

  // 👉 setjum *leiðrétta* slóð (ef JSON notar ../media/video/)
  setTimeout(
    () => (video.src = fixPath(contents[0].subchapters[0].src)),
    switchTime
  );

  const dots = $("#dots");
  for (let i = 0; i < sceneTot; i++) {
    const dot = document.createElement("span");
    dot.classList.add("b-pill");
    if (i == 0) dot.classList.add("bg-white");
    dots.appendChild(dot);
  }
}

/* STEP3 CHAPTERS CONTROLS --------------------- */
function subBtnHandler(i) {
  const subBtn = $$("nav button");
  plusArea.classList.add("flush");
  subBtn.forEach((btn) => {
    btn.classList.remove("active");
    btn.disabled = true;
  });
  const activeIndex = i !== undefined ? i : 0;
  setTimeout(() => {
    subBtn[activeIndex].classList.add("active");
  }, 100);
  setTimeout(() => {
    subBtn.forEach((btn) => {
      if (!btn.classList.contains("active")) btn.disabled = false;
    });
    plusArea.classList.remove("flush");
  }, timing);
}

function btnHandler() {
  nextBtn.disabled = scene >= sceneTot - 1;
  prevBtn.disabled = scene <= 0;
}
btnHandler();

function changeContent(i) {
  videoBox.classList.remove("change", "change-inverse");
  subScene = i !== undefined ? i : 0;

  const dots = $$(".chap-text span");
  tab.style.left = `${subScene * 33.33}%`;
  dots.forEach((dot) => dot.classList.remove("bg-white"));
  setTimeout(() => dots[scene].classList.add("bg-white"), 100);

  // 👉 leiðrétt slóð áður en við setjum á video
  setTimeout(
    () => (video.src = fixPath(contents[scene].subchapters[subScene].src)),
    switchTime
  );

  popupsTxt.forEach((popup) => (popup.scrollTop = 0));
}

function toggleSubmenu() {
  subchapters.classList.add("from-top");
  setTimeout(() => subchapters.classList.remove("from-top"), timing / 2);
}

function chapterNavigation(increment) {
  scene += increment;
  actualSub = 0;
  changeContent();
  toggleSubmenu();

  title.classList.remove("switching");
  dynamicText();

  setTimeout(
    () => videoBox.classList.toggle(increment > 0 ? "change" : "change-inverse"),
    100
  );
  subBtnHandler();
  btnHandler();
}

function prev() {
  chapterNavigation(-1);
}

function next() {
  chapterNavigation(1);
}

/* STEP4 SUBCHAPTERS CONTROLS ------------------ */
activeBtn.disabled = true;

function sub(i) {
  changeContent(i);
  subBtnHandler(i);
  dynamicText();
  setTimeout(() => {
    videoBox.classList.toggle(i > actualSub ? "change" : "change-inverse");
    actualSub = i;
  }, 100);
}
