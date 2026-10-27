/* ==========================================================
   ADVENTURE WORLD — 3D SCENE KIT
   Shared helpers for the real-time 3D scenes. Uses Three.js r128,
   loaded from cdnjs in index.html (no install needed).

   Every scene built with createStage():
   - is only built when it scrolls near the screen (lazy),
   - only renders while it is visible (pauses otherwise),
   - follows its container's size, and survives a lost WebGL context,
   - shows its fallback photo if WebGL is unavailable.
   ========================================================== */
window.AW3D = (function () {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const smallScreen = window.matchMedia("(max-width: 760px)").matches;
  // Phones and low-core machines get fewer trees, no shadows, lower resolution
  const lowPower = smallScreen || (navigator.hardwareConcurrency || 8) <= 4;

  /* ---------- Small maths helpers ---------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  // Smooth 0→1 between a and b (works when a > b too)
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  // Frame-rate independent easing toward a target
  const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));

  // Value noise + fractal noise (used for terrain shape and colour)
  function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, octaves = 5) {
    let sum = 0, amp = 0.5, freq = 1;
    for (let i = 0; i < octaves; i++) { sum += amp * noise(x * freq, y * freq); freq *= 2.03; amp *= 0.5; }
    return sum / 0.97; // roughly 0..1
  }
  // Seeded random, so the scenes look the same on every visit
  function seeded(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  function supported() {
    if (!window.THREE) return false;
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) { return false; }
  }

  // sRGB colour → linear (Three r128 expects linear colours with sRGB output)
  const col = (hex) => new THREE.Color(hex).convertSRGBToLinear();

  // Run `init` once, when `el` comes within one screen of the viewport
  function whenNear(el, init) {
    if (!("IntersectionObserver" in window)) { init(); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); init(); }
    }, { rootMargin: "100% 0px" });
    io.observe(el);
  }

  // Hero scenes are stacked; build one only when its slide is showing
  // or is next in line (script.js marks it .is-next), so the page loads
  // quickly. Every other scene is built when it scrolls near.
  function whenWanted(el, init) {
    const slide = el.closest(".hero-slide");
    if (!slide) { whenNear(el, init); return; }
    const ready = () => slide.classList.contains("is-active") || slide.classList.contains("is-next");
    if (ready()) { whenNear(el, init); return; }
    const mo = new MutationObserver(() => { if (ready()) { mo.disconnect(); whenNear(el, init); } });
    mo.observe(slide, { attributes: true, attributeFilter: ["class"] });
  }

  // Show the photo instead, and switch the section's caption to "Sample photo"
  function showFallback(container) {
    container.classList.add("is-fallback");
    const section = container.closest("section");
    if (section) section.classList.add("scene-fallback-on");
  }

  /* ---------- Stage: renderer + scene + camera + render loop ---------- */
  function createStage(container, opts = {}) {
    if (!supported()) { showFallback(container); return null; }
    // Extra scenes marked data-optional (the activity cards) keep their
    // photo on phones and low-power machines, to spare the battery
    if (lowPower && container.hasAttribute("data-optional")) { showFallback(container); return null; }
    // Outside the hero a scene just runs; in the hero only the slide showing does
    if (opts.active === undefined) {
      const slide = container.closest(".hero-slide");
      opts.active = !slide || slide.classList.contains("is-active");
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !lowPower, powerPreference: "high-performance" });
    } catch (e) { showFallback(container); return null; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = opts.exposure || 1;
    renderer.shadowMap.enabled = !lowPower && opts.shadows !== false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.className = "scene-canvas";
    canvas.setAttribute("aria-hidden", "true"); // the section text describes the scene
    container.prepend(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(opts.fov || 40, 1, opts.near || 0.1, opts.far || 1500);
    const clock = new THREE.Clock(false);

    const stage = {
      renderer, scene, camera, container, canvas, lowPower, reducedMotion, finePointer,
      visible: false, onFrame: null, onResize: null
    };

    let raf = 0;
    const frame = () => {
      raf = 0;
      if (!clock.running) clock.start();
      const dt = Math.min(clock.getDelta(), 1 / 20);
      if (stage.onFrame) stage.onFrame(dt, clock.elapsedTime);
      renderer.render(scene, camera);
      if (!stage.ready) { stage.ready = true; container.classList.add("is-ready"); } // CSS fades the canvas in
      // Keep animating only while on screen, active, the tab is visible and motion is allowed
      if (stage.visible && stage.active && !document.hidden && !reducedMotion) raf = requestAnimationFrame(frame);
    };
    // Draw a frame soon (also restarts the loop after a pause)
    stage.invalidate = () => { if (!raf && !stage.lost) raf = requestAnimationFrame(frame); };
    // Scenes stacked on top of each other (the hero) switch rendering on and off
    stage.active = opts.active !== false;
    stage.setActive = (on) => {
      stage.active = on;
      if (on) { clock.getDelta(); stage.invalidate(); }
    };

    const resize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (stage.onResize) stage.onResize(w, h);
      stage.invalidate();
    };

    const visibility = new IntersectionObserver(([entry]) => {
      stage.visible = entry.isIntersecting;
      if (stage.visible && stage.active) { clock.getDelta(); stage.invalidate(); } // getDelta: skip the paused time
    });
    visibility.observe(container);
    const sizeWatch = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    if (sizeWatch) sizeWatch.observe(container); else window.addEventListener("resize", resize);
    const onTabChange = () => { if (!document.hidden && stage.visible && stage.active) { clock.getDelta(); stage.invalidate(); } };
    document.addEventListener("visibilitychange", onTabChange);

    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      stage.lost = true;
      cancelAnimationFrame(raf);
      showFallback(container);
    });

    stage.dispose = () => {
      cancelAnimationFrame(raf);
      visibility.disconnect();
      if (sizeWatch) sizeWatch.disconnect();
      document.removeEventListener("visibilitychange", onTabChange);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        [].concat(obj.material || []).forEach((m) => {
          Object.keys(m).forEach((k) => { if (m[k] && m[k].isTexture) m[k].dispose(); });
          m.dispose();
        });
      });
      renderer.dispose();
      canvas.remove();
    };

    container.classList.add("has-3d");
    resize();
    return stage;
  }

  /* ---------- Pointer: smoothed position over an element, -1..1 ---------- */
  function pointer(target) {
    const p = { x: 0, y: 0, tx: 0, ty: 0 };
    if (!finePointer || reducedMotion) { p.update = () => {}; return p; }
    target.addEventListener("pointermove", (e) => {
      const r = target.getBoundingClientRect();
      p.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      p.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    });
    target.addEventListener("pointerleave", () => { p.tx = 0; p.ty = 0; });
    p.update = (dt) => { p.x = damp(p.x, p.tx, 3, dt); p.y = damp(p.y, p.ty, 3, dt); };
    return p;
  }

  /* ---------- Geometry & texture helpers ---------- */
  // Box with rounded edges (extruded rounded rectangle with a bevel)
  function roundedBox(w, h, d, r, segments = 4) {
    const shape = new THREE.Shape();
    const x = -(w / 2 - r), y = -(h / 2 - r), iw = w - 2 * r, ih = h - 2 * r, cr = Math.min(r, iw / 2, ih / 2) * 0.5;
    shape.moveTo(x + cr, y);
    shape.lineTo(x + iw - cr, y); shape.quadraticCurveTo(x + iw, y, x + iw, y + cr);
    shape.lineTo(x + iw, y + ih - cr); shape.quadraticCurveTo(x + iw, y + ih, x + iw - cr, y + ih);
    shape.lineTo(x + cr, y + ih); shape.quadraticCurveTo(x, y + ih, x, y + ih - cr);
    shape.lineTo(x, y + cr); shape.quadraticCurveTo(x, y, x + cr, y);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r,
      bevelSegments: segments, curveSegments: segments * 2
    });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }

  // Combine several geometries into one (fewer draw calls)
  function mergeGeometries(list) {
    const parts = list.map((g) => (g.index ? g.toNonIndexed() : g));
    let count = 0;
    parts.forEach((g) => { count += g.attributes.position.count; });
    const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3);
    let offset = 0;
    parts.forEach((g) => {
      pos.set(g.attributes.position.array, offset * 3);
      nor.set(g.attributes.normal.array, offset * 3);
      offset += g.attributes.position.count;
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    return out;
  }

  // Cylinder stretched between two points (struts, rails, poles)
  function strut(a, b, radius, material, radial = 8) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dir.length(), radial), material);
    mesh.position.copy(a).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    mesh.castShadow = true;
    return mesh;
  }

  function canvasTexture(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    return tex;
  }

  // Soft round glow, for clouds, haze and light bulbs
  function glowTexture(inner = "rgba(255,255,255,1)", outer = "rgba(255,255,255,0)") {
    return canvasTexture(128, 128, (g, w, h) => {
      const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      grd.addColorStop(0, inner);
      grd.addColorStop(1, outer);
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    });
  }

  // Reflection map made from a simple "room" of light panels, so glossy
  // paint and chrome have something believable to reflect
  function studioEnvironment(renderer, panels) {
    const room = new THREE.Scene();
    room.background = col(panels.background || "#1a1d1b");
    const box = new THREE.BoxGeometry(1, 1, 1);
    panels.lights.forEach((p) => {
      const m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: new THREE.Color(p.color).multiplyScalar(p.intensity || 1) }));
      m.position.set(p.x, p.y, p.z);
      m.scale.set(p.w, p.h, p.d);
      room.add(m);
    });
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(room, 0.02).texture;
    pmrem.dispose();
    box.dispose();
    return env;
  }

  /* ---------- Person: simple jointed figure (feet at y = 0) ----------
     Returns groups you can rotate: legs and arms swing from the hip and
     shoulder, `body` holds everything above the feet. Adult is about
     1.7 units tall; scale ~0.75 makes a child. */
  let personGeo = null;
  function person({ skin = "#a86d47", shirt = "#e4574a", shorts = "#2b3a55", hair = "#16110d", shoes = "#f2f0ea", scale = 1, helmet = null } = {}) {
    if (!personGeo) {
      personGeo = {
        torso: roundedBox(0.4, 0.58, 0.24, 0.1, 3),
        hips: roundedBox(0.38, 0.2, 0.24, 0.08, 2),
        head: new THREE.SphereGeometry(0.13, 22, 16),
        hair: new THREE.SphereGeometry(0.138, 22, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
        helmet: new THREE.SphereGeometry(0.17, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
        limb: new THREE.CylinderGeometry(0.055, 0.045, 1, 10).translate(0, -0.5, 0), // hangs down from its joint
        thigh: new THREE.CylinderGeometry(0.075, 0.06, 1, 10).translate(0, -0.5, 0),
        hand: new THREE.SphereGeometry(0.05, 10, 8),
        shoe: roundedBox(0.11, 0.07, 0.22, 0.03, 2)
      };
    }
    const G = personGeo;
    const mat = (c, r = 0.7) => new THREE.MeshStandardMaterial({ color: col(c), roughness: r });
    const M = { skin: mat(skin, 0.6), shirt: mat(shirt), shorts: mat(shorts), hair: mat(hair, 0.9), shoes: mat(shoes, 0.5) };
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);
    root.scale.setScalar(scale);
    const mesh = (geo, m, parent, x, y, z) => {
      const o = new THREE.Mesh(geo, m);
      o.position.set(x, y, z);
      o.castShadow = true;
      parent.add(o);
      return o;
    };
    mesh(G.hips, M.shorts, body, 0, 0.92, 0);
    const torso = new THREE.Group();
    torso.position.y = 1.0;
    body.add(torso);
    mesh(G.torso, M.shirt, torso, 0, 0.28, 0);
    const head = new THREE.Group();
    head.position.y = 0.62;
    torso.add(head);
    mesh(G.head, M.skin, head, 0, 0.1, 0);
    if (helmet) mesh(G.helmet, mat(helmet, 0.25), head, 0, 0.12, 0);
    else mesh(G.hair, M.hair, head, 0, 0.13, -0.01).rotation.x = -0.3;

    const limb = (parent, x, y, len, m, geo, end) => {
      const j = new THREE.Group();
      j.position.set(x, y, 0);
      parent.add(j);
      const l = mesh(geo, m, j, 0, 0, 0);
      l.scale.y = len;
      if (end) end(j, len);
      return j;
    };
    const hand = (j, len) => mesh(G.hand, M.skin, j, 0, -len - 0.03, 0);
    const foot = (j, len) => mesh(G.shoe, M.shoes, j, 0, -len - 0.02, 0.05);
    const armL = limb(torso, -0.25, 0.52, 0.56, M.skin, G.limb, hand);
    const armR = limb(torso, 0.25, 0.52, 0.56, M.skin, G.limb, hand);
    const legL = limb(body, -0.1, 0.86, 0.84, M.shorts, G.thigh, foot);
    const legR = limb(body, 0.1, 0.86, 0.84, M.shorts, G.thigh, foot);
    armL.rotation.z = -0.12; armR.rotation.z = 0.12;
    return { root, body, torso, head, armL, armR, legL, legR };
  }

  return {
    reducedMotion, finePointer, lowPower, smallScreen,
    clamp, lerp, smooth, easeInOut, easeOut, damp, noise, fbm, seeded, col,
    supported, whenNear, whenWanted, createStage, pointer,
    roundedBox, mergeGeometries, strut, canvasTexture, glowTexture, studioEnvironment, person
  };
})();
