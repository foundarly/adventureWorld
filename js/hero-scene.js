/* ==========================================================
   ADVENTURE WORLD — HERO 3D SCENE
   Establishing shot: the river gorge and the jump platform, seen
   from down the valley. The camera glides in when the page loads,
   drifts gently with the mouse, and pushes toward the platform as
   you scroll into the page.
   ========================================================== */
(function () {
  "use strict";
  const K = window.AW3D;
  const el = document.querySelector('[data-scene="hero"]');
  if (!el || !K) return;

  K.whenNear(el, () => {
    const stage = K.createStage(el, { fov: 36, far: 1500, exposure: 1.05 });
    if (!stage) return;

    // Large trees placed close to the camera frame the shot (foreground depth)
    const world = K.buildValley(stage, {
      foreground: [[-24, 64, 19], [-31, 50, 16], [-19, 82, 22], [31, 97, 18], [39, 84, 15]]
    });
    const { jumper } = world;
    jumper.root.position.copy(world.edge);
    jumper.blendPose("stand", "ready", 0.6);
    world.updateCord();

    const hero = el.closest(".hero") || el;
    const ptr = K.pointer(hero);
    const camera = stage.camera;
    // Aimed left of and below the platform, so the platform sits in the
    // upper-right third of the screen, clear of the headline
    const look = new THREE.Vector3(-14, 28, 10);
    const start = new THREE.Vector3(14, 96, 205);    // entrance: high and far
    const rest = new THREE.Vector3(2, 52, 80);       // resting shot
    const deeper = new THREE.Vector3(9, 47, 42);     // where scrolling leads
    const pos = new THREE.Vector3(), aim = new THREE.Vector3();
    let intro = K.reducedMotion ? 1 : 0;
    let scroll = 0;

    stage.onFrame = (dt, t) => {
      ptr.update(dt);
      intro = Math.min(1, intro + dt / 3.6);
      const target = K.clamp(window.scrollY / Math.max(1, hero.offsetHeight), 0, 1);
      scroll = K.reducedMotion ? 0 : K.damp(scroll, target, 5, dt);

      pos.lerpVectors(start, rest, K.easeInOut(intro)).lerp(deeper, scroll * 0.8);
      pos.x += ptr.x * 4.5;
      pos.y -= ptr.y * 2.5;
      pos.y += Math.sin(t * 0.25) * 0.5; // slow drift so the shot never feels frozen
      camera.position.copy(pos);
      aim.copy(look);
      aim.x += ptr.x * 1.5;
      camera.lookAt(aim);
      world.tick(dt, t);
    };
    stage.invalidate();
  });
})();
