/* ==========================================================
   ADVENTURE WORLD — BUGGY RIDES 3D SCENE (hero background)
   Two off-road ATVs with helmeted riders bounce along a dirt trail
   through forested hills, wheels spinning and dust trailing behind,
   followed by a slow-swinging chase camera. All real 3D geometry
   made in code; an illustration, not the park's actual trail.
   script.js switches it on and off (el.stage.setActive).
   ========================================================== */
(function () {
  "use strict";
  const K = window.AW3D;
  if (!K) return;

  document.querySelectorAll('[data-scene="buggy"]').forEach((el) => {
  K.whenWanted(el, () => {
    const stage = K.createStage(el, { fov: 40, far: 700, exposure: 1.05 });
    if (!stage) return;
    el.stage = stage;
    const { scene, renderer, camera, lowPower } = stage;
    const col = K.col;
    const rand = K.seeded(23);

    /* ---------- Sky, haze and sunlight ---------- */
    scene.fog = new THREE.Fog(col("#b8c4ad"), 45, 260);
    const skyTex = K.canvasTexture(8, 256, (g, w, h) => {
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "#5d87a3");
      grd.addColorStop(0.5, "#c3d0c0");
      grd.addColorStop(1, "#ead7b0");
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(600, 24, 12),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })));

    scene.add(new THREE.HemisphereLight(col("#e4ecff"), col("#5b4a32"), 0.8));
    const sun = new THREE.DirectionalLight(col("#ffe0b5"), 2.3);
    if (renderer.shadowMap.enabled) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 140 });
      sun.shadow.bias = -0.0006;
      sun.shadow.normalBias = 0.03;
    }
    scene.add(sun, sun.target);

    /* ---------- The trail: an irregular loop through the hills ---------- */
    const loop = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r = 48 + 12 * Math.sin(3 * a + 1) + 6 * Math.cos(5 * a);
      loop.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r * 0.8));
    }
    const trail = new THREE.CatmullRomCurve3(loop, true, "centripetal");
    const trailLen = trail.getLength();
    const samples = trail.getSpacedPoints(420);

    // Distance to the trail. Trail points are bucketed in a 10 m grid so
    // each lookup only checks nearby points (anything beyond ~30 m counts
    // as "far", which is all the terrain shaping needs).
    const CELLSZ = 10, buckets = new Map();
    samples.forEach((p) => {
      const k = Math.floor(p.x / CELLSZ) + "," + Math.floor(p.z / CELLSZ);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(p);
    });
    const trailDist = (x, z) => {
      const cx = Math.floor(x / CELLSZ), cz = Math.floor(z / CELLSZ);
      let best = 40 * 40;
      for (let i = -3; i <= 3; i++) {
        for (let j = -3; j <= 3; j++) {
          const list = buckets.get((cx + i) + "," + (cz + j));
          if (!list) continue;
          for (let n = 0; n < list.length; n++) {
            const dx = x - list[n].x, dz = z - list[n].z, d = dx * dx + dz * dz;
            if (d < best) best = d;
          }
        }
      }
      return Math.sqrt(best);
    };
    const hills = (x, z) => (K.fbm(x * 0.011, z * 0.011, 4) - 0.5) * 22 + (K.fbm(x * 0.05 + 7, z * 0.05, 3) - 0.5) * 3;
    // Gentle near the trail, rougher further out; ruts and bumps on the trail itself
    function heightAt(x, z, d = trailDist(x, z)) {
      const near = 1 - K.smooth(2, 5, d);
      return hills(x, z) * K.lerp(0.35, 1, K.smooth(4, 34, d))
        + (K.noise(x * 0.7, z * 0.7) - 0.5) * 0.45 * near
        - 0.18 * (1 - K.smooth(0, 3.2, d));
    }
    // On the trail itself (d ≈ 0), no search needed
    const trailHeight = (x, z) => hills(x, z) * 0.35 + (K.noise(x * 0.7, z * 0.7) - 0.5) * 0.45 - 0.18;

    /* ---------- Terrain: grass, dry earth and the dirt trail ---------- */
    const SEG = lowPower ? 90 : 150, SIZE = 340;
    const ground = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    ground.rotateX(-Math.PI / 2);
    const pos = ground.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const dirt = col("#8c6a46"), dirtDark = col("#6d5136"), grass = col("#55703a"), dry = col("#8f8a52"), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), d = trailDist(x, z);
      pos.setY(i, heightAt(x, z, d));
      const n = K.fbm(x * 0.08, z * 0.08, 3);
      c.copy(grass).lerp(dry, K.smooth(0.45, 0.75, n));
      const onTrail = 1 - K.smooth(2.6, 5.5 + n * 2, d);
      c.lerp(n > 0.5 ? dirt : dirtDark, onTrail);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    ground.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    ground.computeVertexNormals();
    const terrain = new THREE.Mesh(ground, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
    terrain.receiveShadow = true;
    scene.add(terrain);

    /* ---------- Forest and rocks beside the trail ---------- */
    const TREES = lowPower ? 320 : 700;
    const canopy = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), new THREE.MeshStandardMaterial({ roughness: 0.9 }), TREES * 2);
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.18, 1, 6), new THREE.MeshStandardMaterial({ color: col("#4a3626"), roughness: 1 }), TREES);
    canopy.castShadow = trunks.castShadow = true;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
    const greens = ["#2f4a28", "#3a5a2c", "#24391f", "#46622f"].map(col);
    let placed = 0;
    for (let tries = 0; placed < TREES && tries < TREES * 6; tries++) {
      const x = (rand() - 0.5) * SIZE * 0.92, z = (rand() - 0.5) * SIZE * 0.92;
      const d = trailDist(x, z);
      if (d < 7 || (d < 14 && rand() < 0.6)) continue;
      const y = heightAt(x, z, d), h = 6 + rand() * 9, w = h * (0.26 + rand() * 0.08);
      trunks.setMatrixAt(placed, m4.compose(p3.set(x, y + h * 0.12, z), q, s3.set(1, h * 0.25, 1)));
      canopy.setMatrixAt(placed * 2, m4.compose(p3.set(x, y + h * 0.5, z), q, s3.set(w, h * 0.65, w)));
      canopy.setMatrixAt(placed * 2 + 1, m4.compose(p3.set(x, y + h * 0.78, z), q, s3.set(w * 0.7, h * 0.45, w * 0.7)));
      const g = greens[Math.floor(rand() * greens.length)];
      canopy.setColorAt(placed * 2, g);
      canopy.setColorAt(placed * 2 + 1, g);
      placed++;
    }
    canopy.count = placed * 2;
    trunks.count = placed;
    scene.add(canopy, trunks);

    const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: col("#7d776b"), roughness: 0.95, flatShading: true }), 80);
    rocks.castShadow = rocks.receiveShadow = true;
    for (let i = 0; i < 80; i++) {
      const sp = samples[Math.floor(rand() * samples.length)];
      const a = rand() * Math.PI * 2, r = 4.5 + rand() * 6;
      const x = sp.x + Math.cos(a) * r, z = sp.z + Math.sin(a) * r, sc = 0.25 + rand() * 0.8;
      q.setFromEuler(new THREE.Euler(rand() * 3, rand() * 3, rand() * 3));
      rocks.setMatrixAt(i, m4.compose(p3.set(x, heightAt(x, z) - sc * 0.3, z), q, s3.set(sc * 1.3, sc * 0.8, sc)));
    }
    scene.add(rocks);
    q.identity();

    /* ---------- ATV model with rider ---------- */
    const black = new THREE.MeshStandardMaterial({ color: col("#1b1d1c"), roughness: 0.75 });
    const steel = new THREE.MeshStandardMaterial({ color: col("#9aa09c"), metalness: 0.8, roughness: 0.35 });
    const lamp = new THREE.MeshStandardMaterial({ color: col("#fff4dc"), emissive: col("#fff0c8"), emissiveIntensity: 1.4 });
    const AG = {
      chassis: K.roundedBox(1.0, 0.32, 1.6, 0.1, 3),
      fender: K.roundedBox(1.32, 0.12, 0.62, 0.05, 3),
      seat: K.roundedBox(0.4, 0.16, 0.85, 0.07, 3),
      tank: K.roundedBox(0.55, 0.26, 0.5, 0.1, 3),
      tyre: new THREE.TorusGeometry(0.25, 0.14, 10, 22).rotateY(Math.PI / 2),
      hub: new THREE.CylinderGeometry(0.16, 0.16, 0.2, 14).rotateZ(Math.PI / 2),
      bar: new THREE.CylinderGeometry(0.025, 0.025, 0.85, 8).rotateZ(Math.PI / 2),
      lamp: new THREE.SphereGeometry(0.08, 12, 10),
      rack: new THREE.BoxGeometry(0.9, 0.04, 0.4)
    };
    function buildATV(paintHex, riderLook) {
      const paint = new THREE.MeshPhysicalMaterial({ color: col(paintHex), roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.2 });
      const atv = new THREE.Group();
      atv.rotation.order = "YXZ";
      const body = new THREE.Group(); // bounces on the suspension
      atv.add(body);
      const part = (geo, mat, parent, x, y, z) => {
        const o = new THREE.Mesh(geo, mat);
        o.position.set(x, y, z);
        o.castShadow = true;
        parent.add(o);
        return o;
      };
      part(AG.chassis, black, body, 0, 0.66, 0);
      part(AG.fender, paint, body, 0, 0.9, 0.62);
      part(AG.fender, paint, body, 0, 0.9, -0.6);
      part(AG.tank, paint, body, 0, 0.98, 0.25);
      part(AG.seat, black, body, 0, 1.0, -0.28);
      part(AG.rack, steel, body, 0, 1.0, 0.82);
      part(AG.rack, steel, body, 0, 1.0, -0.86);
      body.add(K.strut(new THREE.Vector3(0, 0.95, 0.5), new THREE.Vector3(0, 1.24, 0.38), 0.03, steel));
      part(AG.bar, black, body, 0, 1.25, 0.38);
      [-0.24, 0.24].forEach((x) => part(AG.lamp, lamp, body, x, 0.86, 0.95));
      const wheels = [[-0.62, 0.6], [0.62, 0.6], [-0.62, -0.58], [0.62, -0.58]].map(([x, z]) => {
        const w = new THREE.Group();
        w.position.set(x, 0.39, z);
        part(AG.tyre, black, w, 0, 0, 0);
        part(AG.hub, steel, w, 0, 0, 0);
        atv.add(w);
        return w;
      });

      // Rider, seated: legs forward to the footrests, arms to the handlebar
      const r = K.person(riderLook);
      r.root.position.set(0, 0.18, -0.3);
      r.legL.rotation.set(-1.25, 0, 0.22);
      r.legR.rotation.set(-1.25, 0, -0.22);
      r.torso.rotation.x = 0.35;
      r.armL.rotation.set(-1.15, 0, -0.28);
      r.armR.rotation.set(-1.15, 0, 0.28);
      r.head.rotation.x = -0.3;
      body.add(r.root);

      scene.add(atv);
      return { atv, body, wheels, rider: r };
    }
    const quads = [
      buildATV("#d63b2f", { helmet: "#C7F36B", shirt: "#20384f", shorts: "#2a2a2a", skin: "#8d5a3b", shoes: "#3a2a1f" }),
      buildATV("#2f6fd6", { helmet: "#f2f0ea", shirt: "#e8b13a", shorts: "#3a3d42", skin: "#b97b52", shoes: "#3a2a1f", scale: 0.92 })
    ];

    /* ---------- Dust trailing behind each ATV ---------- */
    const dustTex = K.glowTexture("rgba(200,172,128,0.55)", "rgba(200,172,128,0)");
    const DUST = lowPower ? 18 : 34;
    const dust = quads.map(() => Array.from({ length: DUST }, () => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dustTex, depthWrite: false, opacity: 0 }));
      s.userData = { life: 0, vx: 0, vy: 0, vz: 0 };
      scene.add(s);
      return s;
    }));
    const rear = new THREE.Vector3();
    function updateDust(i, dt, spawn) {
      const pool = dust[i];
      if (spawn) {
        const s = pool.find((d) => d.userData.life <= 0);
        if (s) {
          rear.set((rand() - 0.5) * 1.2, 0.25, -0.9).applyMatrix4(quads[i].atv.matrixWorld);
          s.position.copy(rear);
          Object.assign(s.userData, { life: 1, vx: (rand() - 0.5) * 1.2, vy: 0.6 + rand() * 0.8, vz: (rand() - 0.5) * 1.2 });
        }
      }
      pool.forEach((s) => {
        const u = s.userData;
        if (u.life <= 0) { s.material.opacity = 0; return; }
        u.life -= dt / 1.8;
        s.position.x += u.vx * dt; s.position.y += u.vy * dt; s.position.z += u.vz * dt;
        const size = 0.8 + (1 - u.life) * 4;
        s.scale.set(size, size, 1);
        s.material.opacity = Math.max(0, u.life) * 0.55;
      });
    }

    /* ---------- Motion along the trail ---------- */
    const SPEED = 9; // metres per second
    const pt = new THREE.Vector3(), tan = new THREE.Vector3(), side = new THREE.Vector3();
    function placeQuad(qd, u, lateral, time, i) {
      trail.getPointAt(u, pt);
      trail.getTangentAt(u, tan);
      tan.y = 0; tan.normalize();
      side.set(tan.z, 0, -tan.x);
      pt.addScaledVector(side, lateral);
      const y = trailHeight(pt.x, pt.z);
      qd.atv.position.set(pt.x, y, pt.z);
      // Pitch and roll from the ground under the wheels
      const hf = trailHeight(pt.x + tan.x * 0.7, pt.z + tan.z * 0.7), hb = trailHeight(pt.x - tan.x * 0.7, pt.z - tan.z * 0.7);
      const hl = trailHeight(pt.x + side.x * 0.6, pt.z + side.z * 0.6), hr = trailHeight(pt.x - side.x * 0.6, pt.z - side.z * 0.6);
      qd.atv.rotation.set(-Math.atan2(hf - hb, 1.4), Math.atan2(tan.x, tan.z), Math.atan2(hl - hr, 1.2));
      qd.body.position.y = 0.04 * Math.sin(time * 13 + i * 2) + 0.03 * Math.sin(time * 5.3 + i);
      qd.body.rotation.z = 0.025 * Math.sin(time * 7 + i);
      qd.rider.torso.rotation.x = 0.35 + 0.04 * Math.sin(time * 13 + i * 2 + 1);
    }

    const ptr = K.pointer(el.closest(".hero") || el);
    const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), want = new THREE.Vector3(), fwd = new THREE.Vector3();
    let u = 0.02, time = 0, started = false, dustTimer = 0;

    stage.onFrame = (dt) => {
      if (!K.reducedMotion) time += dt;
      ptr.update(dt);
      u = (0.02 + (time * SPEED) / trailLen) % 1;
      placeQuad(quads[0], u, 0.6, time, 0);
      placeQuad(quads[1], (u - 9 / trailLen + 1) % 1, -1.1, time, 1);
      quads.forEach((qd) => qd.wheels.forEach((w) => { w.rotation.x += (SPEED * dt) / 0.39; }));
      quads.forEach((qd) => qd.atv.updateMatrixWorld());

      dustTimer += dt;
      const spawn = dustTimer > 0.05;
      if (spawn) dustTimer = 0;
      updateDust(0, dt, spawn);
      updateDust(1, dt, spawn);

      // Chase camera: beside and a little behind the lead ATV, swinging slowly
      const lead = quads[0].atv.position;
      trail.getTangentAt(u, fwd);
      fwd.y = 0; fwd.normalize();
      side.set(fwd.z, 0, -fwd.x);
      // (wide enough to show both ATVs; aimed above them so they ride in
      // the lower part of the frame, under the heading)
      want.copy(lead)
        .addScaledVector(side, 10 + Math.sin(time * 0.13) * 2.5 + ptr.x * 1.2)
        .addScaledVector(fwd, -6 + Math.cos(time * 0.1) * 3);
      want.y = Math.max(lead.y + 3.2 - ptr.y * 0.6, heightAt(want.x, want.z) + 1.5);
      if (!started) { camPos.copy(want); camLook.copy(lead); started = true; }
      camPos.lerp(want, 1 - Math.exp(-2.5 * dt));
      camLook.lerp(want.copy(lead).addScaledVector(fwd, 1).setY(lead.y + 2.6), 1 - Math.exp(-4 * dt));
      camera.position.copy(camPos);
      camera.lookAt(camLook);

      sun.position.set(lead.x + 35, lead.y + 55, lead.z + 20);
      sun.target.position.copy(lead);
    };
    stage.invalidate();
  });
  });
})();
