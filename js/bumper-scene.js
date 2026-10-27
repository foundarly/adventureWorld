/* ==========================================================
   ADVENTURE WORLD — BUMPING CARS 3D SCENE
   An indoor bumper-car arena: reflective steel floor, padded
   barrier, electrified ceiling grid and warm lights. Glossy cars
   (clear-coat paint, rubber bumpers, chrome, headlights, seats,
   steering wheels, contact poles) drive smooth laps while the
   nearest car idles close to the viewer.

   Interaction: drag to look around (or use the buttons), the view
   follows the mouse slightly, and "Reset view" returns to the
   starting angle. This is an illustration, not the park's ride.

   With data-mode="hero" the same arena plays as the first-screen
   background instead: a wide shot, the camera slowly circling, no
   dragging. script.js switches it on and off (el.stage.setActive).
   ========================================================== */
(function () {
  "use strict";
  const K = window.AW3D;
  if (!K) return;

  document.querySelectorAll('[data-scene="bumper"]').forEach((el) => {
  const heroMode = el.dataset.mode === "hero";

  K.whenWanted(el, () => {
    const stage = K.createStage(el, { fov: heroMode ? 40 : 34, far: 140, exposure: 0.92 });
    if (!stage) return;
    el.stage = stage;
    const { scene, renderer, camera, canvas } = stage;
    const col = K.col;
    const rand = K.seeded(5);

    /* ---------- Atmosphere & reflections ---------- */
    scene.background = col("#141815");
    scene.fog = new THREE.Fog(col("#141815"), 16, 50);
    const strip = (x, z, w, d, color, intensity) => ({ x, y: 7, z, w, h: 0.3, d, color, intensity });
    scene.environment = K.studioEnvironment(renderer, {
      background: "#15191a",
      lights: [
        strip(0, -4, 16, 1.2, "#fff1d6", 3), strip(0, 0, 16, 1.2, "#fff1d6", 3), strip(0, 4, 16, 1.2, "#fff1d6", 3),
        { x: -10, y: 2, z: 0, w: 0.3, h: 3, d: 12, color: "#A6F5A8", intensity: 1.1 },
        { x: 10, y: 2.5, z: 0, w: 0.3, h: 4, d: 12, color: "#ffd7a0", intensity: 1.5 },
        { x: 0, y: 1.5, z: 10, w: 14, h: 2, d: 0.3, color: "#D9B88F", intensity: 0.8 }
      ]
    });

    /* ---------- Lights ---------- */
    scene.add(new THREE.HemisphereLight(col("#fff3e0"), col("#2a302c"), 0.7));
    const key = new THREE.DirectionalLight(col("#fff0d8"), 1.8);
    key.position.set(2, 12, 5);
    if (renderer.shadowMap.enabled) {
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      Object.assign(key.shadow.camera, { left: -17, right: 17, top: 14, bottom: -14, near: 1, far: 30 });
      key.shadow.bias = -0.0005;
      key.shadow.normalBias = 0.02;
    }
    scene.add(key);
    const warm = new THREE.PointLight(col("#ffd59a"), 1.4, 18);
    warm.position.set(-5, 4, 2);
    const lime = new THREE.PointLight(col("#A6F5A8"), 0.9, 15);
    lime.position.set(6, 2.5, -6);
    scene.add(warm, lime);

    /* ---------- Arena ---------- */
    const RX = 15, RZ = 11; // inner size of the oval barrier
    const steel = new THREE.MeshStandardMaterial({ color: col("#30353a"), metalness: 0.8, roughness: 0.35 });
    const darkSteel = new THREE.MeshStandardMaterial({ color: col("#2a2f2c"), metalness: 0.4, roughness: 0.6 });

    // Hall around the arena: a curved back wall and a dark ceiling, so the
    // space reads as an indoor hall rather than an empty void
    const hall = new THREE.Mesh(new THREE.CylinderGeometry(21, 21, 7.5, 64, 1, true),
      new THREE.MeshStandardMaterial({ color: col("#2b302d"), roughness: 0.92, side: THREE.BackSide }));
    hall.scale.z = 0.8;
    hall.position.y = 3.7;
    hall.receiveShadow = true;
    scene.add(hall);
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(50, 40), new THREE.MeshStandardMaterial({ color: col("#1c201e"), roughness: 1 }));
    roof.rotation.x = Math.PI / 2;
    roof.position.y = 7.4;
    scene.add(roof);

    const plates = K.canvasTexture(512, 512, (g, w, h) => {
      g.fillStyle = "#2c302d"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) {               // fine speckle so the steel isn't flat
        g.fillStyle = `rgba(${rand() > 0.5 ? "255,255,255" : "0,0,0"},${rand() * 0.05})`;
        g.fillRect(rand() * w, rand() * h, 2, 2);
      }
      g.strokeStyle = "rgba(0,0,0,0.55)"; g.lineWidth = 3;
      for (let i = 0; i <= 4; i++) {                  // plate seams
        g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke();
        g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke();
      }
    });
    plates.wrapS = plates.wrapT = THREE.RepeatWrapping;
    plates.repeat.set(7, 7);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 70),
      new THREE.MeshStandardMaterial({ map: plates, metalness: 0.55, roughness: 0.4, envMapIntensity: 0.6 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Barrier wall (an oval ring), padded rubber rim and an accent stripe
    const wallShape = new THREE.Shape();
    wallShape.absellipse(0, 0, RX + 0.4, RZ + 0.4, 0, Math.PI * 2, false, 0);
    const hole = new THREE.Path();
    hole.absellipse(0, 0, RX, RZ, 0, Math.PI * 2, true, 0);
    wallShape.holes.push(hole);
    const wallGeo = new THREE.ExtrudeGeometry(wallShape, { depth: 0.75, bevelEnabled: false, curveSegments: 96 });
    wallGeo.rotateX(-Math.PI / 2);
    const wall = new THREE.Mesh(wallGeo, new THREE.MeshStandardMaterial({ color: col("#202622"), roughness: 0.6 }));
    wall.castShadow = wall.receiveShadow = true;
    scene.add(wall);
    const ovalCurve = (rx, rz, y) => new THREE.CatmullRomCurve3(
      new THREE.EllipseCurve(0, 0, rx, rz).getPoints(160).slice(0, -1).map((v) => new THREE.Vector3(v.x, y, v.y)), true);
    const rubber = new THREE.MeshStandardMaterial({ color: col("#121513"), roughness: 0.82 });
    const rim = new THREE.Mesh(new THREE.TubeGeometry(ovalCurve(RX + 0.05, RZ + 0.05, 0.82), 260, 0.2, 12, true), rubber);
    rim.castShadow = true;
    scene.add(rim);
    const limeMat = new THREE.MeshStandardMaterial({ color: col("#A6F5A8"), emissive: col("#A6F5A8"), emissiveIntensity: 0.3, roughness: 0.4 });
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(ovalCurve(RX - 0.01, RZ - 0.01, 0.42), 260, 0.035, 6, true), limeMat));

    // Ceiling: electrified steel grid the car poles touch, with rows of warm bulbs
    const CEIL = 4.6;
    const bar = new THREE.BoxGeometry(1, 1, 1);
    const gridBars = [];
    for (let z = -11.4; z <= 11.4; z += 1.2) gridBars.push([0, z, 33, 0.035]);
    for (let x = -16.2; x <= 16.2; x += 1.2) gridBars.push([x, 0, 0.035, 24]);
    const grid = new THREE.InstancedMesh(bar, darkSteel, gridBars.length);
    const mtx = new THREE.Matrix4();
    gridBars.forEach(([x, z, sx, sz], i) => grid.setMatrixAt(i, mtx.compose(
      new THREE.Vector3(x, CEIL, z), new THREE.Quaternion(), new THREE.Vector3(sx, 0.035, sz))));
    scene.add(grid);

    const bulbSpots = [];
    [-7, -2.3, 2.3, 7].forEach((z) => { for (let x = -14; x <= 14; x += 1.75) bulbSpots.push([x, CEIL - 0.12, z]); });
    const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 10, 8),
      new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe2b0").multiplyScalar(1.6) }), bulbSpots.length);
    bulbSpots.forEach(([x, y, z], i) => bulbs.setMatrixAt(i, mtx.makeTranslation(x, y, z)));
    scene.add(bulbs);
    const halo = K.glowTexture("rgba(255,214,150,0.9)", "rgba(255,214,150,0)");
    bulbSpots.forEach(([x, y, z], i) => {
      if (i % 2) return;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 }));
      s.position.set(x, y, z);
      s.scale.set(0.9, 0.9, 1);
      scene.add(s);
    });

    // Posts around the barrier hold up the ceiling
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      scene.add(K.strut(new THREE.Vector3(Math.cos(a) * (RX + 1), 0, Math.sin(a) * (RZ + 1)),
        new THREE.Vector3(Math.cos(a) * (RX + 1), CEIL, Math.sin(a) * (RZ + 1)), 0.09, darkSteel));
    }

    // Strings of warm lights along the hall wall, softly out of focus
    const bokeh = K.glowTexture("rgba(255,255,255,0.95)", "rgba(255,255,255,0)");
    const bokehColors = ["#ffd59a", "#A6F5A8", "#D9B88F", "#fff1d6"];
    for (let i = 0; i < 40; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: bokeh, color: col(bokehColors[i % 4]), blending: THREE.AdditiveBlending,
        depthWrite: false, fog: false, opacity: 0.3 + rand() * 0.45
      }));
      const a = (i / 40) * Math.PI * 2 + rand() * 0.08, r = 20.2;
      s.position.set(Math.cos(a) * r, 2.2 + (i % 3) * 1.3 + rand() * 0.3, Math.sin(a) * r * 0.8);
      const size = 0.7 + rand() * 1.6;
      s.scale.set(size, size, 1);
      scene.add(s);
    }

    /* ---------- Bumper car model ---------- */
    const chrome = new THREE.MeshStandardMaterial({ color: col("#e3e5e2"), metalness: 1, roughness: 0.14 });
    const seatMat = new THREE.MeshStandardMaterial({ color: col("#202622"), roughness: 0.42, metalness: 0.05 });
    const lampMat = new THREE.MeshStandardMaterial({ color: col("#fff6e0"), emissive: col("#fff1d0"), emissiveIntensity: 1.6, roughness: 0.2 });

    // Rounded-rectangle path for the rubber bumper ring
    function roundedRectCurve(hx, hz, r) {
      const pts = [];
      [[hx - r, hz - r, 0], [-(hx - r), hz - r, 0.5], [-(hx - r), -(hz - r), 1], [hx - r, -(hz - r), 1.5]].forEach(([cx, cz, a0]) => {
        for (let i = 0; i <= 8; i++) {
          const a = (a0 + i / 16) * Math.PI;
          pts.push(new THREE.Vector3(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r));
        }
      });
      return new THREE.CatmullRomCurve3(pts, true, "centripetal");
    }

    // Shared geometry for every car
    const G = {
      base: K.roundedBox(1.9, 0.3, 2.3, 0.12, 3),
      bumper: new THREE.TubeGeometry(roundedRectCurve(1.02, 1.24, 0.5), 140, 0.17, 14, true),
      tub: K.roundedBox(1.56, 0.62, 1.7, 0.22, 4),
      cowl: new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
      seatBack: K.roundedBox(1.2, 0.72, 0.24, 0.1, 3),
      seat: K.roundedBox(1.0, 0.18, 0.6, 0.07, 2),
      column: new THREE.CylinderGeometry(0.03, 0.03, 0.5, 10),
      wheelRim: new THREE.TorusGeometry(0.17, 0.026, 10, 28),
      lamp: new THREE.SphereGeometry(0.075, 16, 12),
      lampRing: new THREE.TorusGeometry(0.085, 0.018, 8, 20),
      wheel: new THREE.CylinderGeometry(0.13, 0.13, 0.1, 18).rotateZ(Math.PI / 2),
      pole: new THREE.CylinderGeometry(0.03, 0.035, 3.5, 10),
      spring: new THREE.TorusGeometry(0.06, 0.012, 6, 14),
      shoe: new THREE.BoxGeometry(0.16, 0.05, 0.3),
      decal: new THREE.CircleGeometry(0.17, 32),
      shadow: new THREE.PlaneGeometry(2.8, 3.1)
    };
    const contact = new THREE.MeshBasicMaterial({
      map: K.glowTexture("rgba(0,0,0,0.65)", "rgba(0,0,0,0)"), transparent: true, depthWrite: false
    });

    function numberDecal(n, ink) {
      return new THREE.MeshStandardMaterial({
        map: K.canvasTexture(128, 128, (g) => {
          g.fillStyle = "#F7F5EF"; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
          g.fillStyle = ink; g.font = "700 68px 'Space Grotesk', Arial, sans-serif";
          g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), 64, 68);
        }),
        transparent: true, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -2
      });
    }

    // Seated rider holding the steering wheel. Built around the seat;
    // `scale` below 1 makes a child. Legs are hidden inside the tub.
    const R = {
      torso: K.roundedBox(0.46, 0.6, 0.28, 0.12, 3),
      head: new THREE.SphereGeometry(0.16, 24, 18),
      hair: new THREE.SphereGeometry(0.17, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hand: new THREE.SphereGeometry(0.055, 12, 10)
    };
    function addRider(body, { skin, shirt, hair, scale }) {
      const rider = new THREE.Group();
      rider.position.set(0, 1.14, -0.45);
      rider.scale.setScalar(scale);
      const skinMat = new THREE.MeshStandardMaterial({ color: col(skin), roughness: 0.6 });
      const shirtMat = new THREE.MeshStandardMaterial({ color: col(shirt), roughness: 0.75 });
      const hairMat = new THREE.MeshStandardMaterial({ color: col(hair), roughness: 0.9 });
      const add = (geo, mat, x, y, z) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        rider.add(m);
        return m;
      };
      add(R.torso, shirtMat, 0, 0.31, -0.07).rotation.x = -0.1;
      add(R.head, skinMat, 0, 0.81, -0.03);
      add(R.hair, hairMat, 0, 0.84, -0.06).rotation.x = -0.35;
      [-1, 1].forEach((s) => {
        const shoulder = new THREE.Vector3(0.2 * s, 0.52, 0), hand = new THREE.Vector3(0.14 * s, 0.24, 0.39);
        rider.add(K.strut(shoulder, hand, 0.05, shirtMat));
        add(R.hand, skinMat, hand.x, hand.y, hand.z);
      });
      body.add(rider);
      return rider;
    }

    function buildCar(hex, number, riderLook) {
      const paint = new THREE.MeshPhysicalMaterial({
        color: col(hex), metalness: 0.1, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.75
      });
      const car = new THREE.Group();   // forward is +z
      const body = new THREE.Group();  // rolls and bobs slightly
      car.add(body);
      const part = (geo, mat, x, y, z) => {
        const o = new THREE.Mesh(geo, mat);
        o.position.set(x, y, z);
        o.castShadow = o.receiveShadow = true;
        body.add(o);
        return o;
      };
      part(G.base, paint, 0, 0.3, 0);
      part(G.bumper, rubber, 0, 0.3, 0);
      part(G.tub, paint, 0, 0.72, -0.12);
      part(G.cowl, paint, 0, 0.62, 0.58).scale.set(0.74, 0.5, 0.52);
      part(G.seatBack, seatMat, 0, 1.2, -0.72).rotation.x = -0.12;
      part(G.seat, seatMat, 0, 1.05, -0.38);
      part(G.column, chrome, 0, 1.18, 0.12).rotation.x = 0.9;
      part(G.wheelRim, seatMat, 0, 1.36, -0.02).rotation.x = 0.68;
      [-0.42, 0.42].forEach((x) => {
        part(G.lamp, lampMat, x, 0.66, 1.07);
        part(G.lampRing, chrome, x, 0.66, 1.09);
      });
      [[-0.7, 0.75], [0.7, 0.75], [-0.7, -0.75], [0.7, -0.75]].forEach(([x, z]) => part(G.wheel, rubber, x, 0.13, z));
      part(G.pole, chrome, 0, 1.0 + 1.75, -0.98);
      for (let i = 0; i < 4; i++) part(G.spring, chrome, 0, 1.06 + i * 0.05, -0.98).rotation.x = Math.PI / 2;
      part(G.shoe, chrome, 0, CEIL - 0.05, -0.98);
      const decal = part(G.decal, numberDecal(number, "#202622"), 0, 1.06, 0.82);
      decal.rotation.x = -Math.PI / 2 + 0.55;
      decal.castShadow = false;
      // soft contact shadow, so cars look grounded even without shadow maps
      const blob = new THREE.Mesh(G.shadow, contact);
      blob.rotation.x = -Math.PI / 2;
      blob.position.y = 0.01;
      car.add(blob);
      if (riderLook) addRider(body, riderLook);
      scene.add(car);
      return { car, body };
    }

    // Riders: a mix of children (smaller scale) and adults
    const RIDERS = [
      { skin: "#8d5a3b", shirt: "#e8b13a", hair: "#1b1410", scale: 0.78 },
      { skin: "#c68a5e", shirt: "#3a6fd8", hair: "#241812", scale: 0.8 },
      { skin: "#a86d47", shirt: "#e4574a", hair: "#16110d", scale: 1 },
      { skin: "#6e4630", shirt: "#f2f0ea", hair: "#0f0b08", scale: 0.76 },
      { skin: "#b97b52", shirt: "#7a3fb0", hair: "#2b1d14", scale: 0.95 }
    ];

    // Nearest car: the foreground subject, idling close to the viewer,
    // turned three-quarters toward the camera
    const heroCar = buildCar("#9fd03f", 7, RIDERS[0]);
    heroCar.car.position.set(3.2, 0, 6.9);
    heroCar.car.rotation.y = -0.3;

    // Four cars on two oval laps. Same angular speed for all, and the
    // ovals are far enough apart that cars never overlap each other or
    // the parked car.
    const LAPS = [
      { a: 9.5, b: 3.7, phase: 0, hex: "#2F6B4F", n: 3 },
      { a: 9.5, b: 3.7, phase: Math.PI, hex: "#b8352a", n: 9 },
      { a: 5.6, b: 1.2, phase: Math.PI / 2, hex: "#D9B88F", n: 12 },
      { a: 5.6, b: 1.2, phase: Math.PI * 1.5, hex: "#F7F5EF", n: 5 }
    ];
    const movers = LAPS.map((lap, i) => Object.assign(buildCar(lap.hex, lap.n, RIDERS[i + 1]), lap));
    const SPEED = 0.3; // radians per second

    function placeMovers(time) {
      movers.forEach((m, i) => {
        const th = time * SPEED + m.phase;
        const x = m.a * Math.cos(th), z = m.b * Math.sin(th);
        const vx = -m.a * Math.sin(th), vz = m.b * Math.cos(th);
        m.car.position.set(x, 0, z);
        // small steering wobble on top of following the lap
        m.car.rotation.y = Math.atan2(vx, vz) + Math.sin(time * 1.3 + i * 2) * 0.06;
        // lean out of the turn a little (from sideways acceleration), plus a light engine vibration
        const v2 = vx * vx + vz * vz;
        const curvature = (m.a * m.b) / Math.pow(v2, 1.5);
        m.body.rotation.z = -Math.min(0.05 * SPEED * SPEED * v2 * curvature, 0.06);
        m.body.position.y = Math.sin(time * 24 + i) * 0.006;
      });
      heroCar.body.position.y = Math.sin(time * 30) * 0.004;
      heroCar.body.rotation.x = Math.sin(time * 2.1) * 0.006;
    }

    /* ---------- Camera: drag to orbit, buttons, reset ---------- */
    // Starting view: low, inside the barrier, close to the lime car (which
    // sits in the right half, clear of the text), looking across the arena.
    // Orbit angles are worked out from it.
    // Hero: a wider, higher shot of the whole arena
    const TARGET = heroMode ? new THREE.Vector3(1.5, 0.6, 0) : new THREE.Vector3(6.0, 0.95, 0.7);
    const START = heroMode ? new THREE.Vector3(-2, 3.6, 13.5) : new THREE.Vector3(0.5, 1.3, 10.2);
    const offset = START.clone().sub(TARGET);
    const HOME = { theta: Math.atan2(offset.x, offset.z), phi: Math.acos(offset.y / offset.length()) };
    const BASE_RADIUS = offset.length();
    let radius = BASE_RADIUS;
    let theta = HOME.theta, phi = HOME.phi, goalTheta = theta, goalPhi = phi;
    const PHI_MIN = 1.25, PHI_MAX = 1.56; // from just under the ceiling grid down to floor level
    const ptr = K.pointer(heroMode ? el.closest(".hero") || el : el);
    let dragging = false, lastX = 0, lastY = 0;

    canvas.style.touchAction = "pan-y"; // vertical swipes still scroll the page on phones
    if (!heroMode) {
    canvas.addEventListener("pointerdown", (e) => {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      el.classList.add("is-dragging");
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      goalTheta -= (e.clientX - lastX) * 0.006;
      goalPhi = K.clamp(goalPhi - (e.clientY - lastY) * 0.004, PHI_MIN, PHI_MAX);
      lastX = e.clientX; lastY = e.clientY;
      stage.invalidate();
    });
    const endDrag = () => { dragging = false; el.classList.remove("is-dragging"); };
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    el.querySelectorAll("[data-orbit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.orbit;
        if (action === "left") goalTheta += 0.6;
        if (action === "right") goalTheta -= 0.6;
        if (action === "reset") {
          // return to the start angle the short way round
          goalTheta = HOME.theta + Math.round((theta - HOME.theta) / (Math.PI * 2)) * Math.PI * 2;
          goalPhi = HOME.phi;
        }
        stage.invalidate();
      });
    });
    }

    stage.onResize = (w, h) => {
      const aspect = w / h;
      radius = BASE_RADIUS * (aspect < 0.8 ? 1.5 : aspect < 1.3 ? 1.25 : 1.12); // step back on narrow screens
    };

    let time = 0;
    stage.onFrame = (dt) => {
      if (!K.reducedMotion) time += dt;
      ptr.update(dt);
      // Hero: slow cinematic sweep back and forth around the arena
      if (heroMode) goalTheta = HOME.theta + Math.sin(time * 0.11) * 0.75;
      const ease = K.reducedMotion ? 1 : 1 - Math.exp(-6 * dt);
      theta += (goalTheta - theta) * ease;
      phi += (goalPhi - phi) * ease;
      const th = theta + (dragging ? 0 : ptr.x * 0.07);
      const ph = heroMode ? phi + ptr.y * 0.03 : K.clamp(phi + ptr.y * 0.03, PHI_MIN, PHI_MAX);
      camera.position.set(
        TARGET.x + radius * Math.sin(ph) * Math.sin(th),
        TARGET.y + radius * Math.cos(ph),
        TARGET.z + radius * Math.sin(ph) * Math.cos(th)
      );
      camera.lookAt(TARGET);
      placeMovers(time);
    };
    stage.invalidate();
  });
  });
})();
