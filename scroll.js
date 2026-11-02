// Gentle in-page scrolling: links to "#section" glide there with a slow
// ease-in-out instead of the browser's quick default. The farther the target,
// the longer the glide, within limits.
(() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Tuning
  const MS_PER_PX = 1.3;          // glide length grows with distance...
  const MIN = 1200, MAX = 2200;   // ...between these bounds (ms)

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  let raf = 0;

  function glide(to) {
    cancelAnimationFrame(raf);
    const from = scrollY;
    const dist = to - from;
    const dur = Math.min(MAX, Math.max(MIN, Math.abs(dist) * MS_PER_PX));
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      scrollTo({ top: from + dist * ease(t), behavior: "instant" });
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  // A wheel or touch stops the glide, so the visitor stays in control
  for (const ev of ["wheel", "touchstart", "keydown"]) addEventListener(ev, () => cancelAnimationFrame(raf), { passive: true });

  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || reduceMotion) return;
    const id = link.getAttribute("href").slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    glide(Math.max(0, target.getBoundingClientRect().top + scrollY - margin));
    history.pushState(null, "", `#${id}`);
  });
})();
