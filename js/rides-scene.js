/* ==========================================================
   ADVENTURE WORLD — RIDE SCENES (activity cards)
   Real-time 3D for five "Pick your thrill" cards: Giant Wheel,
   Ziplining, Go-Kart Racing, Pirate Ship Ride and Water Slides.
   Each <div class="tc-media" data-ride="..."> gets a scene; its
   photo stays underneath and is shown instead on phones, low-power
   machines and browsers without WebGL (see scene-kit.js).
   All geometry is made in code: illustrations, not the park's rides.
   ========================================================== */
(function () {
  "use strict";
  const K = window.AW3D;
  if (!K) return;

  const col = K.col;
  const TAU = Math.PI * 2;
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const std = (c, r = 0.7, m = 0) => new THREE.MeshStandardMaterial({ color: col(c), roughness: r, metalness: m });
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const SKINS = ["#8d5a3b", "#c68a5e", "#6e4630", "#b97b52", "#a86d47"];
  const SHIRTS = ["#e4574a", "#C7F36B", "#ffd23f", "#2a5bd7", "#f2f0ea", "#ff8a3d", "#e94f6a"];

  /* ---------- Shared: sky, sun, ground, trees, visitors ---------- */
  function outdoors(stage, o) {
    const { scene, renderer } = stage;
    scene.background = K.canvasTexture(4, 256, (g, w, h) => {
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, o.top);
      grd.addColorStop(0.72, o.horizon);
      grd.addColorStop(1, o.horizon);
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    });
    scene.fog = new THREE.Fog(col(o.horizon), o.fogNear || 45, o.fogFar || 150);
    const sunDir = V(...o.sun).normalize().multiplyScalar(14);
    scene.environment = K.studioEnvironment(renderer, {
      background: o.horizon,
      lights: [
        { x: 0, y: 12, z: 0, w: 30, h: 0.5, d: 30, color: o.top, intensity: 1.3 },
        { x: sunDir.x, y: sunDir.y, z: sunDir.z, w: 3, h: 3, d: 3, color: o.sunColor, intensity: 5 }
      ]
    });
    scene.add(new THREE.HemisphereLight(col(o.top), col(o.ground), o.hemi || 0.8));
    const sun = new THREE.DirectionalLight(col(o.sunColor), o.sunIntensity || 2);
    sun.position.set(...o.sun);
    if (renderer.shadowMap.enabled) {
      const s = o.shadow || 16;
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 160 });
      sun.shadow.camera.updateProjectionMatrix();
      sun.shadow.bias = -0.0005;
      sun.shadow.normalBias = 0.03;
    }
    scene.add(sun);
  }

  function speckleTexture(base, specks, count = 2600) {
    const tex = K.canvasTexture(256, 256, (g, w, h) => {
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      const r = K.seeded(7);
      for (let i = 0; i < count; i++) {
        g.globalAlpha = 0.25 + r() * 0.35;
        g.fillStyle = specks[i % specks.length];
        g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5);
      }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function flatGround(scene, base, specks) {
    const tex = speckleTexture(base, specks);
    tex.repeat.set(40, 40);
    const g = new THREE.Mesh(new THREE.CircleGeometry(130, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
    g.receiveShadow = true;
    scene.add(g);
  }

  // Scatter spots for trees: a ring around (cx, cz)
  const ring = (cx, cz, r0, r1) => (r) => {
    const a = r() * TAU, d = r0 + r() * (r1 - r0);
    return { x: cx + Math.cos(a) * d, y: 0, z: cz + Math.sin(a) * d, s: 0.75 + r() * 0.8 };
  };

  // Round-topped trees; `place(rand)` returns {x, y, z, s} or null to skip
  function trees(scene, rand, count, place) {
    const spots = [];
    for (let tries = 0; spots.length < count && tries < count * 20; tries++) {
      const p = place(rand);
      if (p) spots.push(p);
    }
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.22, 1, 6).translate(0, 0.5, 0), std("#5b4332", 0.9), spots.length);
    const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), spots.length);
    const greens = ["#3f7a3a", "#4f8a3c", "#2f6634", "#5d9443", "#38703f"].map(col);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), still = new THREE.Quaternion(), p3 = V(), s3 = V(), up = V(0, 1, 0);
    spots.forEach((p, i) => {
      trunk.setMatrixAt(i, m4.compose(p3.set(p.x, p.y, p.z), still, s3.set(p.s, p.s * 2.2, p.s)));
      q.setFromAxisAngle(up, rand() * TAU);
      crown.setMatrixAt(i, m4.compose(p3.set(p.x, p.y + p.s * 2.9, p.z), q, s3.set(p.s * 1.5, p.s * 1.8, p.s * 1.5)));
      crown.setColorAt(i, greens[i % greens.length]);
    });
    [trunk, crown].forEach((m) => {
      m.castShadow = m.receiveShadow = true;
      m.frustumCulled = false; // r128 culls instances by the base shape only
      scene.add(m);
    });
  }

  // Standing people turned to face `look`
  function visitors(parent, spots, look, i0 = 0) {
    return spots.map(([x, y, z], i) => {
      const p = K.person({ shirt: SHIRTS[(i + i0) % 7], skin: SKINS[(i * 3 + i0) % 5], shorts: i % 2 ? "#2b3a55" : "#3d3a34", scale: 0.82 + ((i * 37) % 10) / 60 });
      p.root.position.set(x, y, z);
      p.root.rotation.y = Math.atan2(look.x - x, look.z - z);
      parent.add(p.root);
      return p;
    });
  }

  // Box stretched from a to b (stair flights, planks)
  function slab(a, b, w, h, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, a.distanceTo(b)), mat);
    m.position.copy(a).lerp(b, 0.5);
    m.lookAt(b);
    m.castShadow = m.receiveShadow = true;
    return m;
  }

  /* ==========================================================
     1. GIANT WHEEL at dusk: lit rims, gondolas that stay level
     ========================================================== */
  function giantWheel(stage, rand) {
    const { scene, camera } = stage;
    outdoors(stage, { top: "#22335f", horizon: "#f2a56e", sun: [-30, 12, -25], sunColor: "#ffc48a", sunIntensity: 1.7, ground: "#3b2f2c", hemi: 0.75, shadow: 14 });
    flatGround(scene, "#6c7444", ["#56603a", "#858a52", "#5f5a3a"]);
    add(scene, new THREE.CircleGeometry(10, 48).rotateX(-Math.PI / 2), std("#c9b79a", 0.9), 0, 0.02, 0);

    const R = 7, HUB = 8.6, N = 16, HALF = 0.62;
    const steel = std("#ece6da", 0.35, 0.55);
    const wheel = new THREE.Group();
    wheel.position.y = HUB;
    scene.add(wheel);
    [-HALF, HALF].forEach((z) => {
      add(wheel, new THREE.TorusGeometry(R, 0.1, 8, 128), steel, 0, 0, z);
      add(wheel, new THREE.TorusGeometry(R * 0.32, 0.08, 8, 64), steel, 0, 0, z);
    });
    add(wheel, new THREE.CylinderGeometry(0.6, 0.6, 2.2, 20).rotateX(Math.PI / 2), std("#b8402f", 0.4, 0.3));
    const at = (a, r, z) => V(Math.cos(a) * r, Math.sin(a) * r, z);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU, a2 = ((i + 1) / N) * TAU;
      [-HALF, HALF].forEach((z) => {
        wheel.add(K.strut(V(0, 0, z * 1.7), at(a, R, z), 0.045, steel, 5));
        wheel.add(K.strut(at(a, R * 0.32, z), at(a2, R, z), 0.03, steel, 4));
      });
      wheel.add(K.strut(at(a, R, -HALF), at(a, R, HALF), 0.04, steel, 5));
    }

    // Light bulbs along the rims and the front spokes
    const bulbPos = [];
    for (let i = 0; i < 128; i++) {
      const a = (i / 128) * TAU;
      [-HALF, HALF].forEach((z) => bulbPos.push(Math.cos(a) * (R + 0.12), Math.sin(a) * (R + 0.12), z));
    }
    for (let i = 0; i < N; i++) {
      for (let k = 1; k < 7; k++) {
        const a = (i / N) * TAU, f = k / 7;
        bulbPos.push(Math.cos(a) * R * f, Math.sin(a) * R * f, HALF * (1.7 - 0.7 * f) + 0.06);
      }
    }
    const bulbGeo = new THREE.BufferGeometry();
    bulbGeo.setAttribute("position", new THREE.Float32BufferAttribute(bulbPos, 3));
    const bulbs = new THREE.Points(bulbGeo, new THREE.PointsMaterial({
      size: 0.75, map: K.glowTexture("rgba(255,240,200,1)", "rgba(255,170,80,0)"),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    wheel.add(bulbs);

    // Gondolas hang between the rims and are turned back level every frame
    const cabinGeo = K.roundedBox(1.05, 0.95, 0.92, 0.2, 3);
    const windowGeo = new THREE.BoxGeometry(1.09, 0.36, 0.96);
    const roofGeo = new THREE.CylinderGeometry(0.18, 0.5, 0.3, 10);
    const barGeo = new THREE.CylinderGeometry(0.05, 0.05, HALF * 2, 6).rotateX(Math.PI / 2);
    const hangGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6);
    const glass = new THREE.MeshStandardMaterial({ color: col("#1a2533"), roughness: 0.08, metalness: 0.7, emissive: col("#ffb35c"), emissiveIntensity: 0.25 });
    const cabinColors = ["#e4574a", "#2a5bd7", "#ffd23f", "#C7F36B", "#ff8a3d", "#f2f0ea"];
    const pivots = [];
    for (let i = 0; i < N; i++) {
      const a = ((i + 0.5) / N) * TAU;
      const pivot = new THREE.Group();
      pivot.position.copy(at(a, R, 0));
      wheel.add(pivot);
      const paint = std(cabinColors[i % cabinColors.length], 0.4, 0.1);
      add(pivot, barGeo, steel);
      add(pivot, hangGeo, steel, 0, -0.225, 0);
      add(pivot, roofGeo, paint, 0, -0.6, 0);
      add(pivot, cabinGeo, paint, 0, -1.2, 0);
      add(pivot, windowGeo, glass, 0, -1.12, 0);
      pivots.push(pivot);
    }

    // A-frame legs and axle
    const frameMat = std("#d9d3c6", 0.4, 0.5);
    [-1, 1].forEach((side) => {
      const top = V(0, HUB, side * 1.2);
      const feet = [V(-4.8, 0, side * 2.8), V(4.8, 0, side * 2.8)];
      feet.forEach((f) => {
        scene.add(K.strut(f, top, 0.17, frameMat, 10));
        add(scene, new THREE.BoxGeometry(1, 0.4, 1), std("#9a948a", 0.9), f.x, 0.2, f.z);
      });
      scene.add(K.strut(feet[0].clone().lerp(top, 0.45), feet[1].clone().lerp(top, 0.45), 0.09, frameMat, 8));
    });
    add(scene, new THREE.CylinderGeometry(0.25, 0.25, 2.8, 12).rotateX(Math.PI / 2), frameMat, 0, HUB, 0);

    // Ticket booth, lamp posts, visitors and trees
    add(scene, K.roundedBox(2.2, 2.2, 1.6, 0.12, 2), std("#e4574a", 0.6), -6.4, 1.1, 4.4);
    add(scene, new THREE.ConeGeometry(1.8, 0.8, 4).rotateY(Math.PI / 4), std("#f2f0ea", 0.6), -6.4, 2.6, 4.4);
    const halo = K.glowTexture("rgba(255,226,170,1)", "rgba(255,200,120,0)");
    [[-8.5, 6.5], [7.5, 6], [8.5, -5], [-8.5, -4]].forEach(([x, z]) => {
      add(scene, new THREE.CylinderGeometry(0.07, 0.09, 3.4, 8), std("#2b2b2b", 0.5, 0.6), x, 1.7, z);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, blending: THREE.AdditiveBlending, depthWrite: false }));
      s.position.set(x, 3.5, z);
      s.scale.setScalar(1.6);
      scene.add(s);
      const l = new THREE.PointLight(col("#ffcf8a"), 0.6, 9);
      l.position.set(x, 3.4, z);
      scene.add(l);
    });
    visitors(scene, [[-3, 0, 5.5], [-2.2, 0, 6.2], [2.5, 0, 5], [3.4, 0, 5.7], [5.8, 0, 1.6], [-5.2, 0, 1.4], [0.6, 0, 7.4]], V(0, 0, 0))
      .forEach((p) => { p.head.rotation.x = -0.45; });
    trees(scene, rand, 90, ring(0, 0, 16, 70));

    const LOOK = V(0, 8, 0);
    return (time, dt, ptr) => {
      wheel.rotation.z = -time * 0.15;
      pivots.forEach((p, i) => { p.rotation.z = -wheel.rotation.z + Math.sin(time * 1.1 + i) * 0.04; });
      bulbs.material.opacity = 0.8 + 0.2 * Math.sin(time * 2.4);
      const th = 0.42 + Math.sin(time * 0.07) * 0.22 + ptr.x * 0.12;
      camera.position.set(Math.sin(th) * 26, 3 - ptr.y * 0.8, Math.cos(th) * 26);
      camera.lookAt(LOOK);
    };
  }

  /* ==========================================================
     2. ZIPLINING across a river valley: two riders race down
        parallel cables; the camera follows the leader
     ========================================================== */
  function zipline(stage, rand) {
    const { scene, camera } = stage;
    outdoors(stage, { top: "#5d9ed8", horizon: "#dceaf0", sun: [28, 40, 22], sunColor: "#fff1d8", sunIntensity: 2.1, ground: "#4b5a38", hemi: 0.85, shadow: 30, fogNear: 50, fogFar: 180 });

    // Hills on both sides, a river in the middle
    const height = (x, z) => 11 * K.smooth(4, 30, -x) + 5 * K.smooth(6, 30, x) - 3.2 * Math.exp(-(x * x) / 40)
      + (K.fbm(x * 0.045 + 3.1, z * 0.045 + 7.3) - 0.5) * 6 + Math.max(0, -z - 12) * 0.25;
    const geo = new THREE.PlaneGeometry(220, 180, 110, 90).rotateX(-Math.PI / 2).translate(0, 0, -40);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, height(pos.getX(i), pos.getZ(i)));
    geo.computeVertexNormals();
    const colors = [], c = new THREE.Color();
    const grass = ["#4c7a35", "#6f8f44", "#86945a"].map(col), rock = col("#8b8373"), bank = col("#b9a77f");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), ny = geo.attributes.normal.getY(i);
      c.copy(grass[0]).lerp(grass[1], K.clamp(K.fbm(x * 0.12, z * 0.12, 3) * 1.6 - 0.3, 0, 1)).lerp(grass[2], K.smooth(6, 14, y) * 0.6);
      c.lerp(rock, K.smooth(0.86, 0.7, ny));
      c.lerp(bank, K.smooth(-0.2, -1.4, y));
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
    land.receiveShadow = true;
    scene.add(land);
    const river = new THREE.Mesh(new THREE.PlaneGeometry(220, 180).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: col("#3f8291"), roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.88 }));
    river.position.set(0, -1.1, -40);
    scene.add(river);

    // Launch tower (high) and landing tower (low)
    const wood = std("#7b5a3a", 0.85), cable = std("#3a3d40", 0.4, 0.7);
    function tower(x, deck, anchor, facing) {
      [[-1.4, -1.7], [1.4, -1.7], [-1.4, 1.7], [1.4, 1.7]].forEach(([dx, dz]) =>
        scene.add(K.strut(V(x + dx, height(x + dx, dz) - 0.6, dz), V(x + dx, anchor + 0.35, dz), 0.14, wood, 8)));
      [-1.7, 1.7].forEach((dz) => scene.add(K.strut(V(x - 1.4, height(x - 1.4, dz), dz), V(x + 1.4, deck, dz), 0.07, wood, 6)));
      add(scene, K.roundedBox(3.4, 0.26, 4.0, 0.06, 2), wood, x, deck, 0);
      add(scene, new THREE.BoxGeometry(0.24, 0.24, 3.8), wood, x + facing * 1.4, anchor, 0);
      add(scene, new THREE.BoxGeometry(0.1, 0.1, 3.6), wood, x - facing * 1.4, deck + 1.0, 0);
      [-1.7, 1.7].forEach((dz) => add(scene, new THREE.BoxGeometry(2.8, 0.1, 0.1), wood, x, deck + 1.0, dz));
    }
    const A = { x: -27 }, B = { x: 25 };
    A.deck = height(A.x, 0) + 6.5; A.anchor = A.deck + 2.9;
    B.deck = Math.max(height(B.x, 0), -0.5) + 1.4; B.anchor = B.deck + 2.7;
    tower(A.x, A.deck, A.anchor, 1);
    tower(B.x, B.deck, B.anchor, -1);
    visitors(scene, [[A.x - 0.6, A.deck + 0.13, -1.0], [A.x - 0.9, A.deck + 0.13, 0.6], [B.x + 0.6, B.deck + 0.13, 1.1]], V(0, 0, 0), 2);

    // Two cables with a little sag
    const cables = [-0.9, 0.9].map((z) => {
      const s = V(A.x + 1.4, A.anchor, z), e = V(B.x - 1.4, B.anchor, z);
      const mid = s.clone().lerp(e, 0.5);
      mid.y -= 2.4;
      const curve = new THREE.QuadraticBezierCurve3(s, mid, e);
      add(scene, new THREE.TubeGeometry(curve, 120, 0.035, 5, false), cable);
      return curve;
    });

    // Riders hang from a trolley, seated in the harness, hands on the straps
    const riders = [
      { curve: cables[0], phase: 0, look: { shirt: "#e4574a", shorts: "#2b3a55", skin: "#8d5a3b", helmet: "#ff8a3d" } },
      { curve: cables[1], phase: -0.9, look: { shirt: "#2a5bd7", shorts: "#1d1f22", skin: "#c68a5e", helmet: "#C7F36B" } }
    ].map((r) => {
      const hang = new THREE.Group();
      scene.add(hang);
      add(hang, K.roundedBox(0.4, 0.22, 0.2, 0.05, 2), cable, 0, 0.06, 0);
      const swing = new THREE.Group();
      hang.add(swing);
      swing.add(K.strut(V(0, 0, 0), V(0, -1.1, 0), 0.02, std("#222", 0.6), 4));
      const p = K.person(r.look);
      p.root.position.y = -2.1;
      p.root.rotation.y = Math.PI / 2; // face along the cable (+x)
      p.armL.rotation.x = p.armR.rotation.x = -2.95;
      swing.add(p.root);
      return Object.assign(r, { hang, swing, p });
    });

    const CYCLE = 12, RIDE = 7.5, tangent = V();
    function place(r, time) {
      const t = (((time + r.phase) % CYCLE) + CYCLE) % CYCLE;
      const f = K.clamp((t - 1.6) / RIDE, 0, 1);
      const u = 0.015 + 0.955 * K.easeInOut(f);
      r.curve.getPoint(u, r.hang.position);
      r.curve.getTangent(u, tangent);
      r.hang.rotation.z = Math.atan2(tangent.y, tangent.x); // trolley follows the cable
      // The rider lags behind while speeding up and swings forward when braking
      r.swing.rotation.z = -r.hang.rotation.z - 0.35 * Math.sin(TAU * f) + 0.04 * Math.sin(time * 2 + r.phase);
      r.p.legL.rotation.x = -1.2 + 0.15 * Math.sin(time * 3 + r.phase);
      r.p.legR.rotation.x = -1.35 + 0.15 * Math.sin(time * 3 + r.phase + 1.4);
    }

    trees(scene, rand, 320, (r) => {
      const x = -95 + r() * 190, z = -80 + r() * 77, y = height(x, z);
      if (y < -0.6 || (Math.abs(z) < 4 && Math.abs(x) > 22)) return null;
      return { x, y: y - 0.2, z, s: 0.7 + r() * 0.7 };
    });

    // Camera glides after the leading rider (and back to the start)
    const look = V(), want = V();
    let snapped = false;
    return (time, dt, ptr) => {
      riders.forEach((r) => place(r, time));
      const h = riders[0].hang.position;
      want.set(h.x + 3, h.y - 1.6, 0);
      look.lerp(want, snapped ? 1 - Math.exp(-2.4 * dt) : 1);
      snapped = true;
      camera.position.set(look.x - 5 + ptr.x * 2.5, look.y + 1.2 - ptr.y * 1.2, 14);
      camera.lookAt(look);
    };
  }

  /* ==========================================================
     3. GO-KART RACING: four karts lapping a kerbed circuit
     ========================================================== */
  function goKarts(stage, rand) {
    const { scene, camera } = stage;
    outdoors(stage, { top: "#679fd6", horizon: "#e4edee", sun: [22, 36, 14], sunColor: "#fff0d6", sunIntensity: 2.1, ground: "#55633d", hemi: 0.85, shadow: 24 });
    flatGround(scene, "#5c8c42", ["#4a7a36", "#6f9c4c", "#7fa456"]);

    const track = new THREE.CatmullRomCurve3(
      [[-15, -5], [-6, -9], [6, -9.5], [15, -6], [17, 1], [11, 5], [3, 2.6], [-2, 6.6], [-10, 9], [-17, 4]].map(([x, z]) => V(x, 0, z)),
      true, "centripetal");
    const LEN = track.getLength(), HALFW = 2.1, SAMPLES = 480;
    const frames = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const u = (i / SAMPLES) % 1, t = track.getTangentAt(u);
      frames.push({ p: track.getPointAt(u), t, n: V(-t.z, 0, t.x).normalize(), u: i / SAMPLES });
    }
    // Flat strip following the track, from offset a to offset b
    function ribbon(a, b, y, vScale, mat) {
      const pos = [], nor = [], uv = [], idx = [];
      frames.forEach((f, i) => {
        [a, b].forEach((o, k) => {
          pos.push(f.p.x + f.n.x * o, y, f.p.z + f.n.z * o);
          nor.push(0, 1, 0);
          uv.push(k, f.u * vScale);
        });
        if (i < SAMPLES) { const j = i * 2; idx.push(j, j + 2, j + 1, j + 1, j + 2, j + 3); }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      const m = new THREE.Mesh(g, mat);
      m.receiveShadow = true;
      scene.add(m);
    }
    const asphalt = K.canvasTexture(128, 128, (g, w, h) => {
      g.fillStyle = "#3c3f42";
      g.fillRect(0, 0, w, h);
      const r = K.seeded(3);
      for (let i = 0; i < 1600; i++) {
        g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.12)";
        g.fillRect(r() * w, r() * h, 1.5, 1.5);
      }
      g.fillStyle = "#e9e6dc";
      g.fillRect(3, 0, 4, h);
      g.fillRect(w - 7, 0, 4, h);
    });
    asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping;
    ribbon(-HALFW, HALFW, 0.03, LEN / 4, new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.85, side: THREE.DoubleSide }));
    const kerbTex = K.canvasTexture(8, 64, (g, w, h) => {
      g.fillStyle = "#d8352a"; g.fillRect(0, 0, w, h / 2);
      g.fillStyle = "#f4f1ea"; g.fillRect(0, h / 2, w, h / 2);
    });
    kerbTex.wrapS = kerbTex.wrapT = THREE.RepeatWrapping;
    const kerbMat = new THREE.MeshStandardMaterial({ map: kerbTex, roughness: 0.6, side: THREE.DoubleSide });
    ribbon(HALFW, HALFW + 0.55, 0.05, LEN / 1.6, kerbMat);
    ribbon(-HALFW - 0.55, -HALFW, 0.05, LEN / 1.6, kerbMat);

    // Tyre walls on both sides, wherever they don't cut into the track
    const clear = (x, z, d) => frames.every((f) => (f.p.x - x) ** 2 + (f.p.z - z) ** 2 > d * d);
    const spots = [], STEP = Math.max(1, Math.round(SAMPLES / (LEN / 0.85)));
    for (let i = 0; i < SAMPLES; i += STEP) {
      const f = frames[i];
      [-1, 1].forEach((s) => {
        const o = s * (HALFW + 1.5), x = f.p.x + f.n.x * o, z = f.p.z + f.n.z * o;
        if (clear(x, z, HALFW + 1.25)) spots.push([x, z]);
      });
    }
    const tyres = new THREE.InstancedMesh(new THREE.TorusGeometry(0.34, 0.15, 8, 18).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ roughness: 0.85 }), spots.length * 2);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = V(1, 1, 1), p3 = V();
    const black = col("#1b1b1b"), white = col("#e9e6dc"), red = col("#d8352a");
    spots.forEach(([x, z], i) => {
      [0.15, 0.44].forEach((y, k) => {
        tyres.setMatrixAt(i * 2 + k, m4.compose(p3.set(x, y, z), q, one));
        tyres.setColorAt(i * 2 + k, i % 6 === 0 ? white : i % 6 === 3 ? red : black);
      });
    });
    tyres.castShadow = tyres.receiveShadow = true;
    tyres.frustumCulled = false;
    scene.add(tyres);

    // Start line, gantry and pit garage
    const f0 = frames[0], heading0 = Math.atan2(f0.t.x, f0.t.z);
    const off = (o) => [f0.p.x + f0.n.x * o, f0.p.z + f0.n.z * o];
    const check = K.canvasTexture(64, 16, (g) => {
      for (let x = 0; x < 16; x++) for (let y = 0; y < 4; y++) { g.fillStyle = (x + y) % 2 ? "#111" : "#f4f1ea"; g.fillRect(x * 4, y * 4, 4, 4); }
    });
    check.magFilter = THREE.NearestFilter;
    add(scene, new THREE.PlaneGeometry(HALFW * 2, 0.9).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: check, roughness: 0.7 }), f0.p.x, 0.045, f0.p.z).rotation.y = heading0;
    const dark = std("#1d1f22", 0.6, 0.2);
    [-1, 1].forEach((s) => { const [x, z] = off(s * (HALFW + 0.8)); add(scene, new THREE.CylinderGeometry(0.1, 0.1, 3.4, 8), dark, x, 1.7, z); });
    add(scene, new THREE.BoxGeometry((HALFW + 0.8) * 2 + 0.3, 0.6, 0.12), std("#C7F36B", 0.5), f0.p.x, 3.2, f0.p.z).rotation.y = heading0;
    const out = f0.p.x * f0.n.x + f0.p.z * f0.n.z > 0 ? 1 : -1; // away from the infield
    const [gx, gz] = off(out * (HALFW + 5.4));
    add(scene, K.roundedBox(3.2, 2.6, 10, 0.1, 2), std("#f2f0ea", 0.6), gx, 1.3, gz).rotation.y = heading0;
    add(scene, new THREE.BoxGeometry(3.4, 0.25, 10.2), std("#2a5bd7", 0.5), gx, 2.7, gz).rotation.y = heading0;

    // Karts with seated drivers
    const rubber = std("#141414", 0.9);
    const wheelGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.24, 16).rotateZ(Math.PI / 2);
    function kart(color, helmet, skin) {
      const g = new THREE.Group();
      g.rotation.order = "YXZ";
      const paint = std(color, 0.3, 0.25);
      add(g, K.roundedBox(1.0, 0.1, 1.9, 0.04, 2), dark, 0, 0.17, 0);
      add(g, K.roundedBox(0.9, 0.24, 0.5, 0.1, 3), paint, 0, 0.3, 0.92);
      [-1, 1].forEach((s) => add(g, K.roundedBox(0.2, 0.22, 0.95, 0.08, 2), paint, s * 0.5, 0.3, -0.05));
      add(g, K.roundedBox(1.2, 0.12, 0.18, 0.05, 2), dark, 0, 0.26, -1.0);
      add(g, K.roundedBox(0.5, 0.5, 0.18, 0.08, 2), dark, 0, 0.5, -0.62).rotation.x = -0.35;
      const wheels = [[-0.64, 0.66], [0.64, 0.66], [-0.66, -0.68], [0.66, -0.68]].map(([x, z]) => add(g, wheelGeo, rubber, x, 0.21, z));
      add(g, new THREE.TorusGeometry(0.13, 0.025, 6, 16), dark, 0, 0.62, 0.3).rotation.x = -0.9;
      const p = K.person({ shirt: color, shorts: "#1d1f22", skin, helmet, scale: 0.6 });
      p.root.position.set(0, 0.32 - 0.86 * 0.6, -0.45);
      p.legL.rotation.x = p.legR.rotation.x = -1.45;
      p.armL.rotation.x = p.armR.rotation.x = -1.15;
      g.add(p.root);
      scene.add(g);
      return { g, wheels };
    }
    const karts = [
      ["#e4574a", "#f2f0ea", "#8d5a3b", 0.11], ["#2a5bd7", "#ffd23f", "#c68a5e", 0.075],
      ["#ffd23f", "#1d1f22", "#6e4630", 0.04], ["#C7F36B", "#2a5bd7", "#b97b52", 0.005]
    ].map(([c, h, s, u0]) => Object.assign(kart(c, h, s), { u0 }));

    const pt = V(), tg = V(), tg2 = V();
    function drive(time) {
      karts.forEach((k, i) => {
        const u = (((k.u0 + 0.072 * time + 0.01 * Math.sin(time * 0.45 + i * 1.9)) % 1) + 1) % 1;
        track.getPointAt(u, pt);
        track.getTangentAt(u, tg);
        track.getTangentAt((u + 0.01) % 1, tg2);
        const lane = (i % 2 ? 0.75 : -0.75) + 0.35 * Math.sin(time * 0.33 + i);
        k.g.position.set(pt.x - tg.z * lane, 0, pt.z + tg.x * lane);
        k.g.rotation.y = Math.atan2(tg.x, tg.z);
        k.g.rotation.z = K.clamp((tg.x * tg2.z - tg.z * tg2.x) * 3, -0.1, 0.1); // lean in the bends
        k.wheels.forEach((w) => { w.rotation.x = time * 30; });
      });
    }

    trees(scene, rand, 110, ring(0, 0, 27, 80));

    const look = V(), want = V();
    let snapped = false;
    return (time, dt, ptr) => {
      drive(time);
      const lead = karts[0].g.position;
      want.set(lead.x * 0.55, 0.4, lead.z * 0.55);
      look.lerp(want, snapped ? 1 - Math.exp(-1.5 * dt) : 1);
      snapped = true;
      const th = 0.6 + Math.sin(time * 0.05) * 0.3 + ptr.x * 0.12;
      camera.position.set(look.x + Math.sin(th) * 15, 8.5 - ptr.y, look.z + Math.cos(th) * 15);
      camera.lookAt(look);
    };
  }

  /* ==========================================================
     4. PIRATE SHIP: a swinging galleon, riders' arms up at the top
     ========================================================== */
  function pirateShip(stage, rand) {
    const { scene, camera } = stage;
    outdoors(stage, { top: "#5a8fcf", horizon: "#f3ddb0", sun: [-24, 32, 26], sunColor: "#ffe6bf", sunIntensity: 2.0, ground: "#5a4a38", hemi: 0.8, shadow: 18 });
    flatGround(scene, "#6a8a46", ["#567a3a", "#7c9a52", "#8a8a55"]);
    add(scene, new THREE.CircleGeometry(14, 48).rotateX(-Math.PI / 2), std("#cbb795", 0.9), 0, 0.02, 0);
    const woodMat = std("#5a3420", 0.8);
    add(scene, K.roundedBox(14, 0.4, 5.2, 0.08, 2), std("#8a6a48", 0.85), 0, 0.2, 0);

    const PIV = 10.8, ARM = 8.2;
    const swing = new THREE.Group();
    swing.position.y = PIV;
    scene.add(swing);
    const ship = new THREE.Group();
    ship.position.y = -ARM;
    swing.add(ship);

    // Hull: a side profile, extruded across the ship's width
    const prof = new THREE.Shape();
    prof.moveTo(-5.6, 1.7);
    prof.quadraticCurveTo(-4.4, -1.9, 0, -1.9);
    prof.quadraticCurveTo(4.4, -1.9, 5.6, 1.7);
    prof.lineTo(4.9, 1.7);
    prof.quadraticCurveTo(3.9, 0.1, 2.6, 0.1);
    prof.lineTo(-2.6, 0.1);
    prof.quadraticCurveTo(-3.9, 0.1, -4.9, 1.7);
    prof.closePath();
    const hullGeo = new THREE.ExtrudeGeometry(prof, { depth: 2.4, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.12, bevelSegments: 3, curveSegments: 24 });
    hullGeo.translate(0, 0, -1.2);
    // Painted sides: red above the deck line, a gold stripe, planks below.
    // The side faces' UVs are the profile's x, y; repeat/offset map y -2..2 to the canvas.
    const hullTex = K.canvasTexture(512, 256, (g, w, h) => {
      const Y = (y) => (1 - (y + 2) / 4) * h;
      g.fillStyle = "#5e3520"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#9c2e26"; g.fillRect(0, 0, w, Y(0.05));
      g.fillStyle = "#d9a83a"; g.fillRect(0, Y(0.05), w, Y(-0.25) - Y(0.05));
      g.strokeStyle = "rgba(0,0,0,0.25)";
      g.lineWidth = 2;
      for (let y = -1.9; y < 1.8; y += 0.32) { g.beginPath(); g.moveTo(0, Y(y)); g.lineTo(w, Y(y)); g.stroke(); }
    });
    hullTex.repeat.set(1 / 12, 1 / 4);
    hullTex.offset.set(0.5, 0.5);
    add(ship, hullGeo, [new THREE.MeshStandardMaterial({ map: hullTex, roughness: 0.6 }), woodMat]);
    const shieldGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.06, 18).rotateX(Math.PI / 2);
    const shieldMats = [std("#d9a83a", 0.35, 0.6), std("#2a5bd7", 0.5)];
    for (let i = 0; i < 7; i++) [-1, 1].forEach((s) => add(ship, shieldGeo, shieldMats[i % 2], -3.3 + i * 1.1, -0.65, s * 1.37));

    // Benches facing the mast, with riders
    const seatMat = std("#3a2a1e", 0.8), riders = [];
    [-3.3, -2.2, -1.1, 1.1, 2.2, 3.3].forEach((x, row) => {
      const face = x < 0 ? 1 : -1;
      add(ship, new THREE.BoxGeometry(0.45, 0.35, 2.2), seatMat, x, 0.28, 0);
      add(ship, new THREE.BoxGeometry(0.12, 0.7, 2.2), seatMat, x - face * 0.28, 0.6, 0);
      [-0.55, 0.55].forEach((z, k) => {
        if (rand() < 0.15) return; // a few empty seats
        const p = K.person({ shirt: SHIRTS[(row * 2 + k) % 7], skin: SKINS[(row + k * 3) % 5], shorts: "#2b3a55", scale: 0.72 });
        p.root.position.set(x, 0.45 - 0.86 * 0.72, z);
        p.root.rotation.y = (face * Math.PI) / 2;
        p.legL.rotation.x = p.legR.rotation.x = -1.45;
        ship.add(p.root);
        riders.push(p);
      });
    });

    // Mast, striped sail and a flag
    add(ship, new THREE.CylinderGeometry(0.11, 0.15, 4.6, 10), woodMat, 0, 2.4, 0);
    add(ship, new THREE.CylinderGeometry(0.42, 0.34, 0.4, 12), woodMat, 0, 3.9, 0);
    add(ship, new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8).rotateX(Math.PI / 2), woodMat, 0.05, 3.45, 0);
    const sailTex = K.canvasTexture(64, 64, (g, w, h) => {
      for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? "#b8322a" : "#f3ead6"; g.fillRect((i * w) / 4, 0, w / 4, h); }
    });
    const sailGeo = new THREE.PlaneGeometry(2.3, 1.9, 8, 6).rotateY(Math.PI / 2);
    const sp = sailGeo.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      const z = sp.getZ(i), y = sp.getY(i);
      sp.setX(i, 0.35 * (1 - (z / 1.15) ** 2) * (1 - 0.3 * (y / 0.95) ** 2));
    }
    sailGeo.computeVertexNormals();
    add(ship, sailGeo, new THREE.MeshStandardMaterial({ map: sailTex, roughness: 0.9, side: THREE.DoubleSide }), 0.12, 2.5, 0);
    const flagGeo = new THREE.PlaneGeometry(0.9, 0.5, 8, 1).translate(0.45, 0, 0);
    const flagBase = Float32Array.from(flagGeo.attributes.position.array);
    add(ship, flagGeo, new THREE.MeshStandardMaterial({ color: col("#141414"), roughness: 0.9, side: THREE.DoubleSide }), 0.05, 4.45, 0);

    // Swing arms (move with the ship) and the fixed A-frame
    const armMat = std("#d8a531", 0.35, 0.6);
    [-1.75, 1.75].forEach((z) => {
      const feet = [-2.7, 2.7].map((x) => V(x, -ARM + 0.2, z));
      feet.forEach((f) => {
        swing.add(K.strut(V(0, 0, z), f, 0.12, armMat, 10));
        swing.add(K.strut(f, V(f.x, f.y, z * 0.76), 0.08, armMat, 8));
      });
      swing.add(K.strut(feet[0].clone().multiplyScalar(0.55).setZ(z), feet[1].clone().multiplyScalar(0.55).setZ(z), 0.07, armMat, 8));
    });
    add(swing, new THREE.CylinderGeometry(0.28, 0.28, 4.6, 14).rotateX(Math.PI / 2), armMat);
    const legMat = std("#2f5d8a", 0.45, 0.5);
    [-1, 1].forEach((s) => {
      const top = V(0, PIV, s * 2.3);
      const feet = [-6.4, 6.4].map((x) => V(x, 0.4, s * 3.6));
      feet.forEach((f) => scene.add(K.strut(f, top, 0.2, legMat, 10)));
      scene.add(K.strut(feet[0].clone().lerp(top, 0.4), feet[1].clone().lerp(top, 0.4), 0.1, legMat, 8));
    });

    visitors(scene, [[-4.5, 0, 6.2], [-3.6, 0, 6.8], [3.8, 0, 6.4], [5.2, 0, 5.6], [0.4, 0, 7.6]], V(0, 0, 0), 3)
      .forEach((p) => { p.head.rotation.x = -0.35; });
    trees(scene, rand, 100, ring(0, 0, 18, 75));

    const LOOK = V(0, 5.8, 0);
    return (time, dt, ptr) => {
      const amp = 0.5 + 0.42 * (0.5 - 0.5 * Math.cos(time * 0.17));
      const ang = amp * Math.sin((time * TAU) / 5.8);
      swing.rotation.z = ang;
      const thrill = K.smooth(0.35, 0.8, Math.abs(ang));
      riders.forEach((p, i) => {
        const up = thrill * (i % 3 ? 1 : 0.6);
        p.armL.rotation.x = -0.6 - 2.3 * up;
        p.armR.rotation.x = -0.6 - 2.3 * up * (i % 2 ? 1 : 0.8);
      });
      const fa = flagGeo.attributes.position.array;
      for (let i = 0; i < fa.length; i += 3) fa[i + 2] = flagBase[i + 2] + Math.sin(flagBase[i] * 5 - time * 6) * 0.09 * flagBase[i];
      flagGeo.attributes.position.needsUpdate = true;
      const th = -0.3 + Math.sin(time * 0.06) * 0.25 + ptr.x * 0.12;
      camera.position.set(Math.sin(th) * 27, 4.6 - ptr.y * 0.8, Math.cos(th) * 27);
      camera.lookAt(LOOK);
    };
  }

  /* ==========================================================
     5. WATER SLIDES: an open slide and a spiral tube into a pool
     ========================================================== */
  function waterSlides(stage, rand) {
    const { scene, camera } = stage;
    outdoors(stage, { top: "#3f9be0", horizon: "#d6f0fb", sun: [25, 40, 20], sunColor: "#fff6e0", sunIntensity: 2.2, ground: "#a89a7c", hemi: 0.85, shadow: 22 });
    flatGround(scene, "#5f9446", ["#4c8038", "#73a453", "#83ad5f"]);

    // Pool deck around a sunken pool
    const PX0 = 2, PX1 = 16, PZ0 = -7, PZ1 = 5, PCX = (PX0 + PX1) / 2, PCZ = (PZ0 + PZ1) / 2, PW = PX1 - PX0, PD = PZ1 - PZ0;
    const stone = std("#ece4d3", 0.85);
    const deck = (x0, x1, z0, z1) => add(scene, new THREE.BoxGeometry(x1 - x0, 0.3, z1 - z0), stone, (x0 + x1) / 2, 0.15, (z0 + z1) / 2);
    deck(-13, PX0, -13, 11); deck(PX1, 21, -13, 11); deck(PX0, PX1, PZ1, 11); deck(PX0, PX1, -13, PZ0);
    const tileTex = K.canvasTexture(64, 64, (g, w, h) => {
      g.fillStyle = "#86d6ea"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = 2;
      for (let i = 0; i <= w; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
    });
    tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
    tileTex.repeat.set(7, 6);
    const tile = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.4 });
    add(scene, new THREE.PlaneGeometry(PW, PD).rotateX(-Math.PI / 2), tile, PCX, -1.6, PCZ);
    add(scene, new THREE.BoxGeometry(PW, 1.9, 0.05), tile, PCX, -0.65, PZ0);
    add(scene, new THREE.BoxGeometry(PW, 1.9, 0.05), tile, PCX, -0.65, PZ1);
    add(scene, new THREE.BoxGeometry(0.05, 1.9, PD), tile, PX0, -0.65, PCZ);
    add(scene, new THREE.BoxGeometry(0.05, 1.9, PD), tile, PX1, -0.65, PCZ);
    const coping = std("#ffffff", 0.6);
    add(scene, new THREE.BoxGeometry(PW + 0.6, 0.08, 0.3), coping, PCX, 0.33, PZ0);
    add(scene, new THREE.BoxGeometry(PW + 0.6, 0.08, 0.3), coping, PCX, 0.33, PZ1);
    add(scene, new THREE.BoxGeometry(0.3, 0.08, PD), coping, PX0, 0.33, PCZ);
    add(scene, new THREE.BoxGeometry(0.3, 0.08, PD), coping, PX1, 0.33, PCZ);

    const waterGeo = new THREE.PlaneGeometry(PW, PD, 56, 48).rotateX(-Math.PI / 2);
    const wBase = Float32Array.from(waterGeo.attributes.position.array);
    const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({ color: col("#35b8e0"), roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.78 }));
    water.position.set(PCX, 0.12, PCZ);
    water.receiveShadow = true;
    scene.add(water);

    // Tower with stairs and a roof
    const TX = -7, TZ = -1, TOP = 10;
    const frameMat = std("#f2f0ea", 0.45, 0.3), roofMat = std("#e4574a", 0.55);
    const corners = [[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]];
    corners.forEach(([dx, dz]) => scene.add(K.strut(V(TX + dx, 0.3, TZ + dz), V(TX + dx, TOP + 2.4, TZ + dz), 0.13, frameMat, 8)));
    [2.6, 5.2, 7.8].forEach((y) => corners.forEach(([dx, dz], i) => {
      const [ex, ez] = corners[(i + 1) % 4];
      scene.add(K.strut(V(TX + dx, y, TZ + dz), V(TX + ex, y, TZ + ez), 0.06, frameMat, 6));
    }));
    add(scene, K.roundedBox(3.8, 0.3, 3.8, 0.06, 2), stone, TX, TOP, TZ);
    add(scene, new THREE.ConeGeometry(3.0, 1.3, 4).rotateY(Math.PI / 4), roofMat, TX, TOP + 3.0, TZ);
    add(scene, new THREE.BoxGeometry(0.1, 0.1, 3.6), frameMat, TX - 1.8, TOP + 1.0, TZ);
    for (let k = 0; k < 5; k++) {
      const y0 = 0.3 + k * 1.94, dir = k % 2 ? -1 : 1;
      scene.add(slab(V(TX - 2.6, y0, TZ - dir * 1.6), V(TX - 2.6, y0 + 1.94, TZ + dir * 1.6), 1.0, 0.12, frameMat));
    }

    // Local frame along a slide: point, tangent, sideways, "up" across the chute
    const frameAt = (curve, u) => {
      const p = curve.getPointAt(u), t = curve.getTangentAt(u);
      const side = V().crossVectors(t, V(0, 1, 0)).normalize();
      return { p, t, side, up: V().crossVectors(side, t).normalize() };
    };
    // Open half-pipe swept along a curve
    function halfPipe(curve, segs, radius, radial, mat) {
      const pos = [], idx = [];
      for (let i = 0; i <= segs; i++) {
        const f = frameAt(curve, i / segs);
        for (let j = 0; j <= radial; j++) {
          const a = (j / radial) * Math.PI, cx = Math.cos(a) * radius, cy = -Math.sin(a) * radius;
          pos.push(f.p.x + f.side.x * cx + f.up.x * cy, f.p.y + f.side.y * cx + f.up.y * cy, f.p.z + f.side.z * cx + f.up.z * cy);
        }
      }
      for (let i = 0; i < segs; i++) {
        for (let j = 0; j < radial; j++) {
          const a = i * (radial + 1) + j, b = a + radial + 1;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return add(scene, g, mat);
    }
    const openCurve = new THREE.CatmullRomCurve3([
      V(-5.2, 10.0, 0.4), V(-2.6, 9.1, 1.6), V(-0.8, 7.6, 4.6), V(-3.2, 5.8, 7.4),
      V(-1.2, 3.8, 8.6), V(1.0, 2.2, 6.6), V(2.9, 0.9, 3.6), V(5.2, 0.35, 2.6)
    ]);
    halfPipe(openCurve, 260, 0.7, 12, new THREE.MeshStandardMaterial({ color: col("#1f8be0"), roughness: 0.25, side: THREE.DoubleSide }));

    // Spiral tube: two turns around a column, then out into the pool
    const SC = { x: -2.2, z: -6.4 }, SR = 3.2, a0 = 2.3, a1 = Math.PI / 2 - 2 * TAU;
    const spiralPts = [V(-5.2, 10.0, -2.2)];
    for (let i = 0; i <= 40; i++) {
      const f = i / 40, a = a0 + (a1 - a0) * f;
      spiralPts.push(V(SC.x + Math.cos(a) * SR, 9.4 - 7.4 * f, SC.z + Math.sin(a) * SR));
    }
    spiralPts.push(V(0.6, 1.4, -3.2), V(3.0, 0.75, -3.2), V(5.2, 0.35, -3.2));
    const spiralCurve = new THREE.CatmullRomCurve3(spiralPts);
    add(scene, new THREE.TubeGeometry(spiralCurve, 420, 0.62, 14, false), new THREE.MeshStandardMaterial({ color: col("#ffc93c"), roughness: 0.3, side: THREE.DoubleSide }));
    add(scene, new THREE.CylinderGeometry(0.25, 0.3, 9.6, 12), frameMat, SC.x, 4.9, SC.z);
    for (let u = 0.08; u < 0.8; u += 0.06) {
      const p = spiralCurve.getPointAt(u);
      scene.add(K.strut(V(SC.x, p.y - 0.5, SC.z), V(p.x, p.y - 0.5, p.z), 0.06, frameMat, 6));
    }
    for (let u = 0.1; u < 0.85; u += 0.14) {
      const p = openCurve.getPointAt(u);
      scene.add(K.strut(V(p.x, 0.3, p.z), V(p.x, p.y - 0.7, p.z), 0.09, frameMat, 8));
    }

    // Riders: one on the open slide, one popping out of the tube
    function slider(look) {
      const p = K.person(Object.assign({ scale: 0.8 }, look));
      const holder = new THREE.Group();
      p.root.position.y = -0.86 * 0.8;
      p.legL.rotation.x = p.legR.rotation.x = -1.5;
      p.torso.rotation.x = -0.6; // lean back
      holder.add(p.root);
      scene.add(holder);
      return { p, holder };
    }
    const openRider = slider({ shirt: "#e94f6a", shorts: "#2a5bd7", skin: "#a86d47" });
    const tubeRider = slider({ shirt: "#C7F36B", shorts: "#1d1f22", skin: "#6e4630" });
    const openEnd = frameAt(openCurve, 1), tubeEnd = frameAt(spiralCurve, 1);
    const ahead = V();
    // Glide out over the water and sink, `s` seconds after leaving the slide
    function glide(r, end, s) {
      r.holder.visible = s < 1.6;
      r.holder.position.copy(end.p).addScaledVector(end.t, s * 2.5 * (1 - s / 3.2));
      r.holder.position.y = 0.12 - s * 0.55;
      r.p.armL.rotation.x = r.p.armR.rotation.x = -2.6 + s;
    }
    const OPEN = { cycle: 8, wait: 1.0, ride: 4.6 }, TUBE = { cycle: 6.4, offset: 3.1 };
    function riders(time) {
      const t = time % OPEN.cycle;
      if (t < OPEN.wait + OPEN.ride) {
        const u = Math.pow(K.clamp((t - OPEN.wait) / OPEN.ride, 0, 1), 1.3);
        const f = frameAt(openCurve, Math.min(u, 0.999));
        openRider.holder.visible = true;
        openRider.holder.position.copy(f.p).addScaledVector(f.up, -0.62);
        openRider.holder.lookAt(ahead.copy(openRider.holder.position).add(f.t));
        openRider.p.armL.rotation.x = openRider.p.armR.rotation.x = -2.6;
      } else glide(openRider, openEnd, t - OPEN.wait - OPEN.ride);
      const s = (((time - TUBE.offset) % TUBE.cycle) + TUBE.cycle) % TUBE.cycle;
      tubeRider.holder.lookAt(ahead.copy(tubeRider.holder.position).add(tubeEnd.t));
      glide(tubeRider, tubeEnd, s);
    }

    // Splashes where each slide meets the water, with ripples
    const DROPS = 70, glowDrop = K.glowTexture("rgba(255,255,255,1)", "rgba(220,245,255,0)");
    function splash(end) {
      const vel = [];
      for (let i = 0; i < DROPS; i++) {
        const a = rand() * TAU, h = 0.5 + rand() * 1.4;
        vel.push(V(Math.cos(a) * h + end.t.x * 1.2, 2 + rand() * 2.6, Math.sin(a) * h + end.t.z * 1.2));
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(DROPS * 3), 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.35, map: glowDrop, transparent: true, depthWrite: false }));
      pts.frustumCulled = false;
      scene.add(pts);
      const origin = end.p.clone().setY(0.15);
      return {
        x: origin.x - PCX, z: origin.z - PCZ,
        update(age) {
          pts.visible = age >= 0 && age < 1.3;
          if (!pts.visible) return;
          const arr = g.attributes.position.array;
          vel.forEach((v, i) => {
            arr[i * 3] = origin.x + v.x * age;
            arr[i * 3 + 1] = Math.max(0.1, origin.y + v.y * age - 4.9 * age * age);
            arr[i * 3 + 2] = origin.z + v.z * age;
          });
          g.attributes.position.needsUpdate = true;
          pts.material.opacity = 1 - age / 1.3;
        }
      };
    }
    const splashes = [splash(openEnd), splash(tubeEnd)];
    function waves(time, ages) {
      const arr = waterGeo.attributes.position.array;
      for (let i = 0; i < arr.length; i += 3) {
        const x = wBase[i], z = wBase[i + 2];
        let y = 0.035 * Math.sin(x * 1.1 + time * 1.6) + 0.03 * Math.sin(z * 1.5 - time * 1.2 + x * 0.4);
        splashes.forEach((s, k) => {
          const age = ages[k];
          if (age < 0 || age > 3) return;
          const d = Math.hypot(x - s.x, z - s.z);
          if (d < age * 2.4) y += 0.1 * Math.sin(d * 4 - age * 8) * Math.exp(-age * 1.1 - d * 0.35);
        });
        arr[i + 1] = y;
      }
      waterGeo.attributes.position.needsUpdate = true;
      waterGeo.computeVertexNormals();
    }

    // Swimmers, umbrellas, loungers, palms and trees
    const swimmers = visitors(scene, [[9, 0, -1], [12, 0, 2], [13.5, 0, -4.5], [8.5, 0, 3.4]], V(-4, 0, 0), 1);
    swimmers.forEach((p) => p.root.scale.setScalar(0.8));
    [[18.5, 2, "#e4574a"], [18.5, -4, "#ffd23f"], [18.5, -10, "#2a5bd7"], [8, -10, "#C7F36B"], [13, -10, "#ff8a3d"]].forEach(([x, z, c]) => {
      add(scene, new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), std("#e9e6dc", 0.5), x, 1.5, z);
      add(scene, new THREE.ConeGeometry(1.5, 0.55, 10, 1, true), new THREE.MeshStandardMaterial({ color: col(c), roughness: 0.7, side: THREE.DoubleSide }), x, 2.75, z);
      add(scene, K.roundedBox(0.75, 0.16, 1.9, 0.05, 2), std("#f7f4ee", 0.6), x + 1.1, 0.5, z);
    });
    const trunkMat = std("#8a6a48", 0.9);
    const leafMat = new THREE.MeshStandardMaterial({ color: col("#3f8a3a"), roughness: 0.8, side: THREE.DoubleSide });
    const leafGeo = new THREE.PlaneGeometry(0.7, 3, 1, 8);
    const lp = leafGeo.attributes.position;
    for (let i = 0; i < lp.count; i++) {
      const along = lp.getY(i) + 1.5, x = lp.getX(i) * (1 - Math.abs(along - 1.2) / 1.9);
      lp.setXYZ(i, x, -0.13 * along * along + 0.3 * along, along);
    }
    leafGeo.computeVertexNormals();
    [[-11, 8, 7.5], [19.5, 8.5, 8], [-11, -10, 8.5], [19.8, -11.5, 7]].forEach(([x, z, h], k) => {
      const top = V(x + (k % 2 ? -0.8 : 0.8), h, z + 0.6);
      add(scene, new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V(x, 0.3, z), V(x, h * 0.6, z), top), 12, 0.18, 7, false), trunkMat);
      for (let i = 0; i < 8; i++) {
        const leaf = add(scene, leafGeo, leafMat, top.x, top.y, top.z);
        leaf.rotation.set(0, (i / 8) * TAU + rand() * 0.4, 0);
      }
    });
    trees(scene, rand, 90, ring(4, -1, 27, 80));

    const LOOK = V(1.5, 4.2, -1);
    const ages = [0, 0];
    return (time, dt, ptr) => {
      riders(time);
      ages[0] = (time % OPEN.cycle) - OPEN.wait - OPEN.ride;
      ages[1] = (((time - TUBE.offset) % TUBE.cycle) + TUBE.cycle) % TUBE.cycle;
      splashes.forEach((s, k) => s.update(ages[k]));
      waves(time, ages);
      swimmers.forEach((p, i) => {
        p.root.position.y = -0.82 + 0.05 * Math.sin(time * 1.6 + i * 1.3);
        p.armR.rotation.z = i % 2 ? 2.4 + 0.4 * Math.sin(time * 4 + i) : 0.5;
      });
      const th = 0.62 + Math.sin(time * 0.06) * 0.2 + ptr.x * 0.12;
      camera.position.set(2 + Math.sin(th) * 29, 9 - ptr.y, -1 + Math.cos(th) * 29);
      camera.lookAt(LOOK);
    };
  }

  /* ---------- Hook each card up to its scene ----------
     Only the card in the middle of the carousel (.is-current, set by
     script.js) animates. A scene is built the first time its card
     reaches the middle; when the card moves aside it keeps its last
     frame and stops rendering, so at most one scene draws at a time. */
  const RIDES = { wheel: giantWheel, zipline, kart: goKarts, pirate: pirateShip, water: waterSlides };
  document.querySelectorAll("[data-ride]").forEach((el, i) => {
    const build = RIDES[el.dataset.ride];
    if (!build) return;
    const card = el.closest(".thrill-card");
    const isCurrent = () => !card || card.classList.contains("is-current");
    let started = false;
    const sync = () => {
      if (el.stage) { el.stage.setActive(isCurrent()); return; }
      if (started || !isCurrent()) return;
      started = true;
      K.whenNear(el, () => {
        const stage = K.createStage(el, { fov: 38, far: 400, exposure: 1.0, active: isCurrent() });
        if (!stage) return;
        el.stage = stage;
        const ptr = K.pointer(card || el);
        const update = build(stage, K.seeded(101 + i * 17));
        let time = 0;
        stage.onFrame = (dt) => {
          if (!K.reducedMotion) time += dt;
          ptr.update(dt);
          update(time, dt, ptr);
        };
        stage.invalidate();
        stage.setActive(isCurrent());
      });
    };
    if (card) new MutationObserver(sync).observe(card, { attributes: true, attributeFilter: ["class"] });
    sync();
  });
})();
