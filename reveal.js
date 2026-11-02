// Hover image reveal: a floating card that pops in next to the cursor,
// trails it with a soft spring, tilts with the movement, and slides a
// vertical reel of photos as you move between rows. The hovered row also
// gets .is-active so it stays highlighted while the card is up.
(() => {
  const list = document.querySelector("[data-reveal]");
  if (!list) return;

  const items = [...list.querySelectorAll("li")];

  // Hover-only enhancement: touch devices keep the plain list.
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const reveal = document.createElement("div");
  reveal.className = "reveal";
  reveal.setAttribute("aria-hidden", "true");
  reveal.innerHTML = `
    <div class="reveal__card">
      <div class="reveal__reel">
        ${items
          .map(
            (li) => `
          <div class="reveal__slide">
            <img src="${li.dataset.image}" alt="" decoding="async" />
            <span class="reveal__caption">${li.dataset.caption || ""}</span>
          </div>`
          )
          .join("")}
      </div>
    </div>`;
  document.body.appendChild(reveal);

  const reel = reveal.querySelector(".reveal__reel");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Tuning
  const GAP = 24;        // space between the hovered row's text and the card
  const LIFT = 0.12;     // card centre sits this fraction of its height above the row (matches Figma)
  const PULL = 0.35;     // how much the card drifts toward the cursor (0 = pinned, 1 = glued)
  const FOLLOW = reduceMotion ? 1 : 0.09; // spring factor per frame, lower = lazier trail
  const TILT = 0.08;     // degrees of tilt per px of lag
  const MAX_TILT = 8;

  const mouse = { x: 0, y: 0 };
  const pos = { x: 0, y: 0 };
  let active = -1;
  let anchor = items[0];
  let raf = 0;

  function target() {
    const { offsetWidth: width, offsetHeight: height } = reveal;
    const row = anchor.getBoundingClientRect();
    const cx = row.left + row.width / 2;
    const cy = row.top + row.height / 2;

    // Rest position: just right of the hovered text, then drift a little toward the cursor.
    let x = row.right + GAP + (mouse.x - cx) * PULL;
    let y = cy - height * (0.5 + LIFT) + (mouse.y - cy) * PULL;

    x = Math.min(x, innerWidth - width - 16);
    y = Math.min(Math.max(y, 16), innerHeight - height - 16);
    return { x, y };
  }

  function tick() {
    const t = target();
    const dx = t.x - pos.x;
    const dy = t.y - pos.y;
    pos.x += dx * FOLLOW;
    pos.y += dy * FOLLOW;

    const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, dx * TILT));
    reveal.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${tilt}deg)`;

    const settled = Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1;
    raf = settled && active === -1 ? 0 : requestAnimationFrame(tick);
  }

  function start() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function setActive(index) {
    if (index === active) return;
    if (active !== -1) items[active].classList.remove("is-active");
    active = index;
    if (index === -1) {
      reveal.classList.remove("is-visible");
      return;
    }
    items[index].classList.add("is-active");
    anchor = items[index];
    reel.style.transform = `translateY(${-index * 100}%)`;
    reveal.classList.add("is-visible");
  }

  items.forEach((li, i) => {
    li.addEventListener("mouseenter", (e) => {
      // First entry: jump the card to the cursor so it pops in place rather than flying across.
      if (active === -1) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        anchor = li;
        Object.assign(pos, target());
        reel.style.transition = "none";
        reel.style.transform = `translateY(${-i * 100}%)`;
        reel.offsetHeight; // commit the jump before re-enabling the slide
        reel.style.transition = "";
      }
      setActive(i);
      start();
    });
  });

  list.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    start();
  });

  list.addEventListener("mouseleave", () => setActive(-1));
})();
