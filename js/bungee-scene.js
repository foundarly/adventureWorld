/* ==========================================================
   ADVENTURE WORLD — BUNGEE JUMPING 3D SCENE (scroll-driven)
   The section is tall; its 3D view stays pinned while you scroll.
   Scroll progress (0 → 1) plays a short, staged sequence:
     0.00–0.24  the camera approaches the platform
     0.24–0.46  it looks over the edge to show the height
     0.46–0.80  the jumper leans, leaves the platform, the cord
                catches them and they settle after gentle rebounds
     0.80–1.00  the camera pulls back to a wide valley view
   Scrolling back up plays it in reverse.

   With data-mode="hero" the same jump plays by itself as the
   first-screen background: each time the scene is switched on
   (el.stage.setActive, from script.js) the sequence restarts and
   runs from the platform view, through the leap and the rebound.
   ========================================================== */
(function () {
  "use strict";
  const K = window.AW3D;
  if (!K) return;

  document.querySelectorAll('[data-scene="bungee"]').forEach((section) => {
  const heroMode = section.dataset.mode === "hero";
  const el = heroMode ? section : section.querySelector(".bungee-stage");
  if (!el) return;

  // With "reduce motion" the section is a single still view
  if (K.reducedMotion && !heroMode) section.classList.add("is-static");

  K.whenWanted(section, () => {
    const stage = K.createStage(el, { fov: 42, far: 1500, exposure: 1.05 });
    if (!stage) { if (!heroMode) section.classList.add("is-static"); return; }
    el.stage = stage;

    const world = K.buildValley(stage);
    const { jumper } = world;
    const camera = stage.camera;
    const ptr = K.pointer(heroMode ? section.closest(".hero") || section : section);
    const steps = [...section.querySelectorAll(".bungee-steps li")];

    /* ----- Camera path: key positions along the scroll ----- */
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const KEYS = [
      { p: 0.00, pos: V(4, 78, 175),      look: V(15, 36, 0) },     // far down the valley
      { p: 0.24, pos: V(25.5, 43.4, 6.5), look: V(10, 38.5, -0.8) }, // beside the platform, over the shoulder
      { p: 0.40, pos: V(-6, 26, 36),      look: V(13, 33, 0) },     // across the gorge: platform high above the river
      { p: 0.46, pos: V(-5, 26.5, 35),    look: V(12, 36, 0) },
      { p: 0.64, pos: V(-3, 24, 32),      look: V(10, 24, 0) },     // side view of the fall
      { p: 0.80, pos: V(-1, 19, 40),      look: V(11, 19, 0) },
      { p: 1.00, pos: V(2, 70, 150),      look: V(14, 27, 0) }      // wide valley view
    ];
    const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), body = new THREE.Vector3();
    function cameraAt(p) {
      let i = 0;
      while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
      const a = KEYS[i], b = KEYS[i + 1];
      const t = K.easeInOut(K.clamp((p - a.p) / (b.p - a.p), 0, 1));
      camPos.lerpVectors(a.pos, b.pos, t);
      camLook.lerpVectors(a.look, b.look, t);
    }

    /* ----- Jumper sequence (j from 0 to 1 during the jump) ----- */
    const EDGE = world.edge.clone();
    const LEAVE_X = EDGE.x - 3.4, LEAVE_Y = EDGE.y - 6.5;
    const DROP = 20; // deepest point below where the jumper leaves the platform
    function poseJumper(p) {
      const { root, pitch, blendPose } = jumper;
      const j = K.clamp((p - 0.46) / 0.34, 0, 1);
      root.position.copy(EDGE);
      pitch.rotation.x = 0;

      if (j === 0) {                          // standing, getting ready
        blendPose("stand", "ready", K.smooth(0.28, 0.45, p));
      } else if (j < 0.18) {                  // lean out over the edge
        const a = j / 0.18;
        blendPose("ready", "dive", a * 0.7);
        pitch.rotation.x = 0.55 * K.easeInOut(a);
      } else if (j < 0.38) {                  // leave the platform, turning head-down
        const u = (j - 0.18) / 0.2;
        blendPose("ready", "dive", 0.7 + 0.3 * u);
        root.position.x = EDGE.x - 3.4 * u;
        root.position.y = EDGE.y + 2 * u * (1 - u) - 6.5 * u * u;
        pitch.rotation.x = K.lerp(0.55, Math.PI, K.easeInOut(u));
      } else {                                // fall, the cord catches, gentle rebounds
        const s = (j - 0.38) / 0.62;
        let depth;
        if (s < 0.38) depth = DROP * Math.pow(s / 0.38, 2);
        else {
          const u = (s - 0.38) / 0.62;
          depth = DROP * (0.8 + 0.2 * Math.exp(-3 * u) * Math.cos(7.5 * u));
        }
        blendPose("dive", "hang", K.smooth(0.35, 0.9, s));
        root.position.x = K.lerp(LEAVE_X, world.anchor.x, K.smooth(0, 0.6, s)); // swings back under the anchor
        root.position.y = LEAVE_Y - depth;
        pitch.rotation.x = Math.PI + 0.12 * Math.sin(s * 9) * Math.exp(-2.5 * s);
      }
      world.updateCord();
    }

    /* ----- Scroll progress ----- */
    let target = 0, progress = 0;
    const measure = () => {
      const r = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      target = total > 0 ? K.clamp(-r.top / total, 0, 1) : 0;
    };

    // Hero: time drives the sequence. From the view across the gorge
    // (0.30) through the leap and rebound to the start of the wide
    // view (0.86), over JUMP_SECONDS; then it holds until restarted.
    const JUMP_SECONDS = 9.5;
    let clockTime = 0;
    if (heroMode) {
      const setActive = stage.setActive;
      stage.setActive = (on) => { if (on && !stage.active) clockTime = 0; setActive(on); };
      target = progress = 0.30;
    } else {
      measure();
      progress = target; // start where the visitor already is (e.g. after a reload)
      window.addEventListener("scroll", measure, { passive: true });
      window.addEventListener("resize", measure, { passive: true });
    }
    if (K.reducedMotion) target = progress = 0.3; // one calm view: the platform and the gorge

    let lastStep = -1;
    stage.onFrame = (dt, t) => {
      ptr.update(dt);
      if (heroMode && !K.reducedMotion) {
        clockTime += dt;
        // Outside the hero (an activity card) the jump repeats after a pause
        if (!section.closest(".hero-slide") && clockTime > JUMP_SECONDS + 2.5) clockTime = 0;
        const u = K.clamp(clockTime / JUMP_SECONDS, 0, 1);
        progress = K.lerp(0.30, 0.86, u < 0.5 ? u * 0.9 : 0.45 + (u - 0.5) * 1.1); // a beat longer on the platform
      } else if (!K.reducedMotion) progress = K.damp(progress, target, 4, dt);
      const p = progress;

      poseJumper(p);
      cameraAt(p);
      // During the fall, the camera keeps the jumper in view
      const follow = K.smooth(0.46, 0.54, p) * (1 - K.smooth(0.84, 0.98, p));
      body.copy(jumper.root.position);
      body.y += 0.9 * Math.cos(jumper.pitch.rotation.x);
      camLook.lerp(body, follow * 0.92);
      camPos.x += ptr.x * 1.2;
      camPos.y -= ptr.y * 0.8;
      camera.position.copy(camPos);
      camera.lookAt(camLook);
      world.tick(dt, t);

      if (heroMode) return;
      // Story steps beside the scene
      section.style.setProperty("--progress", p.toFixed(3));
      const step = p < 0.24 ? 0 : p < 0.46 ? 1 : p < 0.8 ? 2 : 3;
      if (step !== lastStep) {
        steps.forEach((li, i) => li.classList.toggle("is-active", i === step));
        lastStep = step;
      }
    };
    stage.invalidate();
  });
  });
})();
