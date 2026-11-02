// Dock-style story row, full width: portraits share the row, the one nearest
// the cursor swells (macOS dock style) while the others give way, and a click
// opens one into a square showing that person's year. Click it again, click
// outside, or press Escape to close. Below 700px the row scrolls sideways.
(() => {
  const dock = document.querySelector("[data-dock]");
  if (!dock) return;

  const items = [...dock.children];
  const hits = items.map((li) => li.querySelector(".dock__hit"));
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Tuning
  const EASE = reduceMotion ? 1 : 0.16; // per-frame smoothing, lower = softer
  const SWELL_W = 1.8;                  // hovered share of the row vs. a resting portrait
  const SWELL_H = 1.1;                  // hovered height = resting × this
  const RANGE = 1.4;                    // cursor influence, in resting widths

  let size; // resting / open sizes for the current viewport
  function measure() {
    const vw = innerWidth;
    const small = vw <= 700;
    const gap = parseFloat(getComputedStyle(dock).columnGap) || 0;
    const room = dock.clientWidth - parseFloat(getComputedStyle(dock).paddingLeft) * 2;
    const h = small ? 380 : Math.round(Math.min(620, Math.max(400, vw * 0.32)));
    const open = small ? Math.min(vw - 48, 420) : Math.round(Math.min(640, room * 0.4));
    size = { small, gap, room, h, open, w: (room - gap * (items.length - 1)) / items.length };
    dock.style.setProperty("--open", `${open}px`);
    dock.style.height = `${Math.max(open, fine ? h * SWELL_H : h)}px`;
  }

  const cur = items.map(() => ({ w: 0, h: 0 }));
  let mouseX = null;
  let open = -1;
  let raf = 0;

  // Widths always add up to the row, so the list stays full width in every state.
  function targets() {
    const n = items.length;
    const free = size.room - size.gap * (n - 1);
    if (size.small) {
      return items.map((_, i) => (i === open ? { w: size.open, h: size.open } : { w: size.w, h: size.h }));
    }
    if (open !== -1) {
      const rest = (free - size.open) / (n - 1);
      return items.map((_, i) => (i === open ? { w: size.open, h: size.open } : { w: rest, h: size.h }));
    }
    const pull = items.map((li) => {
      if (mouseX === null || !fine) return 0;
      const r = li.getBoundingClientRect();
      let t = Math.max(0, 1 - Math.abs(mouseX - (r.left + r.width / 2)) / (size.w * RANGE));
      return t * t * (3 - 2 * t); // smoothstep falloff for the neighbours
    });
    const weights = pull.map((t) => 1 + (SWELL_W - 1) * t);
    const sum = weights.reduce((a, b) => a + b, 0);
    return weights.map((wt, i) => ({ w: (free * wt) / sum, h: size.h * (1 + (SWELL_H - 1) * pull[i]) }));
  }

  function tick() {
    let moving = false;
    targets().forEach((t, i) => {
      const c = cur[i];
      c.w += (t.w - c.w) * EASE;
      c.h += (t.h - c.h) * EASE;
      if (Math.abs(t.w - c.w) > 0.3 || Math.abs(t.h - c.h) > 0.3) moving = true;
      else { c.w = t.w; c.h = t.h; }
      items[i].style.width = `${c.w}px`;
      items[i].style.height = `${c.h}px`;
    });
    raf = moving ? requestAnimationFrame(tick) : 0;
  }
  const start = () => { if (!raf) raf = requestAnimationFrame(tick); };

  function setOpen(index) {
    open = index;
    items.forEach((li, i) => {
      const on = i === index;
      li.classList.toggle("is-open", on);
      hits[i].setAttribute("aria-expanded", on);
    });
    dock.classList.toggle("has-open", index !== -1);
    start();
    // On small screens the row scrolls: bring the opened portrait into view once it has grown
    if (index !== -1 && size.small) {
      setTimeout(() => items[index].scrollIntoView({ inline: "center", block: "nearest", behavior: reduceMotion ? "auto" : "smooth" }), 350);
    }
  }

  hits.forEach((hit, i) => hit.addEventListener("click", () => setOpen(open === i ? -1 : i)));
  document.addEventListener("click", (e) => { if (open !== -1 && !dock.contains(e.target)) setOpen(-1); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open !== -1) { hits[open].focus(); setOpen(-1); } });

  if (fine) {
    dock.addEventListener("mousemove", (e) => { mouseX = e.clientX; start(); });
    dock.addEventListener("mouseleave", () => { mouseX = null; start(); });
  }
  addEventListener("resize", () => { measure(); start(); });

  measure();
  targets().forEach((t, i) => { cur[i].w = t.w; cur[i].h = t.h; });
  tick();
})();
