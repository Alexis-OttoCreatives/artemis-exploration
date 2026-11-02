// Closing icon: on hover (or tap) the Poppy wordmark fades out and the red
// tile eases to a soft off-white, while a cloud of fine particles drifts in and settles
// into a scannable QR code. Leaving scatters the particles and brings the
// logo back.
(() => {
  const icon = document.querySelector("[data-qr]");
  if (!icon) return;
  const logo = icon.querySelector("img");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // QR for https://poppy.be (version 2, level M), 1 = dark module. Placeholder link.
  const QR = [
    "1111111001110110101111111", "1000001011101011001000001", "1011101001000110101011101",
    "1011101001010111001011101", "1011101011000010101011101", "1000001001010101101000001",
    "1111111010101010101111111", "0000000001101111100000000", "1010101000010010100010010",
    "0101100101010010111000001", "0000111111000100110010111", "0000010100000000001100010",
    "0011011000111000111101011", "0011000101111100101001001", "1001101101111010101100111",
    "0111110100101110110010010", "1000011011010011111111000", "0000000011110011100011011",
    "1111111001000101101011011", "1000001001110001100011010", "1011101011101000111111001",
    "1011101001111100000111100", "1011101011111010010010001", "1000001001101110110011010",
    "1111111011010011101100011",
  ];

  // Tuning
  const QR_SIZE = 0.72;     // share of the tile the code covers (keeps it clear of the rounded corners)
  const DOT = 1.6;          // target particle size in px; each module is split into k × k of them
  const FORWARD = 600;      // ms, logo → QR
  const BACK = 450;         // ms, QR → logo
  const FADE = 0.3;         // share of the timeline for the logo fade / tile turning white
  const SPREAD = 0.45;      // share of the timeline used to stagger particle arrivals
  const SWIRL = 22;         // px a particle can drift sideways mid-flight
  const INK = "19, 22, 23";

  const canvas = document.createElement("canvas");
  canvas.className = "closing__qr";
  canvas.setAttribute("aria-hidden", "true");
  icon.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let parts = [];
  let built = 0;   // icon size the particles were built for
  let dot = 0;
  let p = 0;       // 0 = logo, 1 = QR
  let target = 0;
  let last = 0;
  let raf = 0;

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const expo = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)); // exponential ease-out: shoots in, then snaps into place
  const clamp01 = (t) => Math.max(0, Math.min(1, t));

  // Split every dark module into small particles, each starting somewhere in a
  // loose cloud around the tile
  function build() {
    const size = icon.clientWidth;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const n = QR.length;
    const module = (size * QR_SIZE) / n;
    const k = Math.max(2, Math.round(module / DOT));
    dot = module / k;
    const origin = (size - module * n) / 2;
    const mid = size / 2;

    parts = [];
    QR.forEach((row, r) => [...row].forEach((bit, c) => {
      if (bit !== "1") return;
      for (let i = 0; i < k; i++) {
        for (let j = 0; j < k; j++) {
          const a = Math.random() * Math.PI * 2;
          const d = size * (0.15 + Math.random() * 0.55);
          parts.push({
            sx: mid + Math.cos(a) * d, sy: mid + Math.sin(a) * d,
            ex: origin + c * module + j * dot, ey: origin + r * module + i * dot,
            delay: FADE * 0.4 + Math.random() * SPREAD,
            swirl: (Math.random() - 0.5) * 2 * SWIRL,
          });
        }
      }
    }));
    built = size;
  }

  function draw() {
    const size = built;
    ctx.clearRect(0, 0, size, size);
    const f = ease(clamp01(p / FADE));
    logo.style.opacity = p > 0 ? 1 - f : "";
    if (p <= 0) return;

    const span = 1 - FADE * 0.4 - SPREAD;
    for (const q of parts) {
      const raw = clamp01((p - q.delay) / span);
      if (raw <= 0) continue;
      const t = expo(raw);
      const dx = q.ex - q.sx, dy = q.ey - q.sy;
      const len = Math.hypot(dx, dy) || 1;
      const arc = Math.sin(Math.PI * t) * q.swirl;  // sideways drift, zero at both ends
      const x = q.sx + dx * t - (dy / len) * arc;
      const y = q.sy + dy * t + (dx / len) * arc;
      const s = dot * (0.6 + 0.4 * t) + (raw === 1 ? 0.35 : 0);  // landed dots overlap a hair, so modules read solid
      ctx.fillStyle = `rgba(${INK}, ${Math.min(1, raw * 2.5)})`;
      ctx.fillRect(x, y, s, s);
    }
  }

  function tick(now) {
    const dt = now - last;
    last = now;
    const step = dt / (target > p ? FORWARD : BACK);
    p = target > p ? Math.min(target, p + step) : Math.max(target, p - step);
    draw();
    raf = p !== target ? requestAnimationFrame(tick) : 0;
  }

  function go(to) {
    target = to;
    icon.classList.toggle("is-qr", to === 1); // CSS fades the tile red ↔ off-white on its own, slower clock
    if (built !== icon.clientWidth) build();
    if (reduceMotion) { p = to; draw(); return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }

  if (matchMedia("(hover: hover)").matches) {
    icon.addEventListener("pointerenter", () => go(1));
    icon.addEventListener("pointerleave", () => go(0));
  } else {
    icon.addEventListener("click", () => go(target ? 0 : 1));
  }
  addEventListener("resize", () => { built = 0; if (p) { build(); draw(); } });
})();
