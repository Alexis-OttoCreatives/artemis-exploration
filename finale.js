// Finale: while the section is pinned, scrolling zooms the photo wall out
// (CoolDock-style), then fades it away as the download block fades in.
(() => {
  const section = document.querySelector("[data-finale]");
  if (!section || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const wall = section.querySelector(".finale__wall");
  const closing = section.querySelector(".closing");

  // Timeline, as shares of the pinned scroll (0 → 1)
  const ZOOM = [0, 0.6];       // wall zooms out from START to MID scale
  const FADE = [0.45, 0.68];   // wall fades out (and keeps shrinking to END)
  const SHOW = [0.66, 0.9];    // download block fades in, once the wall is mostly gone
  const START = 1.15, MID = 0.52, END = 0.4;

  const clamp01 = (t) => Math.max(0, Math.min(1, t));
  const span = ([a, b], p) => clamp01((p - a) / (b - a));
  const easeOut = (t) => 1 - (1 - t) ** 3;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  let raf = 0;
  function update() {
    raf = 0;
    const r = section.getBoundingClientRect();
    const p = clamp01(-r.top / (r.height - innerHeight));

    const z = easeInOut(span(ZOOM, p));
    const f = span(FADE, p);
    const scale = START + (MID - START) * z + (END - MID) * easeOut(f);
    wall.style.setProperty("--s", scale.toFixed(4));
    wall.style.setProperty("--o", (1 - easeOut(f)).toFixed(3));

    const c = easeOut(span(SHOW, p));
    closing.style.setProperty("--c", c.toFixed(3));
    section.classList.toggle("is-revealed", c > 0.6);
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };

  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  update();
})();
