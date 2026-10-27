/* ==========================================================
   ADVENTURE WORLD — SCRIPT

   ✏️  EDIT THIS BOX WHEN YOU HAVE THE PARK'S REAL DETAILS.
   Leave a value as "" (empty) if you don't have it yet; the
   website will show a "to be added / to be announced" message.
   ========================================================== */
const SITE_CONFIG = {
  // Full street address, exactly as the company provides it.
  // Example format: "Adventure World, <street>, Vepalagadda, Kothagudem, Telangana <PIN>"
  address: "",

  // Used for "Get Directions" and the map until the exact address is added.
  areaSearch: "Vepalagadda, Kothagudem, Telangana",

  // Contact details, e.g. phone: "+91 98xxxxxxxx", email: "info@example.com"
  phone: "",
  email: "",

  // WhatsApp number with country code, digits only, e.g. "9198xxxxxxxx"
  whatsapp: "",

  // How the enquiry form sends messages. Choose ONE:
  //   "none"     – form checks the details but sends nothing (default, until set up)
  //   "email"    – opens the visitor's email app, addressed to `email` above
  //   "whatsapp" – opens WhatsApp with the enquiry, to `whatsapp` above
  //   "endpoint" – posts to a form service URL (e.g. Formspree) set in `formEndpoint`
  enquiryMethod: "none",
  formEndpoint: "",

  // Hero background videos (muted, looping). Put the files in
  // assets/video/ and write their paths here, e.g.
  //   mp4: "assets/video/bumper-cars.mp4"
  // webm is optional (smaller); mobile is an optional smaller MP4 for
  // phones. Leave a scene's paths "" and it shows its poster photo.
  heroVideos: {
    bumper: { webm: "", mp4: "", mobile: "" },
    bungee: { webm: "", mp4: "", mobile: "" },
    buggy: { webm: "", mp4: "", mobile: "" },
    jumping: { webm: "", mp4: "", mobile: "" }
  },
  // Small note shown in the corner of the hero once videos are added,
  // e.g. "Footage from Adventure World" or "Representative footage"
  heroVideoNote: "Representative footage, not Adventure World"
};

/* ==========================================================
   You don't need to change anything below this line.
   ========================================================== */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 1. Fill in business details from SITE_CONFIG ---------- */
function applyConfig() {
  const { address, areaSearch, phone, email } = SITE_CONFIG;

  document.querySelectorAll('[data-config="address"]').forEach((el) => {
    if (!address) return;
    el.textContent = address;
    el.classList.remove("is-placeholder");
  });

  document.querySelectorAll('[data-config="phone"]').forEach((el) => {
    if (!phone) return;
    el.textContent = phone;
    el.href = "tel:" + phone.replace(/[^\d+]/g, "");
    el.classList.remove("is-placeholder");
  });

  document.querySelectorAll('[data-config="email"]').forEach((el) => {
    if (!email) return;
    el.textContent = email;
    el.href = "mailto:" + email;
    el.classList.remove("is-placeholder");
  });

  // Directions + map use the exact address if we have it, otherwise the area
  const query = encodeURIComponent(address || areaSearch);
  document.querySelectorAll("[data-directions]").forEach((el) => {
    el.href = "https://www.google.com/maps/search/?api=1&query=" + query;
  });
  if (address) {
    const map = document.querySelector("[data-map]");
    if (map) {
      map.src = "https://www.google.com/maps?q=" + query + "&output=embed";
      map.title = "Map search for " + address;
    }
    document.querySelectorAll("[data-directions-note]").forEach((el) => {
      el.textContent = "Directions open Google Maps for the address above.";
    });
  }
}

/* ---------- 2. Navigation ---------- */
function initNav() {
  const header = document.getElementById("site-header");
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");
  const desktopQuery = window.matchMedia("(min-width: 1025px)");

  const progress = document.getElementById("scroll-progress");
  const backToTop = document.getElementById("back-to-top");
  let lastY = window.scrollY;
  let ticking = false;

  // Page height is measured only when it can change (resize, images
  // loading), not on every scrolled frame: reading it after a class
  // change would force the browser to re-lay-out the page
  let max = 0, viewH = 0;
  const measure = () => {
    viewH = window.innerHeight;
    max = document.documentElement.scrollHeight - viewH;
  };
  measure();
  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("load", measure);
  if ("ResizeObserver" in window) new ResizeObserver(measure).observe(document.body);

  // Solid header after scrolling a little, the reading-progress bar,
  // the back-to-top button, and hiding the header while scrolling down
  const update = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);

    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    if (backToTop) backToTop.classList.toggle("is-visible", y > viewH * 0.8);

    // Only hide once past the first screen, and never while the menu
    // is open or the keyboard focus is inside the header
    const busy = menu.classList.contains("is-open") || header.contains(document.activeElement);
    if (y < viewH * 0.6 || busy || y < lastY - 6) header.classList.remove("is-hidden");
    else if (y > lastY + 6) header.classList.add("is-hidden");
    if (Math.abs(y - lastY) > 6) lastY = y;
    ticking = false;
  };
  update();
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  header.addEventListener("focusin", () => header.classList.remove("is-hidden"));

  // Mobile menu open/close
  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    if (open) menu.querySelector("a").focus();
  };

  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));

  // Close after choosing a link
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));

  // Close with the Escape key; keep Tab inside the open menu
  document.addEventListener("keydown", (e) => {
    if (!menu.classList.contains("is-open")) return;
    if (e.key === "Escape") {
      setOpen(false);
      toggle.focus();
    }
    if (e.key === "Tab") {
      const focusable = [toggle, ...menu.querySelectorAll("a")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Reset if the screen becomes wide (e.g. tablet rotated)
  desktopQuery.addEventListener("change", (e) => { if (e.matches) setOpen(false); });

  // Highlight the menu link for the section currently on screen
  const links = [...document.querySelectorAll(".nav-links a")];
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) =>
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id)
        );
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => observer.observe(s));
  }
}

/* ---------- 3. Fade-in sections as you scroll ---------- */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
        // Remove the stagger delay afterwards so hover effects respond instantly
        setTimeout(() => { entry.target.style.transitionDelay = ""; }, 1600);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

  // Small stagger so items in a group appear one after another
  // (capped, so long groups don't keep the last item waiting)
  items.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.transitionDelay = Math.min(siblings.indexOf(el), 5) * 90 + "ms";
    observer.observe(el);
  });
}

/* ---------- 4. Activities + "Enquire" buttons ----------
   (The 3D scenes live in the js/ folder.) */
function initActivities() {
  const activities = document.querySelectorAll("[data-activity]");
  const select = document.getElementById("f-activity");

  // Build the form's activity list from the adventures on the page
  activities.forEach((item) => {
    select.add(new Option(item.dataset.activity, item.dataset.activity));
  });
  // Keep "Not sure yet" at the bottom of the list, selected by default
  select.appendChild(select.options[0]);
  select.selectedIndex = select.options.length - 1;

  // "Enquire" buttons pre-select that activity in the form
  document.querySelectorAll("[data-enquire]").forEach((btn) => {
    btn.addEventListener("click", () => {
      select.value = btn.dataset.enquire;
      setTimeout(() => document.getElementById("f-name").focus({ preventScroll: true }), 600);
    });
  });

  // Group cards jump to a specific form field (e.g. number of people)
  document.querySelectorAll("[data-focus]").forEach((link) => {
    link.addEventListener("click", () => {
      const field = document.getElementById(link.dataset.focus);
      if (field) setTimeout(() => field.focus({ preventScroll: true }), 600);
    });
  });
}

/* Adds the <source> files set in SITE_CONFIG.heroVideos[name] to a
   <video>. Phones get the smaller "mobile" file when there is one.
   Returns false (and adds nothing) if no file is set for that name. */
function addVideoSources(video, name) {
  const files = (SITE_CONFIG.heroVideos || {})[name] || {};
  const phone = window.matchMedia("(max-width: 700px)").matches;
  const list = (phone && files.mobile ? [[files.mobile, "video/mp4"]] : [[files.webm, "video/webm"], [files.mp4, "video/mp4"]])
    .filter(([src]) => src);
  list.forEach(([src, type]) => {
    const source = document.createElement("source");
    source.src = src;
    source.type = type;
    video.appendChild(source);
  });
  return list.length > 0;
}

/* ---------- 5. Hero scenes (video, or poster photo until added) ----------
   Each scene shows while its tab's bar fills (CSS animation), then
   the next one cross-fades in. Only the scene on screen plays its
   video; the next one is loaded in the background so the change
   never shows a blank frame. Tabs switch scenes; pause button stops
   them. With "reduce motion" or data saver: no auto-advance, no video. */
function initHero() {
  const hero = document.querySelector(".hero");
  const slides = hero ? [...hero.querySelectorAll(".hero-slide")] : [];
  const tabs = hero ? [...hero.querySelectorAll(".slide-tab")] : [];

  // One picture (no slideshow): just play its video, if one is set
  if (slides.length === 1) {
    const video = slides[0].querySelector("video");
    const saveDataOne = navigator.connection && navigator.connection.saveData;
    if (!video || prefersReducedMotion || saveDataOne || !addVideoSources(video, slides[0].dataset.sceneName)) return;
    slides[0].classList.add("has-video");
    video.addEventListener("error", () => slides[0].classList.remove("has-video"), true);
    video.preload = "auto";
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
    return;
  }
  if (slides.length < 2 || tabs.length !== slides.length) return;

  const pauseBtn = document.getElementById("slide-pause");
  const note = document.getElementById("hero-media-note");
  const saveData = navigator.connection && navigator.connection.saveData;
  const useVideo = !prefersReducedMotion && !saveData;
  let current = 0;

  // Attach each scene's video files (only the ones that are set)
  const videos = slides.map((slide) => {
    const video = slide.querySelector("video");
    if (!video || !useVideo || !addVideoSources(video, slide.dataset.sceneName)) return null;
    // The video covers the 3D scene once it plays; a missing or broken
    // file just leaves the 3D scene showing
    video.addEventListener("error", () => slide.classList.remove("has-video"), true);
    slide.classList.add("has-video");
    return video;
  });
  if (note && videos.some(Boolean)) note.textContent = SITE_CONFIG.heroVideoNote;

  // Live 3D scenes (js/bumper-scene.js, js/bungee-scene.js): only the
  // one on screen renders. The outgoing one keeps moving through the
  // cross-fade, then stops, so there's never a frozen or blank frame.
  const stageOf = (slide) => { const el = slide.querySelector("[data-scene]"); return el && el.stage; };
  const offTimers = [];
  const runScenes = () => {
    const running = !hero.classList.contains("is-paused") && !hero.classList.contains("is-offscreen");
    slides.forEach((slide, i) => {
      const stage = stageOf(slide);
      if (!stage) return;
      clearTimeout(offTimers[i]);
      const wanted = i === current && running && !slide.classList.contains("has-video");
      if (wanted) stage.setActive(true);
      else offTimers[i] = setTimeout(() => stage.setActive(false), i === current ? 0 : 1600);
    });
  };
  // The scenes are built a moment after load; start the current one then
  slides.forEach((slide) => {
    const el = slide.querySelector("[data-scene]");
    if (el) new MutationObserver((_, obs) => { if (el.stage) { obs.disconnect(); runScenes(); } })
      .observe(el, { attributes: true, attributeFilter: ["class"] });
  });

  const playCurrent = () => {
    runScenes();
    videos.forEach((v, i) => {
      if (!v) return;
      const shouldPlay = i === current && !hero.classList.contains("is-paused") && !hero.classList.contains("is-offscreen");
      if (shouldPlay) {
        v.preload = "auto";
        const p = v.play();
        if (p && p.catch) p.catch(() => {}); // autoplay refused: poster stays
      } else if (i !== current) {
        // keep the outgoing scene moving through the cross-fade, then stop it
        setTimeout(() => { if (i !== current) v.pause(); }, 1600);
      } else {
        v.pause();
      }
    });
    // Start loading the next scene so it is ready when its turn comes
    const next = videos[(current + 1) % videos.length];
    if (next && next.preload === "none") { next.preload = "auto"; next.load(); }
  };

  // Hidden timer: each scene shows for its tab's --slide-ms, then the next
  // one fades in. It pauses (keeping the time left) when the visitor
  // pauses or scrolls the hero off screen.
  const durationOf = (i) => parseFloat(tabs[i].style.getPropertyValue("--slide-ms")) || 8000;
  let timer = 0, remaining = durationOf(0), startedAt = 0;
  const running = () => !hero.classList.contains("is-paused") && !hero.classList.contains("is-offscreen");
  const stopTimer = () => {
    if (!timer) return;
    clearTimeout(timer);
    timer = 0;
    remaining = Math.max(0, remaining - (performance.now() - startedAt));
  };
  const syncTimer = () => {
    if (prefersReducedMotion || !running()) { stopTimer(); return; }
    if (timer) return;
    startedAt = performance.now();
    timer = setTimeout(() => { timer = 0; show(current + 1); }, remaining);
  };

  const show = (index) => {
    stopTimer();
    current = (index + slides.length) % slides.length;
    remaining = durationOf(current);
    slides.forEach((s, i) => s.classList.toggle("is-active", i === current));
    // The next scene gets built ahead of its turn (see AW3D.whenWanted)
    slides.forEach((s, i) => s.classList.toggle("is-next", i === (current + 1) % slides.length));
    tabs.forEach((t, i) => {
      t.classList.toggle("is-active", i === current);
      t.setAttribute("aria-pressed", String(i === current));
    });
    playCurrent();
    syncTimer();
  };

  tabs.forEach((tab, i) => tab.addEventListener("click", () => show(i)));

  if (prefersReducedMotion) {
    hero.classList.add("is-static");
    return;
  }
  playCurrent();
  syncTimer();

  const setPaused = (paused) => {
    hero.classList.toggle("is-paused", paused);
    pauseBtn.setAttribute("aria-label", paused ? "Play scenes" : "Pause scenes");
    playCurrent();
    syncTimer();
  };
  pauseBtn.addEventListener("click", () => setPaused(!hero.classList.contains("is-paused")));

  // Don't keep cycling (or playing video) while the hero is off screen
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      hero.classList.toggle("is-offscreen", !entry.isIntersecting);
      playCurrent();
      syncTimer();
    }).observe(hero);
  }
}

/* ---------- 6a. Activity card videos ----------
   Each "Pick your thrill" card plays the same clip as its first-screen
   scene (SITE_CONFIG.heroVideos), muted and looping, only while the
   card is on screen. No file set: the card keeps its photo / 3D. */
function initCardVideos() {
  const saveData = navigator.connection && navigator.connection.saveData;
  if (prefersReducedMotion || saveData || !("IntersectionObserver" in window)) return;
  document.querySelectorAll(".thrill-card[data-video]").forEach((card) => {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.setAttribute("aria-hidden", "true");
    if (!addVideoSources(video, card.dataset.video)) return;
    card.querySelector(".tc-media").appendChild(video);
    card.classList.add("has-video");
    video.addEventListener("playing", () => video.classList.add("is-playing"));
    video.addEventListener("error", () => { video.remove(); card.classList.remove("has-video"); }, true);
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const p = video.play();
        if (p && p.catch) p.catch(() => {});
      } else video.pause();
    }, { rootMargin: "100px 0px" }).observe(card);
  });
}

/* ---------- 6c. Activity carousel ----------
   The current card sits in the middle with its neighbours peeking in
   at the sides, and the row loops round. Every card is moved with a
   GPU-friendly transform; JavaScript only runs while a card is
   sliding or being dragged, never while the page scrolls.
   - ← → buttons (the one used last turns yellow) and the arrow keys
   - mouse drag and touch swipe, with a flick carrying on a card or two
   - clicking a side card brings it to the middle; clicking the middle
     card opens the enquiry form (data-enquire, section 4) */
function initCarousel() {
  const root = document.getElementById("thrill-carousel");
  const track = document.getElementById("thrill-track");

  if (!root || !track) return;

  const cards = [...track.querySelectorAll(".thrill-card")];
  if (cards.length < 2) return;

  // Duplicate the cards to create a seamless scrolling loop.
  if (track.dataset.autoScroll === "true") return;
  track.dataset.autoScroll = "true";

  const originalCards = [...cards];
  originalCards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    clone.querySelectorAll("a, button").forEach((el) => {
      el.setAttribute("tabindex", "-1");
    });
    track.appendChild(clone);
  });

  root.classList.add("is-auto-scrolling");

  let position = 0;
  let lastTime = 0;
  let animationFrame = 0;
  let paused = false;

  const speed = 45; // pixels per second

  function getLoopWidth() {
    return track.scrollWidth / 2;
  }

  function animate(time) {
    if (!lastTime) lastTime = time;

    const delta = Math.min((time - lastTime) / 1000, 0.04);
    lastTime = time;

    if (!paused && !prefersReducedMotion) {
      position += speed * delta;

      const loopWidth = getLoopWidth();
      if (loopWidth > 0 && position >= loopWidth) {
        position -= loopWidth;
      }

      track.style.transform = `translate3d(${-position}px, 0, 0)`;
    }

    animationFrame = requestAnimationFrame(animate);
  }

  // Pause when the visitor hovers over the activity row.
  root.addEventListener("mouseenter", () => {
    paused = true;
  });

  root.addEventListener("mouseleave", () => {
    paused = false;
    lastTime = 0;
  });

  // Pause when the visitor touches or presses the carousel.
  root.addEventListener("pointerdown", () => {
    paused = true;
  });

  root.addEventListener("pointerup", () => {
    paused = false;
    lastTime = 0;
  });

  root.addEventListener("pointercancel", () => {
    paused = false;
    lastTime = 0;
  });

  // Keep the animation smooth when the browser tab is hidden.
  document.addEventListener("visibilitychange", () => {
    lastTime = 0;
  });

  // Stop animation if the carousel is removed from the page.
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(animationFrame);
  }, { once: true });

  if (!prefersReducedMotion) {
    animationFrame = requestAnimationFrame(animate);
  }
}

/* ---------- 6d. 3D ride scenes on the activity cards ----------
   Three.js (~600 KB) is fetched only when the carousel comes near the
   screen, and not at all on phones, low-power machines or data saver:
   those keep the card photos. js/rides-scene.js then renders only the
   card in the middle of the carousel. */
function initRideScenes() {
  const root = document.getElementById("thrill-carousel");
  if (!root || !root.querySelector("[data-ride]") || !("IntersectionObserver" in window)) return;
  const lowPower = window.matchMedia("(max-width: 760px)").matches || (navigator.hardwareConcurrency || 8) <= 4;
  const saveData = navigator.connection && navigator.connection.saveData;
  if (lowPower || saveData) return;
  const load = (src) => new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    load("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js")
      .then(() => load("js/scene-kit.js"))
      .then(() => load("js/rides-scene.js"))
      .catch(() => {}); // offline or blocked: the photos stay
  }, { rootMargin: "600px 0px" });
  io.observe(root);
}

/* ---------- 6e. Hero collage drift pauses off screen ---------- */
function initHeroDrift() {
  const hero = document.querySelector(".hero");
  if (!hero || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(([entry]) => hero.classList.toggle("is-offscreen", !entry.isIntersecting)).observe(hero);
}

/* ---------- 6b. Activity cards lean toward the mouse ---------- */
function initTilt() {
  if (prefersReducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add("is-tilting");
      card.style.setProperty("--ry", (x * 6).toFixed(2) + "deg");
      card.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
    });
    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-tilting");
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
}

/* ---------- 7. Gallery lightbox ---------- */
function initGallery() {
  const items = [...document.querySelectorAll(".gallery-item")];
  const dialog = document.getElementById("lightbox");
  if (!items.length || !dialog || typeof dialog.showModal !== "function") return;

  const img = document.getElementById("lb-img");
  const caption = document.getElementById("lb-caption");
  let current = 0;
  let lastFocused = null;

  // Each new photo fades in once it has loaded
  img.addEventListener("load", () => img.classList.add("is-loaded"));

  const show = (index) => {
    current = (index + items.length) % items.length;
    const thumb = items[current].querySelector("img");
    img.classList.remove("is-loaded");
    img.src = items[current].dataset.full || thumb.src;
    img.alt = thumb.alt;
    caption.textContent = `${thumb.alt} (${current + 1} of ${items.length})`;
  };

  items.forEach((item, i) => {
    item.addEventListener("click", () => {
      lastFocused = item;
      show(i);
      dialog.showModal();
    });
  });

  dialog.querySelector(".lb-close").addEventListener("click", () => dialog.close());
  dialog.querySelector(".lb-prev").addEventListener("click", () => show(current - 1));
  dialog.querySelector(".lb-next").addEventListener("click", () => show(current + 1));

  // Click on the dark area (not the photo) closes it
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });

  dialog.addEventListener("close", () => {
    img.src = "data:,";
    if (lastFocused) lastFocused.focus();
  });
}

/* ---------- 8. Enquiry form ---------- */
function initForm() {
  const form = document.getElementById("enquiry-form");
  const status = document.getElementById("form-status");
  const dateInput = document.getElementById("f-date");

  // Don't allow dates in the past
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const todayStr = today.toISOString().slice(0, 10);
  dateInput.min = todayStr;

  const rules = {
    name: (v) => (v.trim().length < 2 ? "Please enter your name." : ""),
    phone: (v) => {
      const digits = v.replace(/[\s\-()]/g, "");
      if (!digits) return "Please enter your phone number.";
      return /^(\+?91|0)?[6-9]\d{9}$/.test(digits) ? "" : "Please enter a valid 10-digit Indian mobile number.";
    },
    email: (v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "Please enter a valid email address, or leave it empty." : ""),
    people: (v) => (v && (!Number.isInteger(+v) || +v < 1 || +v > 500) ? "Please enter a number between 1 and 500." : ""),
    date: (v) => (v && v < todayStr ? "Please choose today or a future date." : ""),
    message: (v) => (v.length > 500 ? "Please keep your message under 500 characters." : "")
  };

  const validateField = (name) => {
    const input = form.elements[name];
    const message = rules[name](input.value);
    const errorEl = document.getElementById(input.id + "-err");
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (errorEl) errorEl.textContent = message;
    return !message;
  };

  // Re-check a field when the visitor leaves it, if it was already wrong
  Object.keys(rules).forEach((name) => {
    form.elements[name].addEventListener("blur", () => {
      if (form.elements[name].getAttribute("aria-invalid") === "true" || form.elements[name].value) validateField(name);
    });
  });

  const showStatus = (type, html) => {
    status.className = "form-status is-" + type;
    status.innerHTML = html;
    status.hidden = false;
  };

  const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.hidden = true;

    const results = Object.keys(rules).map(validateField);
    if (results.includes(false)) {
      form.querySelector('[aria-invalid="true"]').focus();
      showStatus("error", "Please fix the highlighted fields and try again.");
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const summary =
      `Enquiry for Adventure World\n\n` +
      `Name: ${data.name}\nPhone: ${data.phone}\n` +
      (data.email ? `Email: ${data.email}\n` : "") +
      `Interested in: ${data.activity}\n` +
      (data.people ? `Number of people: ${data.people}\n` : "") +
      (data.date ? `Preferred date: ${data.date}\n` : "") +
      (data.message ? `\nMessage: ${data.message}\n` : "");

    const { enquiryMethod, email, whatsapp, formEndpoint } = SITE_CONFIG;
    const name = escapeHtml(data.name.trim());

    if (enquiryMethod === "email" && email) {
      window.location.href =
        `mailto:${email}?subject=${encodeURIComponent("Enquiry from " + data.name)}&body=${encodeURIComponent(summary)}`;
      showStatus("info", `Thanks, ${name}. Your email app should open with your enquiry filled in. <strong>Please press Send there</strong>; nothing is sent until you do. This is an enquiry, not a booking.`);
      return;
    }

    if (enquiryMethod === "whatsapp" && whatsapp) {
      window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(summary)}`, "_blank", "noopener");
      showStatus("info", `Thanks, ${name}. WhatsApp should open with your enquiry. <strong>Please press Send there</strong> to reach the park. This is an enquiry, not a booking.`);
      return;
    }

    if (enquiryMethod === "endpoint" && formEndpoint) {
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = "Sending…";
      try {
        const res = await fetch(formEndpoint, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form)
        });
        if (!res.ok) throw new Error("Server responded " + res.status);
        form.reset();
        form.elements.activity.selectedIndex = form.elements.activity.options.length - 1;
        showStatus("success", `Thanks, ${name}! Your enquiry has been sent. The park team will get back to you. Please note this is <strong>not a booking confirmation</strong>.`);
      } catch (err) {
        showStatus("error", "Sorry, your enquiry couldn't be sent right now. Please try again later.");
      } finally {
        button.disabled = false;
        button.textContent = "Send Enquiry";
      }
      return;
    }

    // Default: no sending method configured yet. Be honest about it.
    showStatus("info", `Thanks, ${name}, your details look good. However, <strong>online enquiries aren't connected yet, so nothing has been sent.</strong> Please contact the park directly once its contact details are published.`);
  });
}

/* ---------- 9. Small extras ---------- */
function initExtras() {
  // Current year in the footer
  document.getElementById("year").textContent = new Date().getFullYear();

  // If an online photo fails to load, hide it so the coloured
  // background shows instead of a broken-image icon
  const isBlank = (img) => img.src.startsWith("data:");
  document.querySelectorAll("img").forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && !isBlank(img)) img.classList.add("img-failed");
    img.addEventListener("error", () => { if (!isBlank(img)) img.classList.add("img-failed"); });
    img.addEventListener("load", () => img.classList.remove("img-failed"));
  });
}

applyConfig();
initNav();
initReveal();
initActivities();
initHero();
initCardVideos();
initCarousel();
initRideScenes();
initHeroDrift();
initTilt();
initGallery();
initForm();
initExtras();
const customCursor = document.querySelector(".custom-cursor");

if (customCursor) {
  document.addEventListener("mousemove", (event) => {
    customCursor.style.left = `${event.clientX}px`;
    customCursor.style.top = `${event.clientY}px`;
  });
  document.addEventListener("mousedown", () => {
  customCursor.style.width = "20px";
  customCursor.style.height = "20px";
});

document.addEventListener("mouseup", () => {
  customCursor.style.width = "20px";
  customCursor.style.height = "20px";
});

}
/* Adventure World Feedback Form */

const feedbackForm = document.getElementById("feedback-form");

if (feedbackForm) {
  feedbackForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("visitor-name").value.trim();
    const rating = feedbackForm.querySelector(
      'input[name="rating"]:checked'
    );
    const message = document.getElementById("feedback-message");

    if (!rating) {
      message.textContent = "Please select a star rating.";
      return;
    }

    message.textContent =
      `Thank you, ${name}! Your ${rating.value}-star feedback is appreciated.`;

    feedbackForm.reset();
  });
}
/* Adventure World - Automatic Game Carousel */

(function () {
  const carousel = document.getElementById("game-carousel");

  if (!carousel) return;

  const cards = Array.from(
    carousel.querySelectorAll(".game-card")
  );

  const counter = document.getElementById("game-counter");
  const progressBar = document.getElementById("game-progress-bar");

  if (cards.length === 0) return;

  let currentIndex = 0;

  function showGame(index) {
    cards.forEach((card, i) => {
      card.classList.toggle("active", i === index);
    });

    if (counter) {
      counter.textContent =
        `${String(index + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
    }

    if (progressBar) {
      progressBar.style.width =
        `${((index + 1) / cards.length) * 100}%`;
    }
  }

  showGame(currentIndex);

  if (cards.length > 1) {
    setInterval(() => {
      currentIndex = (currentIndex + 1) % cards.length;
      showGame(currentIndex);
    }, 1000);
  }
})();
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("aw-contact-form");
  const status = document.getElementById("aw-form-status");
  const visitDate = document.getElementById("aw-date");

  if (!form || !status) return;

  // Prevent selecting a date in the past.
  if (visitDate) {
    const today = new Date();
    const localToday = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");

    visitDate.min = localToday;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    status.textContent =
      "Your form looks complete, but online submission is not connected yet. Please connect a backend or enquiry service to receive messages.";

    status.style.color = "#246b30";
  });
});