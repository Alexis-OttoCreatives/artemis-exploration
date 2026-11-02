// 3D tilt on the service cards: the hovered card leans toward the cursor,
// a soft light follows the pointer, and the photo shifts slightly the other
// way for depth. Eases back flat on leave.
// [data-tilt] elements (the closing app icon) follow the cursor anywhere on the
// page while they are on screen, not only on hover.
(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Tuning
  const MAX_TILT = 7;   // degrees at the card's edge
  const SHIFT = 12;     // px the photo drifts against the tilt
  const EASE = 0.12;    // per-frame smoothing, lower = floatier

  document.querySelectorAll(".service, [data-tilt]").forEach((card) => {
    const target = { rx: 0, ry: 0, px: 0, py: 0, gx: 50, gy: 50, glare: 0 };
    const cur = { ...target };
    let raf = 0;

    function tick() {
      let moving = false;
      for (const k in target) {
        const d = target[k] - cur[k];
        cur[k] += d * EASE;
        if (Math.abs(d) > 0.01) moving = true;
      }
      const s = card.style;
      s.setProperty("--rx", `${cur.rx}deg`);
      s.setProperty("--ry", `${cur.ry}deg`);
      s.setProperty("--px", `${cur.px}px`);
      s.setProperty("--py", `${cur.py}px`);
      s.setProperty("--gx", `${cur.gx}%`);
      s.setProperty("--gy", `${cur.gy}%`);
      s.setProperty("--glare", cur.glare);
      raf = moving ? requestAnimationFrame(tick) : 0;
    }
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };

    // x, y in -0.5 … 0.5: where the cursor sits relative to the card's centre
    function aim(x, y) {
      target.ry = x * MAX_TILT * 2;
      target.rx = -y * MAX_TILT * 2;
      target.px = -x * SHIFT * 2;
      target.py = -y * SHIFT * 2;
      target.gx = (x + 0.5) * 100;
      target.gy = (y + 0.5) * 100;
      target.glare = 1;
      card.classList.add("is-tilting");
      start();
    }
    function rest() {
      Object.assign(target, { rx: 0, ry: 0, px: 0, py: 0, glare: 0 });
      card.classList.remove("is-tilting");
      start();
    }

    if (card.hasAttribute("data-tilt")) {
      // Page-wide: half a viewport away from the card gives the full tilt
      let visible = false;
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (!visible) rest(); }).observe(card);
      addEventListener("pointermove", (e) => {
        if (!visible) return;
        const r = card.getBoundingClientRect();
        const clamp = (v) => Math.max(-0.5, Math.min(0.5, v));
        aim(clamp((e.clientX - (r.left + r.width / 2)) / innerWidth), clamp((e.clientY - (r.top + r.height / 2)) / innerHeight));
      });
      document.documentElement.addEventListener("mouseleave", rest);
      return;
    }

    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      aim((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
    });
    card.addEventListener("pointerleave", rest);
  });
})();
