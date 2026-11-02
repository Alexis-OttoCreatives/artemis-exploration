// Floating nav: once the hero header has scrolled out of view, the pill drops
// in whenever the visitor scrolls up and tucks away again when they scroll
// down. Its menu button opens a two-column panel, which closes on a link
// click, a click outside, Escape, or when the pill hides again.
(() => {
  const pill = document.querySelector("[data-pill]");
  const hero = document.querySelector(".hero");
  if (!pill || !hero) return;

  const toggle = pill.querySelector(".pill__toggle");
  const menu = pill.querySelector(".pill__menu");

  function setOpen(on) {
    pill.classList.toggle("is-open", on);
    toggle.setAttribute("aria-expanded", on);
  }

  const SLACK = 8; // px of scroll ignored, so tiny jitters don't flip it

  let pastHero = false;
  let scrollingUp = false;
  let lastY = scrollY;

  function update() {
    const shown = pastHero && scrollingUp;
    pill.classList.toggle("is-shown", shown);
    pill.inert = !shown;
    if (!shown) setOpen(false);
  }

  // Only once the hero's own header is off screen...
  new IntersectionObserver(([entry]) => {
    pastHero = !entry.isIntersecting;
    update();
  }, { rootMargin: "-120px 0px 0px 0px" }).observe(hero);

  // ...and only while scrolling up
  addEventListener("scroll", () => {
    const y = scrollY;
    if (Math.abs(y - lastY) < SLACK) return;
    scrollingUp = y < lastY;
    lastY = y;
    update();
  }, { passive: true });

  toggle.addEventListener("click", () => setOpen(!pill.classList.contains("is-open")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("click", (e) => { if (!pill.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && pill.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
  });
})();
