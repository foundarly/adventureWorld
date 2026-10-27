/* ==========================================================
   ADVENTURE WORLD — SCROLL MOTION
   GSAP + ScrollTrigger (from cdnjs, see index.html) for effects
   tied to the scroll. Scrolling itself is the browser's own (fast,
   off the main thread); in-page links glide via CSS
   scroll-behavior. Everything here is an extra: if GSAP can't
   load, or the visitor prefers reduced motion, the page works the
   same without these effects.

   - [data-parallax="0.1"]  the element drifts as you scroll past
     (bigger number = more movement)
   - gallery photos settle from a slight zoom
   - the word band moves faster when you scroll faster, and
     changes direction with the scroll
   All of them only change `transform`, which the GPU handles
   without re-laying-out the page.
   ========================================================== */
(function () {
  "use strict";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- 1. Parallax ---------- */
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const amount = parseFloat(el.dataset.parallax) || 0.1;
    // The hero starts at the top of the page, so it moves from its rest
    // position; everything else is centred on its own scroll range.
    const isHero = !!el.closest(".hero");
    gsap.fromTo(el,
      { yPercent: isHero ? 0 : -amount * 50 },
      {
        yPercent: amount * (isHero ? 100 : 50),
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: el.closest("section") || el,
          start: isHero ? "top top" : "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
  });

  /* ---------- 2. Gallery photos settle from a slight zoom ---------- */
  // (The activity cards are moved by their carousel instead)
  document.querySelectorAll(".gallery-item img").forEach((img) => {
    gsap.fromTo(img, { scale: 1.18 }, {
      scale: 1,
      ease: "none",
      force3D: true,
      scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "center center", scrub: 0.8 }
    });
  });

  /* ---------- 3. Word band reacts to scroll speed and direction ---------- */
  const marquee = document.querySelector(".marquee");
  const track = marquee && marquee.querySelector(".marquee-track");
  if (track) {
    marquee.classList.add("is-driven"); // switches off the CSS loop
    const loop = gsap.to(track, { xPercent: -50, duration: 36, ease: "none", repeat: -1, paused: true });
    // One reusable tween eases the speed (no new tweens on every scroll event)
    const speed = { v: 1 };
    const setSpeed = gsap.quickTo(speed, "v", { duration: 0.5, ease: "power2.out", onUpdate: () => loop.timeScale(speed.v) });
    let direction = 1, settle = 0;
    ScrollTrigger.create({
      trigger: marquee,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
      onUpdate: (self) => {
        direction = self.direction;
        setSpeed(direction * (1 + Math.min(Math.abs(self.getVelocity()) / 300, 5)));
        clearTimeout(settle);
        settle = setTimeout(() => setSpeed(direction), 250);
      }
    });
  }

  // Photos and fonts change heights after load; re-measure once ready
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
