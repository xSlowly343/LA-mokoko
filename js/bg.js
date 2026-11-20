// Фон: золотые «искры» на three.js. Лёгкий, ставится на паузу во вкладке в фоне.
import * as THREE from 'three';

export function initBackground(canvas) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false }); }
  catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
  camera.position.z = 300;

  const COUNT = innerWidth < 760 ? 260 : 600;
  const pos = new Float32Array(COUNT * 3);
  const speed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - .5) * 800;
    pos[i * 3 + 1] = (Math.random() - .5) * 600;
    pos[i * 3 + 2] = (Math.random() - .5) * 400;
    speed[i] = .1 + Math.random() * .35;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  // мягкая круглая текстура
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,240,190,1)'); grd.addColorStop(.3, 'rgba(240,200,110,.6)'); grd.addColorStop(1, 'rgba(240,200,110,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const mat = new THREE.PointsMaterial({ size: 5, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .75 });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);

  let mx = 0, my = 0;
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  let t = 0;
  function frame() {
    if (!document.hidden) {
      t += .005;
      const p = geo.attributes.position.array;
      for (let i = 0; i < COUNT; i++) {
        p[i * 3 + 1] += speed[i];
        p[i * 3] += Math.sin(t + i) * .08;
        if (p[i * 3 + 1] > 300) p[i * 3 + 1] = -300;
      }
      geo.attributes.position.needsUpdate = true;
      camera.position.x += (mx * 40 - camera.position.x) * .03;
      camera.position.y += (-my * 30 - camera.position.y) * .03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }
  frame();
}
