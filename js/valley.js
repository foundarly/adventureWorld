/* ==========================================================
   ADVENTURE WORLD — 3D VALLEY, PLATFORM, JUMPER & CORD
   Builds the outdoor environment used by the hero and the Bungee
   Jumping scene: a river gorge with forested slopes and rock, a
   cantilevered steel jump platform, a harnessed jumper with movable
   joints, and the bungee cord. All real 3D geometry made in code.
   This is an illustration, not a model of the park's actual site.

   Units are roughly metres. The deck top is at y = 40 and the
   jumper faces the gorge (the -x direction).
   ========================================================== */
window.AW3D.buildValley = function (stage, options = {}) {
  const K = window.AW3D;
  const { scene, renderer, camera, lowPower } = stage;
  const col = K.col;
  const rand = K.seeded(options.seed || 11);
  const world = new THREE.Group();
  scene.add(world);

  /* ---------- 1. Terrain shape ---------- */
  const riverX = (z) => 10 * Math.sin(z * 0.012) + 4 * Math.sin(z * 0.031);
  const LEDGE = { x: 30, z: 0, y: 37.6 }; // flat rock where the platform is anchored

  function heightAt(x, z) {
    const d = Math.abs(x - riverX(z));                       // distance from the river
    const gorge = K.smooth(7, 24, d) * 34;                    // steep gorge walls
    const rise = K.smooth(24, 170, d) * 58;                   // valley sides
    const r = 1 - Math.abs(2 * K.fbm(x * 0.007 + 3.1, z * 0.007 - 1.7) - 1);
    const ridges = r * r * 95 * K.smooth(60, 260, d);         // mountain ridges further out
    const detail = (K.fbm(x * 0.045, z * 0.045, 4) - 0.5) * 7 * K.smooth(8, 26, d);
    const riverbed = -3 * (1 - K.smooth(0, 7, d));
    const h = gorge + rise + ridges + detail + riverbed;
    return K.lerp(h, LEDGE.y, K.smooth(13, 6, Math.hypot(x - LEDGE.x, z - LEDGE.z)));
  }

  /* ---------- 2. Sky dome, haze and lighting ---------- */
  const skyTex = K.canvasTexture(8, 512, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0.0, "#163128");
    grd.addColorStop(0.28, "#3f6158");
    grd.addColorStop(0.43, "#a3a98f");
    grd.addColorStop(0.5, "#ead5ad");
    grd.addColorStop(0.56, "#d9b88f");
    grd.addColorStop(1.0, "#7d6f5a");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  });
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1300, 32, 16),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })
  );
  sky.renderOrder = -1;
  scene.add(sky);

  // Reflections for water and steel come from the same sky (a small copy,
  // because the reflection capture camera only sees ~100 units)
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), sky.material));
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();

  // Distance haze in the horizon colour (atmospheric perspective)
  scene.fog = new THREE.Fog(col("#cdb994"), 90, 640);

  const sunDir = new THREE.Vector3(0.38, 0.4, -1).normalize(); // low sun, behind the platform
  scene.add(new THREE.HemisphereLight(col("#e3eadb"), col("#34432f"), 0.45));
  const sun = new THREE.DirectionalLight(col("#ffd9a8"), 2.4);
  sun.target.position.set(20, 34, 0);
  sun.position.copy(sun.target.position).addScaledVector(sunDir, 170);
  if (renderer.shadowMap.enabled) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 80, far: 300 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
  }
  scene.add(sun, sun.target);

  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: K.glowTexture("rgba(255,233,196,0.95)", "rgba(255,214,160,0)"),
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true
  }));
  sunGlow.scale.set(420, 420, 1);
  scene.add(sunGlow);

  /* ---------- 3. Terrain mesh with painted vertex colours ---------- */
  const SIZE = 900, SEG = lowPower ? 160 : 300;
  const tGeo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  tGeo.rotateX(-Math.PI / 2);
  const tPos = tGeo.attributes.position;
  // Pack grid points closer together near the platform (about 1 m apart)
  // and spread them out in the hazy distance: detail where the camera goes
  const warp = (v, centre) => { const u = v / (SIZE / 2); return centre + (SIZE / 2) * u * (0.35 + 0.65 * u * u); };
  for (let i = 0; i < tPos.count; i++) {
    const x = warp(tPos.getX(i), 10), z = warp(tPos.getZ(i), 0);
    tPos.setXYZ(i, x, heightAt(x, z), z);
  }
  tGeo.computeVertexNormals();

  const tNor = tGeo.attributes.normal;
  const colors = new Float32Array(tPos.count * 3);
  const grassA = col("#3a5f3f"), grassB = col("#193C30"), bank = col("#23402f");
  const rockA = col("#b0906b"), rockB = col("#6f5944"), peak = col("#8f8b7d");
  const c = new THREE.Color(), rock = new THREE.Color();
  for (let i = 0; i < tPos.count; i++) {
    const x = tPos.getX(i), y = tPos.getY(i), z = tPos.getZ(i);
    const n = K.fbm(x * 0.03, z * 0.03, 3);
    const slope = 1 - tNor.getY(i);
    c.copy(grassA).lerp(grassB, n);
    if (y < 3) c.lerp(bank, 0.6);
    rock.copy(rockA).lerp(rockB, n);
    c.lerp(rock, K.smooth(0.2, 0.42, slope + (n - 0.5) * 0.18));  // bare rock on steep faces
    c.lerp(peak, K.smooth(100, 160, y) * 0.7);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  tGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const terrain = new THREE.Mesh(tGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96 }));
  terrain.receiveShadow = true;
  world.add(terrain);

  /* ---------- 4. River ---------- */
  const rGeo = new THREE.PlaneGeometry(18, SIZE, 1, 220);
  rGeo.rotateX(-Math.PI / 2);
  const rPos = rGeo.attributes.position;
  for (let i = 0; i < rPos.count; i++) {
    rPos.setX(i, rPos.getX(i) + riverX(rPos.getZ(i)));
    rPos.setY(i, -1.3);
  }
  rGeo.computeVertexNormals();
  const river = new THREE.Mesh(rGeo, new THREE.MeshStandardMaterial({
    color: col("#2a5a55"), roughness: 0.07, metalness: 0.35, envMapIntensity: 1.3
  }));
  river.receiveShadow = true;
  world.add(river);

  /* ---------- 5. Forest (one instanced mesh of fir trees) ---------- */
  // Fir: five overlapping branch layers, narrowing toward the top
  const tier = (r, h, y, turn) => new THREE.ConeGeometry(r, h, 9, 1, true).rotateY(turn).translate(0, y, 0);
  const firGeo = K.mergeGeometries([
    new THREE.CylinderGeometry(0.04, 0.06, 0.3, 6).translate(0, 0.15, 0),
    tier(0.48, 0.34, 0.3, 0), tier(0.42, 0.32, 0.45, 0.4), tier(0.34, 0.3, 0.6, 0.8),
    tier(0.25, 0.28, 0.75, 1.2), tier(0.15, 0.26, 0.88, 1.6)
  ]);
  const firMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, side: THREE.DoubleSide });
  const foreground = options.foreground || [];
  const target = (lowPower ? 1500 : 4200) + foreground.length;
  const trees = new THREE.InstancedMesh(firGeo, firMat, target);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const darkFir = col("#10291d"), lightFir = col("#2a5a3f"), tint = new THREE.Color();
  let placed = 0;
  const plant = (x, z, height) => {
    p.set(x, heightAt(x, z) - 0.4, z);
    q.setFromAxisAngle(up, rand() * Math.PI * 2);
    s.set(height * 0.45, height, height * 0.45);
    trees.setMatrixAt(placed, m.compose(p, q, s));
    trees.setColorAt(placed, tint.copy(darkFir).lerp(lightFir, rand() * 0.8));
    placed++;
  };
  foreground.forEach(([x, z, h]) => plant(x, z, h)); // hand-placed trees that frame a camera view
  for (let tries = 0; placed < target && tries < target * 8; tries++) {
    const x = (rand() - 0.5) * 620, z = (rand() - 0.5) * 620 - 40;
    const d = Math.abs(x - riverX(z));
    if (d < 12 || Math.hypot(x - 22, z) < 15) continue;           // not in the river or on the platform
    const h = heightAt(x, z);
    const grad = Math.hypot(heightAt(x + 2, z) - h, heightAt(x, z + 2) - h) / 2;
    if (grad > 0.85 || h > 125) continue;                           // no trees on cliffs or peaks
    plant(x, z, 4.5 + rand() * 5.5);
  }
  trees.count = placed;
  trees.instanceMatrix.needsUpdate = true;
  if (trees.instanceColor) trees.instanceColor.needsUpdate = true;
  world.add(trees);

  /* ---------- 6. Rock outcrop that holds the platform ---------- */
  const rockGeo = new THREE.IcosahedronGeometry(1, 3);
  const rp = rockGeo.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    p.fromBufferAttribute(rp, i);
    p.multiplyScalar(0.82 + K.fbm(p.x * 2 + 5, p.y * 2 + p.z * 1.7, 3) * 0.38);
    rp.setXYZ(i, p.x, p.y, p.z);
  }
  rockGeo.computeVertexNormals();
  const rockMat = new THREE.MeshStandardMaterial({ color: col("#9a7c5c"), roughness: 1, flatShading: true });
  const outcrop = new THREE.Mesh(rockGeo, rockMat);
  outcrop.scale.set(9.5, 14, 10.5);
  outcrop.position.set(31.5, 24, 0.5);
  outcrop.castShadow = outcrop.receiveShadow = true;
  world.add(outcrop);
  [[24, 20, 7, 3.2], [36, 33, -8, 4], [27, 26, -6, 2.6]].forEach(([x, y, z, r]) => {
    const b = new THREE.Mesh(rockGeo, rockMat);
    b.position.set(x, y, z);
    b.scale.set(r, r * 0.8, r * 1.1);
    b.rotation.set(rand() * 3, rand() * 3, 0);
    b.castShadow = b.receiveShadow = true;
    world.add(b);
  });

  /* ---------- 7. Jump platform ---------- */
  const DECK_Y = 40, EDGE_X = 11.7;
  const platform = new THREE.Group();
  world.add(platform);
  const steel = new THREE.MeshStandardMaterial({ color: col("#2a302c"), metalness: 0.75, roughness: 0.38 });
  const plankTex = K.canvasTexture(256, 64, (g, w, h) => {
    g.fillStyle = "#7b5d42"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "#836446" : "#73563d";
      g.fillRect(0, i * 8, w, 7);
      g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, i * 8 + 7, w, 1);
    }
  });
  plankTex.wrapS = plankTex.wrapT = THREE.RepeatWrapping;
  plankTex.repeat.set(4, 1);
  const add = (mesh) => { mesh.castShadow = mesh.receiveShadow = true; platform.add(mesh); return mesh; };

  const deck = add(new THREE.Mesh(new THREE.BoxGeometry(18.6, 0.45, 3.2),
    new THREE.MeshStandardMaterial({ map: plankTex, roughness: 0.85 })));
  deck.position.set(EDGE_X + 9.3, DECK_Y - 0.225, 0);

  [-1.42, 1.42].forEach((z) => {
    add(new THREE.Mesh(new THREE.BoxGeometry(18.6, 0.55, 0.22), steel)).position.set(EDGE_X + 9.3, DECK_Y - 0.7, z);
    // diagonal struts down into the rock
    platform.add(K.strut(new THREE.Vector3(14, DECK_Y - 0.9, z), new THREE.Vector3(26.5, 30.5, z * 1.15), 0.13, steel));
    platform.add(K.strut(new THREE.Vector3(19, DECK_Y - 0.9, z), new THREE.Vector3(27.5, 33, z * 1.15), 0.11, steel));
    // railings along the sides (the jump end stays open)
    for (let x = 14.2; x <= 30.3; x += 2) {
      platform.add(K.strut(new THREE.Vector3(x, DECK_Y, z * 1.06), new THREE.Vector3(x, DECK_Y + 1.1, z * 1.06), 0.04, steel, 6));
    }
    [DECK_Y + 1.1, DECK_Y + 0.55].forEach((y) => {
      platform.add(K.strut(new THREE.Vector3(12.1, y, z * 1.06), new THREE.Vector3(30.2, y, z * 1.06), 0.035, steel, 6));
    });
    // jump frame posts
    platform.add(K.strut(new THREE.Vector3(12.1, DECK_Y, z), new THREE.Vector3(12.1, DECK_Y + 4.4, z), 0.09, steel));
  });
  platform.add(K.strut(new THREE.Vector3(12.1, DECK_Y + 4.4, -1.5), new THREE.Vector3(12.1, DECK_Y + 4.4, 1.5), 0.1, steel));

  // Operator cabin at the cliff end
  const cabin = add(new THREE.Mesh(K.roundedBox(4.2, 2.8, 3.6, 0.08, 2),
    new THREE.MeshStandardMaterial({ color: col("#e8e3d6"), roughness: 0.7 })));
  cabin.position.set(27.8, DECK_Y + 1.4, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.22, 4.2), steel)).position.set(27.8, DECK_Y + 2.9, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 2.3),
    new THREE.MeshStandardMaterial({ color: col("#1b2622"), metalness: 0.3, roughness: 0.08 }))).position.set(25.68, DECK_Y + 1.6, 0);

  // Anchor point on the crossbar, where the cord is attached
  const anchor = new THREE.Vector3(12.1, DECK_Y + 4.18, 0);
  const cordMat = new THREE.MeshStandardMaterial({ color: col("#A6F5A8"), roughness: 0.5 });
  const shackle = add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 8, 16), steel));
  shackle.position.copy(anchor);

  /* ---------- 8. The jumper (jointed figure in harness gear) ---------- */
  const jumper = (function buildJumper() {
    const mat = (hex, rough = 0.7, metal = 0) => new THREE.MeshStandardMaterial({ color: col(hex), roughness: rough, metalness: metal });
    const skin = mat("#b98063", 0.6), suit = mat("#202622"), pants = mat("#193C30", 0.8);
    const strap = mat("#A6F5A8", 0.5), helmetMat = mat("#F7F5EF", 0.3, 0.05), shoe = mat("#3b3f3c", 0.6);
    const mesh = (geo, material) => { const o = new THREE.Mesh(geo, material); o.castShadow = true; return o; };
    // A limb hangs down from its pivot (the joint at its top)
    const limb = (len, r, material) => {
      const g = new THREE.Group();
      g.add(mesh(new THREE.SphereGeometry(r, 10, 8), material));
      const seg = mesh(new THREE.CylinderGeometry(r, r * 0.86, len, 10), material);
      seg.position.y = -len / 2;
      g.add(seg);
      return g;
    };

    const root = new THREE.Group();       // sits at the feet; place this
    const pitch = new THREE.Group();      // tips the whole body forward (pivot at feet)
    root.add(pitch);
    const hips = new THREE.Group();
    hips.position.y = 0.98;
    pitch.add(hips);
    hips.add(mesh(new THREE.SphereGeometry(1, 12, 10).scale(0.17, 0.12, 0.12), pants));

    const spine = new THREE.Group();
    hips.add(spine);
    const torso = mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.56, 12), suit);
    torso.position.y = 0.3;
    spine.add(torso);
    const neck = new THREE.Group();
    neck.position.y = 0.62;
    spine.add(neck);
    const head = mesh(new THREE.SphereGeometry(0.11, 14, 12), skin);
    head.position.y = 0.14;
    neck.add(head);
    const helmet = mesh(new THREE.SphereGeometry(0.125, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), helmetMat);
    helmet.position.y = 0.16;
    neck.add(helmet);

    // Harness: waist belt, chest strap and leg loops in the bright accent colour
    const belt = mesh(new THREE.TorusGeometry(0.175, 0.026, 8, 24), strap);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 0.04;
    spine.add(belt);
    const chest = mesh(new THREE.TorusGeometry(0.165, 0.02, 8, 24), strap);
    chest.rotation.x = Math.PI / 2;
    chest.position.y = 0.44;
    spine.add(chest);

    const joints = {};
    [["L", 1], ["R", -1]].forEach(([side, sgn]) => {
      const shoulder = limb(0.29, 0.048, suit);
      shoulder.position.set(0.21 * sgn, 0.52, 0);
      spine.add(shoulder);
      const elbow = limb(0.26, 0.04, suit);
      elbow.position.y = -0.29;
      shoulder.add(elbow);
      const hand = mesh(new THREE.SphereGeometry(0.045, 8, 8), skin);
      hand.position.y = -0.29;
      elbow.add(hand);

      const hip = limb(0.45, 0.072, pants);
      hip.position.set(0.09 * sgn, -0.02, 0);
      hips.add(hip);
      const loop = mesh(new THREE.TorusGeometry(0.085, 0.018, 6, 18), strap);
      loop.rotation.x = Math.PI / 2;
      loop.position.y = -0.08;
      hip.add(loop);
      const knee = limb(0.45, 0.056, pants);
      knee.position.y = -0.45;
      hip.add(knee);
      const ankleCuff = mesh(new THREE.TorusGeometry(0.066, 0.022, 6, 18), strap);
      ankleCuff.rotation.x = Math.PI / 2;
      ankleCuff.position.y = -0.4;
      knee.add(ankleCuff);
      const foot = mesh(new THREE.BoxGeometry(0.1, 0.08, 0.26), shoe);
      foot.position.set(0, -0.49, 0.07);
      knee.add(foot);
      const ankle = new THREE.Object3D(); // where the cord attaches
      ankle.position.y = -0.42;
      knee.add(ankle);
      joints["shoulder" + side] = shoulder; joints["elbow" + side] = elbow;
      joints["hip" + side] = hip; joints["knee" + side] = knee; joints["ankle" + side] = ankle;
    });
    joints.spine = spine;
    joints.neck = neck;

    // Poses: joint angles in radians. L/R mirror on the z axis.
    // (Body faces +z; negative x on a shoulder/hip swings that limb forward.)
    const POSES = {
      stand: { spine: [0, 0, 0], neck: [0, 0, 0], shoulder: [0.05, 0, 0.16], elbow: [-0.15, 0, 0], hip: [0, 0, 0.03], knee: [0, 0, 0] },
      ready: { spine: [0.14, 0, 0], neck: [-0.15, 0, 0], shoulder: [-1.2, 0, 0.38], elbow: [-0.25, 0, 0], hip: [-0.28, 0, 0.04], knee: [0.48, 0, 0] },
      dive:  { spine: [-0.22, 0, 0], neck: [-0.3, 0, 0], shoulder: [-0.35, 0, 1.45], elbow: [-0.05, 0, 0], hip: [0.08, 0, 0.05], knee: [0.05, 0, 0] },
      hang:  { spine: [-0.05, 0, 0], neck: [0.1, 0, 0], shoulder: [-2.85, 0, 0.32], elbow: [-0.12, 0, 0], hip: [0, 0, 0.04], knee: [0.12, 0, 0] }
    };
    const apply = (name, value) => {
      if (name === "spine" || name === "neck") { joints[name].rotation.set(value[0], value[1], value[2]); return; }
      joints[name + "L"].rotation.set(value[0], value[1], value[2]);
      joints[name + "R"].rotation.set(value[0], -value[1], -value[2]);
    };
    // Blend smoothly between two poses (t from 0 to 1)
    const blendPose = (a, b, t) => {
      Object.keys(POSES[a]).forEach((key) => {
        const A = POSES[a][key], B = POSES[b][key];
        apply(key, [K.lerp(A[0], B[0], t), K.lerp(A[1], B[1], t), K.lerp(A[2], B[2], t)]);
      });
    };
    blendPose("stand", "stand", 0);
    root.rotation.y = -Math.PI / 2; // face the gorge
    world.add(root);
    return { root, pitch, joints, blendPose };
  })();

  /* ---------- 9. Bungee cord (rebuilt only when the jumper moves) ---------- */
  const ankleL = new THREE.Vector3(), ankleR = new THREE.Vector3(), ankle = new THREE.Vector3();
  let cord = null;
  function updateCord(restLength = 18) {
    jumper.root.updateMatrixWorld(true);
    jumper.joints.ankleL.getWorldPosition(ankleL);
    jumper.joints.ankleR.getWorldPosition(ankleR);
    ankle.addVectors(ankleL, ankleR).multiplyScalar(0.5);
    // A slack cord hangs in a loop below the line; a stretched one is straight
    const slack = Math.max(0, restLength - anchor.distanceTo(ankle));
    const mid = anchor.clone().lerp(ankle, 0.5);
    mid.y -= slack * 0.55;
    mid.x -= slack * 0.12; // the loop hangs out over the edge, not through the deck
    const geo = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(anchor, mid, ankle.clone()), 48, 0.055, 6, false);
    if (cord) { cord.geometry.dispose(); cord.geometry = geo; }
    else { cord = new THREE.Mesh(geo, cordMat); cord.castShadow = true; world.add(cord); }
  }

  /* ---------- 10. Drifting clouds ---------- */
  const cloudTex = K.glowTexture("rgba(255,250,240,0.85)", "rgba(255,250,240,0)");
  const clouds = [];
  for (let i = 0; i < 10; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: cloudTex, transparent: true, depthWrite: false, opacity: 0.25 + rand() * 0.3
    }));
    const w = 160 + rand() * 200;
    sprite.scale.set(w, w * 0.3, 1);
    sprite.position.set((rand() - 0.5) * 700, 100 + rand() * 60, -420 + rand() * 420);
    sprite.userData.speed = 1.2 + rand() * 2.2;
    clouds.push(sprite);
    scene.add(sprite);
  }

  // Called every frame by the scene
  function tick(dt) {
    sky.position.copy(camera.position);
    sunGlow.position.copy(camera.position).addScaledVector(sunDir, 1000);
    clouds.forEach((cl) => {
      cl.position.x += cl.userData.speed * dt;
      if (cl.position.x > 380) cl.position.x = -380;
    });
  }

  return {
    world, heightAt, riverX, anchor, jumper, updateCord, tick,
    deckY: DECK_Y,
    edge: new THREE.Vector3(EDGE_X + 0.75, DECK_Y, 0) // where the jumper stands
  };
};
