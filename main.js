const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  const progressBar = document.querySelector(".scroll-progress");
  const mockup = document.querySelector(".hero-mockup");
  const mockupWrapper = document.querySelector(".hero-mockup-wrapper");

  // Count-up numbers start from zero and run when their card is revealed
  const counters = document.querySelectorAll("[data-count]");
  if (!reduceMotion) {
    counters.forEach(el => {
      el.textContent = formatCount(el, 0);
    });
  }

  // Intersection Observer for scroll animations
  const reveals = document.querySelectorAll(".reveal");

  const revealOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px" // Trigger slightly before it hits the bottom
  };

  const revealOnScroll = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        return;
      }
      entry.target.classList.add("active");
      entry.target.querySelectorAll("[data-count]").forEach(countUp);
      observer.unobserve(entry.target);
    });
  }, revealOptions);

  reveals.forEach(reveal => {
    revealOnScroll.observe(reveal);
  });

  // Scroll-linked effects: progress bar, solid navbar, mockup tilt
  let tiltMax = 22;
  const readTiltMax = () => {
    const value = parseFloat(getComputedStyle(mockup).getPropertyValue("--tilt-max"));
    tiltMax = Number.isNaN(value) ? 22 : value;
  };

  const updateOnScroll = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.setProperty("--progress", scrollable > 0 ? (window.scrollY / scrollable).toFixed(4) : 0);
    navbar.classList.toggle("scrolled", window.scrollY > 20);

    if (!reduceMotion) {
      // 0 while the mockup sits at the bottom of the screen, 1 once its top reaches ~25% from the top
      const top = mockupWrapper.getBoundingClientRect().top;
      const progress = clamp((window.innerHeight - top) / (window.innerHeight * 0.75), 0, 1);
      mockup.style.setProperty("--tilt", `${((1 - progress) * tiltMax).toFixed(2)}deg`);
      mockup.style.setProperty("--mock-scale", (0.92 + 0.08 * progress).toFixed(3));
    }
  };

  let ticking = false;
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateOnScroll();
      ticking = false;
    });
  };

  if (reduceMotion) {
    mockup.style.setProperty("--tilt", "0deg");
  }
  readTiltMax();
  updateOnScroll();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", () => {
    readTiltMax();
    requestUpdate();
  });

  // Desktop: mockup leans toward the pointer, bento cards get a following spotlight
  if (canHover && !reduceMotion) {
    const hero = document.querySelector(".hero");
    hero.addEventListener("pointermove", e => {
      const rect = mockup.getBoundingClientRect();
      const x = clamp((e.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
      const y = clamp((e.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);
      mockup.style.setProperty("--tilt-y", `${(x * 6).toFixed(2)}deg`);
      mockup.style.setProperty("--tilt-x", `${(-y * 4).toFixed(2)}deg`);
    });
    hero.addEventListener("pointerleave", () => {
      mockup.style.setProperty("--tilt-y", "0deg");
      mockup.style.setProperty("--tilt-x", "0deg");
    });
  }

  document.querySelectorAll(".bento-item").forEach(card => {
    card.addEventListener("pointermove", e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });

  // Touch: light up the bento card that sits in the middle of the screen
  if (!canHover) {
    const focusObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle("in-focus", entry.isIntersecting));
    }, { rootMargin: "-40% 0px -40% 0px" });
    document.querySelectorAll(".bento-item").forEach(card => focusObserver.observe(card));
  }

  buildEmbeddingBars();
  buildClusterDots();
  buildVirtualGrid();
  startTypewriter();
});

// Face card: a live-looking slice of the 512-D face vector
function buildEmbeddingBars() {
  const container = document.querySelector(".embedding-bars");
  if (!container) return;
  for (let i = 0; i < 48; i++) {
    const bar = document.createElement("span");
    bar.style.setProperty("--i", i);
    bar.style.setProperty("--h", `${Math.round(25 + Math.random() * 75)}%`);
    container.appendChild(bar);
  }
}

function formatCount(el, value) {
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  return `${el.dataset.prefix || ""}${value.toFixed(decimals)}${el.dataset.suffix || ""}`;
}

function countUp(el) {
  if (reduceMotion) return;
  const target = parseFloat(el.dataset.count);
  const duration = 1600;
  const start = performance.now();

  const step = now => {
    const t = Math.min((now - start) / duration, 1);
    const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // easeOutExpo
    el.textContent = formatCount(el, target * eased);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// HDBSCAN card: dots drift from random spots into three event clusters
function buildClusterDots() {
  document.querySelectorAll(".cluster-visual").forEach(visual => {
    const clusters = [...visual.querySelectorAll(".cluster-label")].map(label => ({
      x: parseFloat(label.style.getPropertyValue("--x")),
      y: parseFloat(label.style.getPropertyValue("--y")),
      color: label.style.getPropertyValue("--c")
    }));
    const random = (min, max) => min + Math.random() * (max - min);

    for (let i = 0; i < 27; i++) {
      const cluster = clusters[i % clusters.length];
      const dot = document.createElement("span");
      dot.className = "cluster-dot";
      dot.style.setProperty("--i", i);
      dot.style.setProperty("--c", cluster.color);
      dot.style.setProperty("--sx", `${random(5, 95).toFixed(1)}%`);
      dot.style.setProperty("--sy", `${random(10, 90).toFixed(1)}%`);
      dot.style.setProperty("--tx", `${(cluster.x + random(-8, 8)).toFixed(1)}%`);
      dot.style.setProperty("--ty", `${(cluster.y + random(-12, 14)).toFixed(1)}%`);
      visual.appendChild(dot);
    }
  });
}

// Virtuoso card: an endlessly scrolling grid built from the gallery photos
function buildVirtualGrid() {
  const track = document.querySelector(".virtual-track");
  if (!track) return;
  const sources = [...document.querySelectorAll(".mock-img")].map(img => img.src);
  const tiles = [];
  for (let i = 0; i < 15; i++) {
    tiles.push(sources[(i * 3) % sources.length]);
  }
  // Two identical halves so translateY(-50%) loops seamlessly
  [...tiles, ...tiles].forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.loading = "lazy";
    track.appendChild(img);
  });
}

// Mockup search bar types out natural-language queries
function startTypewriter() {
  const el = document.querySelector("[data-typed]");
  if (!el) return;
  const phrases = el.dataset.typed.split("|");

  if (reduceMotion) {
    el.textContent = phrases[0];
    el.classList.add("is-typing");
    return;
  }

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  (async () => {
    await wait(1800);
    el.classList.add("is-typing");
    for (let index = 0; ; index = (index + 1) % phrases.length) {
      const phrase = phrases[index];
      for (let i = 1; i <= phrase.length; i++) {
        el.textContent = phrase.slice(0, i);
        await wait(55 + Math.random() * 60);
      }
      await wait(1600);
      for (let i = phrase.length - 1; i >= 0; i--) {
        el.textContent = phrase.slice(0, i);
        await wait(28);
      }
      await wait(350);
    }
  })();
}
