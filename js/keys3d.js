// Home, the ABOUT / PROJECTS / OTHER keys as real 3D keys (three.js), drawn on a canvas laid over
// the HTML buttons. The buttons stay where they are, invisible, and still take the clicks, focus and
// screen readers; this only draws them. Each key is a rounded plastic block standing on the deck,
// standing in a well with rounded ends, seen from the front and above, lit from the top right so it casts a soft shadow down to the
// left. The key that is down (aria-pressed) sits low with a red label; a hovered key rises a
// little; the keys move on a spring. Semi-gloss plastic: a light clear coat over a satin body. If WebGL isn't there, the CSS keys stay as they are.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const group = document.querySelector(".keys");
const keys = group ? [...group.querySelectorAll(".key")] : [];

// sizes in CSS px. The camera looks down at the keys at angle A, so a top face TOP deep shows
// TOP·sin A tall and a key standing H high shows H·cos A of its front: the same 32px top and
// 12px front (4px down, 14px hovered) as the CSS keys.
const A = THREE.MathUtils.degToRad(55), SIN = Math.sin(A), COS = Math.cos(A);
const W = 66, TOP = 32 / SIN, R = 3;
const HEIGHT = { up: 12 / COS, hover: 14 / COS, down: 4 / COS };   // above the deck (the well adds its depth)
const PAD = { l: 26, r: 18, t: 14, b: 26 };     // room round the keys for the shadow
const ICONS = ["M2 0v9l8-4.5z", "M0 0v9l6-4.5zM6 0v9l6-4.5z", "M1 6h10v2H1zM6 0l5 5H1z"];

async function init() {
  if (!keys.length) return;
  await document.fonts?.load('500 34px "Geist Mono"').catch(() => {});
  const canvas = document.createElement("canvas");
  canvas.className = "keys-3d";
  canvas.setAttribute("aria-hidden", "true");
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { return; }
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  // light from the top right (screen up is away from the viewer, -z)
  const sun = new THREE.DirectionalLight(0xffffff, 0.95);
  sun.position.set(130, 400, -120);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.radius = 14; sun.shadow.blurSamples = 24; sun.shadow.bias = -0.0005;
  Object.assign(sun.shadow.camera, { left: -200, right: 200, top: 200, bottom: -200, near: 1, far: 800 });
  scene.add(sun, new THREE.AmbientLight(0xffffff, 0.45));

  // the deck: the page itself (only the shadows on it show), with a well cut into it, rounded at
  // both ends, that the keys rise out of. Its inner walls and floor are real; built in layout().
  const WELL = { d: 6, side: 6, front: 5, back: 5, r: 9 };
  const deckMat = new THREE.ShadowMaterial({ opacity: 0.22 });
  const wallMat = [new THREE.MeshBasicMaterial({ visible: false }),
    new THREE.MeshStandardMaterial({ color: 0xd3d6db, roughness: 0.6, envMapIntensity: 0.3, side: THREE.BackSide })];
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xc9cdd2, roughness: 0.7, envMapIntensity: 0.3 });
  const deck = new THREE.Mesh(undefined, deckMat), walls = new THREE.Mesh(undefined, wallMat), floor = new THREE.Mesh(undefined, floorMat);
  [deck, walls, floor].forEach(m => { m.rotation.x = -Math.PI / 2; m.receiveShadow = true; scene.add(m); });
  walls.position.y = -WELL.d; floor.position.y = -WELL.d + 0.01;
  const rounded = (sh, x0, y0, x1, y1, r) => {
    sh.moveTo(x0 + r, y0); sh.lineTo(x1 - r, y0); sh.quadraticCurveTo(x1, y0, x1, y0 + r);
    sh.lineTo(x1, y1 - r); sh.quadraticCurveTo(x1, y1, x1 - r, y1); sh.lineTo(x0 + r, y1);
    sh.quadraticCurveTo(x0, y1, x0, y1 - r); sh.lineTo(x0, y0 + r); sh.quadraticCurveTo(x0, y0, x0 + r, y0);
    return sh;
  };

  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 4000);
  cam.position.set(0, 1500 * SIN, 1500 * COS);
  cam.lookAt(0, 0, 0);

  // the top face: label and icon printed on it (red when the key is down)
  const label = (i, ink) => {
    // printed at the screen's own pixel density and shown without mipmaps, so the label is as sharp
    // as text on the page (a bigger texture scaled down blurs it)
    const S = Math.max(2, Math.ceil(devicePixelRatio || 1)), c = document.createElement("canvas");
    c.width = Math.round((W - 2 * R) * S); c.height = Math.round((TOP - 2 * R) * S);
    const g = c.getContext("2d"); g.scale(S, S);
    const w = W - 2 * R, h = TOP - 2 * R;
    const grad = g.createLinearGradient(w, 0, 0, h);   // brighter towards the top right
    grad.addColorStop(0, "#f8f9fa"); grad.addColorStop(1, "#e3e6ea");
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.fillStyle = ink;
    // the icon (12×9) over the word, as on the CSS keys; the top face is foreshortened by sin A,
    // so the print is drawn that much taller to read the same
    const k = 1 / SIN;
    g.save(); g.translate(w / 2 - 6, h / 2 - 9 * k); g.scale(1, k); g.fill(new Path2D(ICONS[i])); g.restore();
    g.save(); g.translate(w / 2, h / 2 + 7 * k); g.scale(1, k);
    g.font = '500 8.5px "Geist Mono", ui-monospace, monospace';
    if ("letterSpacing" in g) g.letterSpacing = "0.85px";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(keys[i].textContent.trim().toUpperCase(), 0.4, 0);
    g.restore();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;
    return t;
  };

  const clip = [new THREE.Plane(new THREE.Vector3(0, 1, 0), WELL.d)];   // nothing below the well floor
  const body = new THREE.MeshPhysicalMaterial({ color: 0xe4e7eb, roughness: 0.36, clearcoat: 0.65, clearcoatRoughness: 0.22, envMapIntensity: 0.3, clippingPlanes: clip });
  const DEPTH = TOP;
  const geo = new RoundedBoxGeometry(W, 60, DEPTH, 4, R);
  const faceGeo = new THREE.PlaneGeometry(W - 2 * R, TOP - 2 * R);

  const items = keys.map((k, i) => {
    const mesh = new THREE.Mesh(geo, body);
    mesh.castShadow = true;
    const face = new THREE.Mesh(faceGeo, new THREE.MeshPhysicalMaterial({ roughness: 0.36, clearcoat: 0.65, clearcoatRoughness: 0.22, envMapIntensity: 0.3 }));
    face.rotation.x = -Math.PI / 2;
    const tex = { ink: label(i, "#5b6068"), red: label(i, "#d2412f") };
    const g = new THREE.Group(); g.add(mesh, face); scene.add(g);
    return { k, g, mesh, face, tex, h: HEIGHT.up, v: 0, hover: false };
  });

  group.appendChild(canvas);
  group.classList.add("is-3d");

  // place the keys where their buttons are
  let cw = 0, ch = 0;
  const layout = () => {
    const box = group.getBoundingClientRect();
    cw = Math.round(box.width) + PAD.l + PAD.r; ch = Math.round(box.height) + PAD.t + PAD.b;
    renderer.setPixelRatio(Math.min(2.5, devicePixelRatio || 1));
    renderer.setSize(cw, ch, false);
    Object.assign(canvas.style, { left: -PAD.l + "px", top: -PAD.t + "px", width: cw + "px", height: ch + "px" });
    Object.assign(cam, { left: -cw / 2, right: cw / 2, top: ch / 2, bottom: -ch / 2 });
    cam.updateProjectionMatrix();
    // the foot of each key's front sits on its button's bottom edge
    items.forEach(it => {
      const b = it.k.getBoundingClientRect();
      // on whole device pixels, so the keys' edges are crisp
      const px = Math.min(2.5, devicePixelRatio || 1);
      const x = Math.round((b.left + b.width / 2 - box.left + PAD.l - cw / 2) * px) / px;
      const up = ch / 2 - (b.bottom - box.top + PAD.t);   // screen-up of the foot, from the centre
      it.z = -up / SIN;
      it.g.position.set(x, -WELL.d, it.z);
    });
    // the well round the keys (shape y is world -z once laid flat)
    const xs = items.map(it => it.g.position.x), z = items[0].z;
    const x0 = Math.min(...xs) - W / 2 - WELL.side, x1 = Math.max(...xs) + W / 2 + WELL.side;
    const y0 = -(z + WELL.front), y1 = -(z - TOP - WELL.back);
    const hole = () => rounded(new THREE.Shape(), x0, y0, x1, y1, WELL.r);
    const plate = new THREE.Shape(); plate.moveTo(-600, -600); plate.lineTo(600, -600); plate.lineTo(600, 600); plate.lineTo(-600, 600);
    plate.holes.push(rounded(new THREE.Path(), x0, y0, x1, y1, WELL.r));
    [deck, walls, floor].forEach(m => m.geometry?.dispose());
    deck.geometry = new THREE.ShapeGeometry(plate, 24);
    walls.geometry = new THREE.ExtrudeGeometry(hole(), { depth: WELL.d, bevelEnabled: false, curveSegments: 24 });
    floor.geometry = new THREE.ShapeGeometry(hole(), 24);
    draw = true;
  };

  const target = it => it.k.getAttribute("aria-pressed") === "true" || it.k.classList.contains("is-tapping")
    ? HEIGHT.down : it.hover ? HEIGHT.hover : HEIGHT.up;
  const place = it => {
    it.mesh.position.set(0, it.h + WELL.d - 30, -DEPTH / 2);
    it.face.position.set(0, it.h + WELL.d + 0.05, -TOP / 2);
    const down = it.k.getAttribute("aria-pressed") === "true";
    const map = down ? it.tex.red : it.tex.ink;
    if (it.face.material.map !== map) { it.face.material.map = map; it.face.material.needsUpdate = true; }
  };

  const still = matchMedia("(prefers-reduced-motion: reduce)");
  let draw = true, raf = 0, last = 0;
  const frame = now => {
    raf = 0;
    const dt = Math.min(0.033, (now - (last || now)) / 1000); last = now;
    let moving = false;
    items.forEach(it => {
      const t = target(it);
      if (still.matches) { it.h = t; it.v = 0; }
      else {
        // springy: a key pressed down goes fast, a key let up overshoots a little
        const kStiff = t < it.h ? 1400 : 520, damp = t < it.h ? 48 : 22;
        it.v += ((t - it.h) * kStiff - it.v * damp) * dt;
        it.h += it.v * dt;
        if (Math.abs(t - it.h) < 0.02 && Math.abs(it.v) < 0.05) { it.h = t; it.v = 0; } else moving = true;
      }
      place(it);
    });
    renderer.render(scene, cam);
    if (moving) { draw = false; kick(); } else last = 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  items.forEach(it => {
    it.k.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") { it.hover = true; kick(); } });
    it.k.addEventListener("pointerleave", () => { it.hover = false; kick(); });
  });
  new MutationObserver(kick).observe(group, { subtree: true, attributes: true, attributeFilter: ["aria-pressed", "class"] });
  addEventListener("resize", () => { layout(); kick(); });
  document.fonts?.ready.then(() => { layout(); kick(); });
  layout(); kick();
}

init();
