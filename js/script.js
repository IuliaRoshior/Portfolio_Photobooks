"use strict";
/* Portfolio: Print works only. Grid (drag to explore) and Index (cursor preview), plus an in-page live viewer. */

const CATS = { print: "Print" };

/* One entry per work. Optional `cover: "assets/covers/<id>.jpg"` sets its own thumbnail; otherwise the default SVG is used. */
const PROJECTS = [
  { id: "sea", t: "Sea Memories", c: "print", y: 2024, k: "pdf", u: "assets/pdf/PhotoBookSea.PDF" },
  { id: "elvira", t: "Elvira", c: "print", y: 2025, k: "pdf", u: "assets/pdf/PhotoBookElvira.PDF" },
  { id: "aura", t: "AURA travel", c: "print", y: 2026, k: "pdf", u: "assets/pdf/AURA_Travel.pdf" },
  { id: "cream", t: "VERA", c: "print", y: 2026, k: "pdf", u: "assets/pdf/creamAdvertisement.PDF" },
  { id: "calendar", t: "Calendario", c: "print", y: 2025, k: "pdf", u: "assets/pdf/Calendario.PDF" },
  { id: "price", t: "Price list", c: "print", y: 2025, k: "pdf", u: "assets/pdf/Винтажный шаблон фотопрайса.PDF"},
];

const $ = (id) => document.getElementById(id);
const grid = $("grid"), index = $("index"), peek = $("peek"), viewer = $("viewer");
const state = { view: "grid", current: -1 };

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text; // textContent only: never innerHTML
  return node;
}

const visible = () => PROJECTS;

const DEFAULT_COVER = "assets/rose-curve.svg"; // relative to index.html

/* Thumbnail for a work: its own `cover` image, or the default SVG. */
function thumb(p) {
  if (p.canvas) return p.canvas;

  const img = el("img");
  img.src = p.cover || DEFAULT_COVER;
  img.alt = "";
  img.width = 400;
  img.height = 500;
  img.decoding = "async";
  img.draggable = false;

  p.canvas = img;
  return img;
}

/* ---------- Rendering ---------- */
function tile(p) {
  const li = el("li"), b = el("button", "tile");
  b.type = "button";
  b.append(thumb(p), el("span", "ti", p.t), el("span", "ca", CATS[p.c]));
  b.addEventListener("click", () => { if (!didDrag) openViewer(p); });
  li.append(b);
  return li;
}

function row(p) {
  const li = el("li"), b = el("button", "row");
  b.type = "button";
  b.append(el("span", "t", p.t), el("span", "c", CATS[p.c]), el("span", "y", String(p.y)));
  b.addEventListener("click", () => openViewer(p));
  b.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") showPeek(p, e); });
  b.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") movePeek(e); });
  b.addEventListener("pointerleave", () => peek.classList.remove("on"));
  li.append(b);
  return li;
}

function render() {
  const list = visible();

  grid.replaceChildren(...list.map(tile));
  index.replaceChildren(...list.map(row));
  grid.hidden = state.view !== "grid";
  $("gallery").hidden = state.view !== "grid";
  index.hidden = state.view !== "index";
  $("count").textContent = `${list.length} ${list.length === 1 ? "work" : "works"}`;
  $("hint").textContent = state.view === "grid" ? "Drag to explore, click to preview" : "Hover for a preview, click to open";
}

function setPressed(groupId, attr, value) {
  $(groupId).querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset[attr] === value)));
}

$("views").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  state.view = b.dataset.view; setPressed("views", "view", state.view); render();
});

/* ---------- Drag to explore (mouse); touch and keyboard use native scrolling ---------- */
let didDrag = false;

grid.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse" || e.button !== 0) return;
  const startX = e.clientX, startLeft = grid.scrollLeft;
  didDrag = false;

  const move = (m) => {
    const dx = m.clientX - startX;
    if (Math.abs(dx) > 5) {
      didDrag = true;
      grid.classList.add("dragging");
    }
    grid.scrollLeft = startLeft - dx;
  };

  const up = () => {
    grid.classList.remove("dragging");
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    setTimeout(() => { didDrag = false; }, 0); // lets the click handler see the flag first
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
});

/* ---------- Index hover preview ---------- */
function showPeek(p, e) {
  peek.src = thumb(p).src;
  peek.classList.add("on");
  movePeek(e);
}

function movePeek(e) {
  peek.style.transform = `translate(${Math.min(e.clientX + 24, innerWidth - 200)}px, ${Math.min(e.clientY - 110, innerHeight - 245)}px)`;
}

/* ---------- Viewer: loads an iframe only when a work is opened ---------- */
function openViewer(p) {
  const list = visible();
  state.current = list.indexOf(p);

  $("v-meta").textContent = `${CATS[p.c]} · ${p.y}`;
  $("v-title").textContent = p.t;

  const open = $("v-open");
  open.href = p.u;

  const f = el("iframe");
  f.title = `Preview of ${p.t}`;
  f.referrerPolicy = "no-referrer";
  f.src = p.u; // PDFs open in the browser's built-in viewer (no sandbox)
  $("v-body").replaceChildren(f);

  if (!viewer.open) viewer.showModal();
}

function step(d) {
  const l = visible();
  openViewer(l[(state.current + d + l.length) % l.length]);
}

$("v-prev").addEventListener("click", () => step(-1));
$("v-next").addEventListener("click", () => step(1));
$("v-close").addEventListener("click", () => viewer.close());

viewer.addEventListener("close", () => $("v-body").replaceChildren()); // unload the preview

viewer.addEventListener("click", (e) => { if (e.target === viewer) viewer.close(); }); // backdrop click

render();

/* ---------- Smooth appearance of website elements ---------- */
(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const selector = [
    "header",
    "main h1",
    "main h2",
    "main h3",
    "main p",
    "main .tile",
    "main .row",
    "#views",
    "footer"
  ].join(", ");

  const prepared = new WeakSet();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("reveal-pending", !entry.isIntersecting);
    });
  }, { threshold: 0, rootMargin: "0px 0px -20px 0px" });

  function prepareElements() {
    document.querySelectorAll(selector).forEach((element) => {
      if (prepared.has(element)) return;

      prepared.add(element);
      element.classList.add("reveal", "reveal-pending");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!element.isConnected) return;
          element.classList.add("reveal-ready");
          observer.observe(element);
        });
      });
    });
  }

  prepareElements();

  new MutationObserver(prepareElements).observe(document.body, { childList: true, subtree: true });
})();

/* ---------- Gallery arrows ---------- */
(() => {
  const prev = $("grid-prev");
  const next = $("grid-next");

  function updateArrows() {
    const maxScroll = grid.scrollWidth - grid.clientWidth;
    prev.disabled = grid.scrollLeft <= 2;
    next.disabled = grid.scrollLeft >= maxScroll - 2;
  }

  function moveGallery(direction) {
    const card = grid.querySelector("li");
    if (!card) return;

    const gap = parseFloat(getComputedStyle(grid).gap) || 0;
    const distance = card.getBoundingClientRect().width + gap;

    grid.scrollBy({
      left: direction * distance,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
  }

  prev.addEventListener("click", () => moveGallery(-1));
  next.addEventListener("click", () => moveGallery(1));

  grid.addEventListener("scroll", updateArrows, { passive: true });

  new ResizeObserver(updateArrows).observe(grid);
  new MutationObserver(() => requestAnimationFrame(updateArrows)).observe(grid, { childList: true });

  updateArrows();
})();
