/* ==========================================================
   ADVENTURE WORLD — JUMPING ACTIVITIES 3D SCENE (hero background)
   An indoor trampoline park: a grid of trampoline beds on blue
   padding, angled wall trampolines and a foam pit. Children bounce
   (the bed dips under them), doing star jumps, tuck jumps and front
   flips, while the camera drifts slowly across the hall. All real 3D
   geometry made in code; an illustration, not the park's facility.
   script.js switches it on and off (el.stage.setActive).
   ========================================================== */
(function () {
  "use strict";
  const K = window.AW3D;
  if (!K) return;

  document.querySelectorAll('[data-scene="jumping"]').forEach((el) => {
  K.whenWanted(el, () => {
    const stage = K.createStage(el, { fov: 40, far: 140, exposure: 1.0 });
    if (!stage) return;
    el.stage = stage;
    const { scene, renderer, camera, lowPower } = stage;
    const col = K.col;
    const rand = K.seeded(41);

    /* ---------- Hall: atmosphere, reflections, lights ---------- */
    scene.background = col("#141a1d");
    scene.fog = new THREE.Fog(col("#141a1d"), 22, 60);
    scene.environment = K.studioEnvironment(renderer, {
      background: "#161c1f",
      lights: [
        { x: 0, y: 8, z: -3, w: 20, h: 0.3, d: 1.4, color: "#fff1d6", intensity: 3 },
        { x: 0, y: 8, z: 3, w: 20, h: 0.3, d: 1.4, color: "#fff1d6", intensity: 3 },
        { x: -14, y: 3, z: 0, w: 0.3, h: 4, d: 14, color: "#2a5bd7", intensity: 1.2 },
        { x: 14, y: 3, z: 0, w: 0.3, h: 4, d: 14, color: "#C7F36B", intensity: 1.1 }
      ]
    });
    scene.add(new THREE.HemisphereLight(col("#fff4e2"), col("#26303a"), 0.75));
    const key = new THREE.DirectionalLight(col("#fff0d8"), 1.7);
    key.position.set(4, 14, 8);
    if (renderer.shadowMap.enabled) {
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      Object.assign(key.shadow.camera, { left: -16, right: 16, top: 12, bottom: -12, near: 1, far: 40 });
      key.shadow.bias = -0.0005;
      key.shadow.normalBias = 0.02;
    }
    scene.add(key);
    const lime = new THREE.PointLight(col("#C7F36B"), 1.0, 18);
    lime.position.set(10, 3, 1);
    const blue = new THREE.PointLight(col("#5d8bff"), 1.1, 20);
    blue.position.set(-9, 3.5, 2);
    scene.add(lime, blue);

    const hall = new THREE.Mesh(new THREE.BoxGeometry(64, 16, 44),
      new THREE.MeshStandardMaterial({ color: col("#232b2f"), roughness: 0.95, side: THREE.BackSide }));
    hall.position.set(2, 7.9, 0);
    hall.receiveShadow = true;
    scene.add(hall);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(64, 44), new THREE.MeshStandardMaterial({ color: col("#2c3236"), roughness: 0.7, metalness: 0.1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.x = 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling light panels with soft halos
    const panelGeo = new THREE.BoxGeometry(2.4, 0.08, 0.5);
    const panelMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe9c4").multiplyScalar(1.5) });
    const halo = K.glowTexture("rgba(255,226,180,0.8)", "rgba(255,226,180,0)");
    for (let x = -12; x <= 16; x += 4.5) {
      [-4, 1, 6].forEach((z) => {
        const p = new THREE.Mesh(panelGeo, panelMat);
        p.position.set(x, 9.2, z);
        scene.add(p);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.45 }));
        s.position.set(x, 9.0, z);
        s.scale.set(4.5, 2.2, 1);
        scene.add(s);
      });
    }

    /* ---------- Trampoline court ---------- */
    const COLS = 4, ROWS = 2, CELL = 3.2, PAD = 0.42, TOP = 0.6;
    const W = COLS * CELL, D = ROWS * CELL;
    const padBlue = new THREE.MeshStandardMaterial({ color: col("#2a5bd7"), roughness: 0.55 });
    const padLime = new THREE.MeshStandardMaterial({ color: col("#C7F36B"), roughness: 0.5 });
    const base = new THREE.Mesh(K.roundedBox(W + 0.6, TOP, D + 0.6, 0.12, 3), padBlue);
    base.position.y = TOP / 2;
    base.castShadow = base.receiveShadow = true;
    scene.add(base);
    // Lime trim around the court edge
    [[0, D / 2 + 0.3, W + 0.6, 0.12], [0, -D / 2 - 0.3, W + 0.6, 0.12]].forEach(([x, z, w, d]) => {
      const t = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), padLime);
      t.position.set(x, TOP + 0.02, z);
      scene.add(t);
    });

    // Woven-mat texture for the beds
    const matTex = K.canvasTexture(256, 256, (g, w, h) => {
      g.fillStyle = "#141618"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(255,255,255,0.05)"; g.lineWidth = 2;
      for (let i = 0; i < w; i += 8) {
        g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke();
        g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke();
      }
    });
    matTex.wrapS = matTex.wrapT = THREE.RepeatWrapping;
    matTex.repeat.set(3, 3);
    const bedMat = new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.85 });
    const BED = CELL - PAD, BSEG = 14;
    const beds = [];
    for (let r = 0; r < ROWS; r++) {
      for (let cI = 0; cI < COLS; cI++) {
        const geo = new THREE.PlaneGeometry(BED, BED, BSEG, BSEG);
        geo.rotateX(-Math.PI / 2);
        const mesh = new THREE.Mesh(geo, bedMat);
        const cx = -W / 2 + CELL * (cI + 0.5), cz = -D / 2 + CELL * (r + 0.5);
        mesh.position.set(cx, TOP + 0.015, cz);
        mesh.receiveShadow = true;
        scene.add(mesh);
        beds.push({ mesh, cx, cz, base: Float32Array.from(geo.attributes.position.array) });
      }
    }

    // Angled wall trampolines along the back
    const wallMat = new THREE.MeshStandardMaterial({ color: col("#1d2a44"), roughness: 0.7 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, 3.2, 0.5), wallMat);
    backWall.position.set(0, 1.6 + 1.2, -D / 2 - 2.0);
    backWall.receiveShadow = true;
    scene.add(backWall);
    for (let cI = 0; cI < COLS; cI++) {
      const slope = new THREE.Mesh(new THREE.PlaneGeometry(BED, 2.4), bedMat);
      slope.position.set(-W / 2 + CELL * (cI + 0.5), TOP + 1.05, -D / 2 - 0.95);
      slope.rotation.x = -0.95;
      scene.add(slope);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(PAD, 0.18, 2.6), padBlue);
      frame.position.set(-W / 2 + CELL * cI, TOP + 1.05, -D / 2 - 0.95);
      frame.rotation.x = 0.62;
      scene.add(frame);
    }

    /* ---------- Foam pit with colourful foam cubes ---------- */
    const PIT = { x0: W / 2 + 1.0, x1: W / 2 + 5.4, z0: -D / 2, z1: D / 2 };
    const pitWall = (x, z, w, d) => {
      const m = new THREE.Mesh(K.roundedBox(w, 1.1, d, 0.1, 2), padBlue);
      m.position.set(x, 0.55, z);
      m.castShadow = m.receiveShadow = true;
      scene.add(m);
    };
    const pcx = (PIT.x0 + PIT.x1) / 2, pw = PIT.x1 - PIT.x0 + 0.5;
    pitWall(pcx, PIT.z0 - 0.25, pw, 0.5);
    pitWall(pcx, PIT.z1 + 0.25, pw, 0.5);
    pitWall(PIT.x1 + 0.25, 0, 0.5, PIT.z1 - PIT.z0 + 1);
    const CUBES = lowPower ? 220 : 480;
    const cubes = new THREE.InstancedMesh(K.roundedBox(0.42, 0.42, 0.42, 0.08, 2), new THREE.MeshStandardMaterial({ roughness: 0.8 }), CUBES);
    cubes.castShadow = true;
    const foamColors = ["#C7F36B", "#2a5bd7", "#f2f0ea", "#ff8a3d", "#e94f6a", "#ffd23f"].map(col);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
    const cubeData = [];
    for (let i = 0; i < CUBES; i++) {
      const x = PIT.x0 + 0.2 + rand() * (PIT.x1 - PIT.x0 - 0.4), z = PIT.z0 + 0.2 + rand() * (PIT.z1 - PIT.z0 - 0.4);
      const y = 0.22 + rand() * 0.75;
      cubeData.push({ x, y, z, rx: rand() * 3, ry: rand() * 3, ph: rand() * 6 });
      cubes.setColorAt(i, foamColors[i % foamColors.length]);
    }
    scene.add(cubes);
    function placeCubes(time) {
      cubeData.forEach((c, i) => {
        e.set(c.rx, c.ry + Math.sin(time * 0.6 + c.ph) * 0.04, 0);
        q.setFromEuler(e);
        cubes.setMatrixAt(i, m4.compose(p3.set(c.x, c.y + Math.sin(time * 1.3 + c.ph) * 0.015, c.z), q, s3.set(1, 1, 1)));
      });
      cubes.instanceMatrix.needsUpdate = true;
    }

    /* ---------- Children bouncing ---------- */
    // style: how they move in the air. bed: which trampoline (0–7).
    const KIDS = [
      { bed: 1, style: "star", h: 1.3, ph: 0.0, look: { shirt: "#e4574a", shorts: "#22324a", skin: "#8d5a3b", hair: "#1b1410", scale: 0.74 } },
      { bed: 2, style: "flip", h: 1.7, ph: 0.4, look: { shirt: "#C7F36B", shorts: "#1d1f22", skin: "#c68a5e", hair: "#2b1d14", scale: 0.8 } },
      { bed: 5, style: "tuck", h: 1.2, ph: 0.75, look: { shirt: "#ffd23f", shorts: "#2a5bd7", skin: "#6e4630", hair: "#0f0b08", scale: 0.7 } },
      { bed: 6, style: "straight", h: 1.5, ph: 0.2, look: { shirt: "#2a5bd7", shorts: "#f2f0ea", skin: "#b97b52", hair: "#3a2416", scale: 0.78 } },
      { bed: 4, style: "star", h: 1.0, ph: 0.55, look: { shirt: "#ff8a3d", shorts: "#2a2a2a", skin: "#a86d47", hair: "#16110d", scale: 0.68 } },
      { bed: 3, style: "tuck", h: 1.4, ph: 0.9, look: { shirt: "#f2f0ea", shorts: "#e94f6a", skin: "#8d5a3b", hair: "#1b1410", scale: 0.76 } }
    ];
    const GRAV = 9.8, CONTACT = 0.2;
    const kids = KIDS.map((k) => {
      const p = K.person(k.look);
      const pivot = new THREE.Group(); // rotation point at the hips, for flips
      const hipY = 0.92 * k.look.scale;
      p.root.position.y = -hipY;
      pivot.add(p.root);
      const holder = new THREE.Group();
      holder.add(pivot);
      pivot.position.y = hipY;
      const bed = beds[k.bed];
      holder.position.set(bed.cx + (rand() - 0.5) * 0.4, TOP, bed.cz + (rand() - 0.5) * 0.4);
      holder.rotation.y = (rand() - 0.5) * 1.4;
      scene.add(holder);
      const air = 2 * Math.sqrt((2 * k.h) / GRAV);
      return Object.assign({ p, pivot, holder, air, cycle: air + CONTACT, depth: 0 }, k);
    });

    function poseKid(k, time) {
      const { p } = k;
      const tau = ((time / k.cycle + k.ph) % 1) * k.cycle;
      p.armL.rotation.set(0, 0, -0.12); p.armR.rotation.set(0, 0, 0.12);
      p.legL.rotation.set(0, 0, 0); p.legR.rotation.set(0, 0, 0);
      p.torso.rotation.set(0, 0, 0);
      k.pivot.rotation.x = 0;
      p.root.scale.y = p.root.scale.x;
      if (tau < CONTACT) {
        // On the bed: it sinks under them, they crouch and swing the arms down
        const c = Math.sin((Math.PI * tau) / CONTACT);
        k.depth = c * 0.32;
        k.holder.position.y = TOP - k.depth;
        p.root.scale.y = p.root.scale.x * (1 - 0.12 * c);
        p.armL.rotation.x = p.armR.rotation.x = 0.5 * c;
        p.torso.rotation.x = 0.25 * c;
        return;
      }
      k.depth = 0;
      const f = (tau - CONTACT) / k.air, peak = Math.sin(Math.PI * f);
      k.holder.position.y = TOP + 4 * k.h * f * (1 - f);
      if (k.style === "star") {
        p.armL.rotation.z = -0.12 - 2.4 * peak; p.armR.rotation.z = 0.12 + 2.4 * peak;
        p.legL.rotation.z = -0.5 * peak; p.legR.rotation.z = 0.5 * peak;
      } else if (k.style === "tuck") {
        p.legL.rotation.x = p.legR.rotation.x = -1.5 * peak;
        p.armL.rotation.x = p.armR.rotation.x = -1.1 * peak;
        p.torso.rotation.x = 0.3 * peak;
      } else if (k.style === "flip") {
        k.pivot.rotation.x = Math.PI * 2 * K.easeInOut(K.clamp((f - 0.08) / 0.84, 0, 1));
        p.legL.rotation.x = p.legR.rotation.x = -1.4 * peak;
        p.armL.rotation.x = p.armR.rotation.x = -1.3 * peak;
      } else {
        p.armL.rotation.x = p.armR.rotation.x = -2.9 * peak; // arms reach up
      }
    }

    // The bed dips under whoever lands on it
    function dentBeds() {
      beds.forEach((b, bi) => {
        const arr = b.mesh.geometry.attributes.position.array;
        const on = kids.filter((k) => k.bed === bi && k.depth > 0);
        if (!on.length && !b.dented) return;
        for (let i = 0; i < arr.length; i += 3) {
          let dip = 0;
          on.forEach((k) => {
            const dx = b.base[i] - (k.holder.position.x - b.cx), dz = b.base[i + 2] - (k.holder.position.z - b.cz);
            dip = Math.max(dip, k.depth * Math.exp(-(dx * dx + dz * dz) / 0.7));
          });
          arr[i + 1] = b.base[i + 1] - dip;
        }
        b.dented = on.length > 0;
        b.mesh.geometry.attributes.position.needsUpdate = true;
        b.mesh.geometry.computeVertexNormals();
      });
    }

    /* ---------- Camera: slow drift across the hall ---------- */
    const ptr = K.pointer(el.closest(".hero") || el);
    const LOOK = new THREE.Vector3(1.8, 1.3, -0.6);
    let radius = 15.5, time = 0;
    stage.onResize = (w, h) => { radius = 15.5 * (w / h < 0.8 ? 1.5 : w / h < 1.3 ? 1.2 : 1); };

    stage.onFrame = (dt) => {
      if (!K.reducedMotion) time += dt;
      ptr.update(dt);
      kids.forEach((k) => poseKid(k, time));
      dentBeds();
      placeCubes(time);
      const th = 0.25 + Math.sin(time * 0.08) * 0.55 + ptr.x * 0.08;
      camera.position.set(LOOK.x + Math.sin(th) * radius, 5.2 + Math.sin(time * 0.11) * 0.8 - ptr.y * 0.6, LOOK.z + Math.cos(th) * radius);
      camera.lookAt(LOOK);
    };
    stage.invalidate();
  });
  });
})();
