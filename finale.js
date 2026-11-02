// Finale: while the section is pinned, the stage starts white, photos pop in
// one by one as you scroll, then the whole wall zooms out (CoolDock-style)
// and fades away as the download block fades in.
(() => {
  const section = document.querySelector("[data-finale]");
  if (!section || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const wall = section.querySelector(".finale__wall");
  const tiles = [...wall.children];
  const closing = section.querySelector(".closing");

  // Timeline, as shares of the pinned scroll (0 → 1)
  const APPEAR = [0.02, 0.3];  // photos fade in, staggered
  const ZOOM = [0.22, 0.68];   // wall zooms out from START to MID scale
  const FADE = [0.6, 0.78];    // wall fades out (and keeps shrinking to END)
  const SHOW = [0.76, 0.95];   // download block fades in, once the wall is mostly gone
  const START = 1.08, MID = 0.6, END = 0.48;
  const STAGGER = 0.65;        // share of APPEAR over which tile starts are spread

  const clamp01 = (t) => Math.max(0, Math.min(1, t));
  const span = ([a, b], p) => clamp01((p - a) / (b - a));
  const easeOut = (t) => 1 - (1 - t) ** 3;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  // Stable pseudo-random start per tile (same on every visit); the centre
  // brand tile comes in first
  const delays = tiles.map((t, i) =>
    t.classList.contains("finale__tile--brand") ? 0 : ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * STAGGER);

  let raf = 0;
  function update() {
    raf = 0;
    const r = section.getBoundingClientRect();
    const p = clamp01(-r.top / (r.height - innerHeight));

    const a = span(APPEAR, p);
    tiles.forEach((t, i) => t.style.setProperty("--a", easeOut(clamp01((a - delays[i]) / (1 - STAGGER))).toFixed(3)));

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
