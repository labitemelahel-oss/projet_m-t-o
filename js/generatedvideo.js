/* =====================================================================
   generatedvideo.js — scènes agricoles 3D animées, créées dans le lecteur.
   ===================================================================== */
'use strict';

const GeneratedVideo = {
  renderer: null,
  scene: null,
  camera: null,
  plants: [],
  clouds: null,
  rain: null,
  diagram: null,
  diagramKind: 'field',
  animators: [],
  canvas: null,
  observer: null,
  frame: 0,
  running: false,
  lastTime: 0,
  elapsed: 0,
  current: null,
  chapterIndex: 0,

  mount: function (stage, video, chapterIndex) {
    this.destroy();
    this.current = video;
    this.chapterIndex = chapterIndex || 0;
    const canvas = document.createElement('canvas');
    canvas.className = 'generated-video__canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Animation 3D générée : ' + video.title);
    stage.prepend(canvas);
    this.canvas = canvas;

    if (!window.THREE) {
      stage.classList.add('generated-video--fallback');
      return;
    }

    try {
      this.createScene(stage, canvas);
      this.setChapter(video, this.chapterIndex);
      this.render();
      this.observer = new ResizeObserver(this.resize.bind(this));
      this.observer.observe(stage);
    } catch (error) {
      stage.classList.add('generated-video--fallback');
      if (this.renderer) this.renderer.dispose();
      this.renderer = null;
      canvas.remove();
      this.canvas = null;
      console.warn('Animation 3D indisponible :', error.message);
    }
  },

  createScene: function (stage, canvas) {
    const T = window.THREE;
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    this.renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(width, height, false);
    this.scene = new T.Scene();
    this.scene.background = new T.Color('#102528');
    this.scene.fog = new T.Fog('#102528', 13, 28);
    this.camera = new T.PerspectiveCamera(34, width / height, 0.1, 80);
    this.camera.position.set(8, 7, 11);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(new T.HemisphereLight('#d5f1e4', '#303522', 2.1));
    const sunLight = new T.DirectionalLight('#fff0bd', 3.2);
    sunLight.position.set(-5, 9, 7);
    this.scene.add(sunLight);

    const ground = new T.Mesh(
      new T.BoxGeometry(18, 0.55, 13),
      new T.MeshStandardMaterial({ color: '#795439', roughness: 1 })
    );
    ground.position.y = -0.38;
    this.scene.add(ground);
    const soil = new T.Mesh(
      new T.PlaneGeometry(17.9, 12.9),
      new T.MeshStandardMaterial({ color: '#536a3e', roughness: 0.95 })
    );
    soil.rotation.x = -Math.PI / 2;
    soil.position.y = -0.095;
    this.scene.add(soil);

    const furrow = new T.MeshStandardMaterial({ color: '#3f5131', roughness: 1 });
    for (let row = 0; row < 6; row++) {
      const line = new T.Mesh(new T.BoxGeometry(15.5, 0.025, 0.22), furrow);
      line.position.set(0, -0.07, -4.9 + row * 1.95);
      this.scene.add(line);
    }

    this.plants = [];
    const stemMaterial = new T.MeshStandardMaterial({ color: '#74a94e', roughness: 0.7 });
    const leafMaterial = new T.MeshStandardMaterial({ color: '#9bcf58', roughness: 0.68 });
    const stemGeometry = new T.CylinderGeometry(0.045, 0.075, 0.9, 7);
    const leafGeometry = new T.SphereGeometry(0.25, 8, 6);
    for (let row = 0; row < 5; row++) {
      for (let column = 0; column < 8; column++) {
        const plant = new T.Group();
        const stem = new T.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.42;
        plant.add(stem);
        for (let leaf = 0; leaf < 3; leaf++) {
          const blade = new T.Mesh(leafGeometry, leafMaterial);
          blade.scale.set(1.5, 0.32, 0.52);
          blade.position.set(leaf % 2 ? 0.2 : -0.2, 0.2 + leaf * 0.18, leaf === 1 ? 0.12 : -0.12);
          blade.rotation.z = leaf % 2 ? -0.28 : 0.28;
          plant.add(blade);
        }
        plant.position.set(-6.2 + column * 1.75, -0.04, -4.1 + row * 2.05);
        this.scene.add(plant);
        this.plants.push(plant);
      }
    }

    const sun = new T.Mesh(
      new T.SphereGeometry(0.72, 20, 16),
      new T.MeshBasicMaterial({ color: '#ffd36e' })
    );
    sun.position.set(-5.6, 5.4, -4.8);
    this.scene.add(sun);
    this.clouds = new T.Group();
    const cloudMaterial = new T.MeshStandardMaterial({ color: '#d9e8da', roughness: 1 });
    [[-2.3, 0, 0], [-1.5, 0.18, 0.1], [-0.8, 0, 0]].forEach(function (part) {
      const puff = new T.Mesh(new T.SphereGeometry(0.68, 12, 10), cloudMaterial);
      puff.position.set(part[0], 4.1 + part[1], part[2]);
      puff.scale.set(1.35, 0.62, 0.72);
      this.clouds.add(puff);
    }, this);
    this.scene.add(this.clouds);

    const rainPositions = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 16;
      rainPositions[i * 3 + 1] = Math.random() * 7;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 11;
    }
    const rainGeometry = new T.BufferGeometry();
    rainGeometry.setAttribute('position', new T.BufferAttribute(rainPositions, 3));
    this.rain = new T.Points(rainGeometry, new T.PointsMaterial({ color: '#a8dff2', size: 0.075, transparent: true, opacity: 0.8 }));
    this.rain.visible = false;
    this.scene.add(this.rain);
  },

  classifyChapter: function (video, chapter) {
    const normalize = function (value) {
      return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };
    const text = normalize([chapter.title, chapter.visual].join(' '));
    const context = normalize([video.title, video.situation].join(' '));
    if (/poisson|etang|tilapia|clarias|oxygene|volaille|poulet|betail|animal|bovin|chevre|lapin/.test(text)) return 'animals';
    if (/journal|programme dans le journal|noter le programme|consigner/.test(text)) return 'journal';
    if (/recolt|moisson|secher correctement|stock|aflatox|warrantage|panier|caisse ventilee/.test(text)) return 'harvest';
    if (/insect|maladie|fong|ravageur|champignon|chenille|puceron|desinfect|traitement preventif|pulver/.test(text)) return 'pest';
    if (/vent|tuteur|brise-vent|brise vent|orage|grele|foudre|serre|toiture|ventil|signes d'un orage/.test(text)) return 'wind';
    if (/froid|fraicheur|gel|givre|temperature basse|sous 15|sous 10/.test(text)) return 'frost';
    if (/froid|fraicheur|gel/.test(context) && /couvrir|proteger|voile/.test(text)) return 'frost';
    if (/ombrage|ombre|soleil|ultravio|chaleur|indice uv|coup de chaleur|couvrir|voile|proteger sa peau/.test(text)) return 'shade';
    if (/semis|semer|graine|germination|repiqu|plantation|poquet|planter|calibrer la semence|ecartement/.test(text)) return 'seed';
    if (/compost|sol vivant|sol qui|terre|zaï|zai|diguette|billon|erosion|paillage|matiere organique|bas-fond|humus/.test(text)) return 'soil';
    if (/rotation|association|succession des cultures|legumineuse|cereale.*tubercule/.test(text)) return 'field';
    if (/pluie|arroser|irrig|eau|drain|submersion|humidite|bassin|ruissellement|dose|goutte|probabilite de pluie/.test(text)) return 'water';
    if (/animal|elevage|volaille|poisson|etang/.test(context)) return 'animals';
    if (/froid|fraicheur|gel/.test(context)) return 'frost';
    if (/secheresse|irrigation/.test(context)) return 'water';
    if (/maladie|fong|ravageur/.test(context)) return 'pest';
    if (/vent|grele|orage/.test(context)) return 'wind';
    if (/chaleur|uv|soleil/.test(context)) return 'shade';
    if (/semis|repiqu/.test(context)) return 'seed';
    if (/eau|pluie/.test(context)) return 'water';
    return 'field';
  },

  addDiagramMesh: function (geometry, color, position, scale, rotation) {
    const T = window.THREE;
    const mesh = new T.Mesh(geometry, new T.MeshStandardMaterial({ color: color, roughness: 0.78 }));
    mesh.position.set(position[0], position[1], position[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    this.diagram.add(mesh);
    return mesh;
  },

  addAnimator: function (object, mode, amplitude, speed) {
    this.animators.push({
      object: object,
      mode: mode,
      amplitude: amplitude || 0.12,
      speed: speed || 1,
      x: object.position.x,
      y: object.position.y,
      z: object.position.z,
      phase: this.animators.length * 1.7
    });
  },

  clearDiagram: function () {
    if (this.diagram && this.scene) {
      this.scene.remove(this.diagram);
      this.diagram.traverse(function (object) {
        if (!object.isMesh) return;
        object.geometry.dispose();
        if (Array.isArray(object.material)) object.material.forEach(function (material) { material.dispose(); });
        else object.material.dispose();
      });
    }
    this.diagram = null;
    this.animators = [];
  },

  buildDiagram: function (kind) {
    const T = window.THREE;
    this.clearDiagram();
    this.diagramKind = kind;
    this.diagram = new T.Group();
    this.diagram.position.set(0, 0.8, 2.2);
    this.diagram.scale.set(1.4, 1.4, 1.4);
    this.scene.add(this.diagram);
    const mesh = this.addDiagramMesh.bind(this);
    const box = function (color, position, scale) {
      return mesh(new T.BoxGeometry(1, 1, 1), color, position, scale);
    };
    const sphere = function (color, position, scale) {
      return mesh(new T.SphereGeometry(0.5, 14, 10), color, position, scale);
    };
    const cylinder = function (color, position, radius, height, rotation) {
      return mesh(new T.CylinderGeometry(radius * 0.72, radius, height, 10), color, position, null, rotation);
    };

    if (kind === 'seed') {
      box('#79543a', [0, 0.18, 0], [3.8, 0.42, 1.35]);
      for (let i = 0; i < 3; i++) {
        const x = -1.25 + i * 1.25;
        sphere('#dfb36d', [x, 0.48, 0], [0.32, 0.19, 0.25]);
        const sprout = cylinder('#6faf4f', [x, 0.82 + i * 0.2, 0], 0.1, 0.7 + i * 0.3);
        this.addAnimator(sprout, 'sway', 0.14, 1.1 + i * 0.2);
        sphere('#9ed15b', [x - 0.16, 1.08 + i * 0.23, 0], [0.36, 0.12, 0.2]);
        sphere('#9ed15b', [x + 0.16, 1.18 + i * 0.27, 0], [0.36, 0.12, 0.2]);
      }
    } else if (kind === 'water') {
      box('#537348', [0, 0.12, 0], [4, 0.25, 1.5]);
      box('#3fafd0', [0, 0.3, 0], [3.2, 0.1, 0.86]);
      const pipe = cylinder('#a8c6bd', [0, 0.72, -0.4], 0.11, 3.3, [0, 0, Math.PI / 2]);
      for (let i = 0; i < 7; i++) {
        const drop = sphere('#7ddcf2', [-1.35 + i * 0.45, 0.65 + (i % 3) * 0.26, 0], [0.12, 0.2, 0.12]);
        this.addAnimator(drop, 'drop', 0.5, 1 + (i % 3) * 0.3);
      }
      for (let i = 0; i < 3; i++) {
        const ripple = mesh(new T.TorusGeometry(0.2 + i * 0.12, 0.025, 6, 20), '#c1f0eb', [-0.7 + i * 0.72, 0.38, 0.12]);
        ripple.rotation.x = -Math.PI / 2;
        this.addAnimator(ripple, 'pulse', 0.16, 1.4);
      }
      this.addAnimator(pipe, 'sway', 0.025, 0.8);
    } else if (kind === 'animals') {
      const chapter = this.current.chapters[this.chapterIndex] || {};
      const fishText = [this.current.title, chapter.title, chapter.visual].join(' ').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const fishScene = /poisson|etang|tilapia|clarias|oxygene/.test(fishText);
      box(fishScene ? '#537348' : '#79543a', [0, 0.08, 0], [4.1, 0.25, 1.65]);
      if (fishScene) {
        box('#42a8bd', [0, 0.28, 0], [3.6, 0.14, 1.25]);
        for (let i = 0; i < 3; i++) {
          const fish = sphere(i === 1 ? '#f0b94e' : '#e3d27a', [-1 + i, 0.62 + (i % 2) * 0.16, (i - 1) * 0.34], [0.65, 0.25, 0.3]);
          const tail = mesh(new T.ConeGeometry(0.22, 0.5, 4), '#d18f4c', [fish.position.x + 0.52, fish.position.y, fish.position.z], null, [0, 0, -Math.PI / 2]);
          sphere('#182a2b', [fish.position.x - 0.2, fish.position.y + 0.08, fish.position.z + 0.24], [0.045, 0.045, 0.045]);
          this.addAnimator(fish, 'swim', 0.32, 0.8 + i * 0.22);
          this.addAnimator(tail, 'sway', 0.3, 1.4);
        }
      } else {
        for (let i = 0; i < 2; i++) {
          const x = i ? 0.9 : -0.9;
          const body = sphere('#f0dfb1', [x, 0.75, 0], [0.78, 0.57, 0.48]);
          sphere('#f5e9ce', [x + 0.45, 1.05, 0], [0.32, 0.36, 0.32]);
          sphere('#db5745', [x + 0.45, 1.39, 0], [0.12, 0.12, 0.12]);
          mesh(new T.ConeGeometry(0.1, 0.3, 5), '#e39b39', [x + 0.73, 1.02, 0.03], null, [0, 0, -Math.PI / 2]);
          cylinder('#bd7a39', [x - 0.1, 0.36, 0], 0.035, 0.45);
          this.addAnimator(body, 'bob', 0.09, 1.3 + i * 0.3);
        }
      }
    } else if (kind === 'harvest') {
      box('#8b6035', [0, 0.28, 0], [2.35, 0.56, 1.15]);
      for (let i = 0; i < 6; i++) {
        const stalk = cylinder('#d6ad54', [-1.35 + i * 0.54, 0.94 + (i % 2) * 0.12, 0], 0.06, 1.35);
        sphere('#e5bf63', [stalk.position.x, 1.67 + (i % 2) * 0.12, 0], [0.18, 0.35, 0.15]);
        this.addAnimator(stalk, 'sway', 0.08, 1.1 + i * 0.1);
      }
      const basket = mesh(new T.CylinderGeometry(0.75, 0.58, 0.72, 14, 1, true), '#d49a53', [0.15, 0.92, 0.36]);
      mesh(new T.TorusGeometry(0.73, 0.055, 8, 20), '#edc27d', [0.15, 1.29, 0.36]);
      this.addAnimator(basket, 'bob', 0.04, 0.8);
    } else if (kind === 'soil') {
      box('#6e4a31', [0, 0.4, 0], [3.55, 1.05, 1.55]);
      box('#a9784b', [0, 0.96, 0], [3.57, 0.14, 1.57]);
      box('#70553a', [0, 0.36, 0.81], [3.1, 0.52, 0.06]);
      box('#8a6948', [0, -0.02, 0.81], [3.1, 0.22, 0.06]);
      for (let i = 0; i < 4; i++) {
        const points = [new T.Vector3(-0.6 + i * 0.4, 1.02, 0.86), new T.Vector3(-0.45 + i * 0.42, 0.6, 0.9), new T.Vector3(-0.2 + i * 0.25, 0.12, 0.92)];
        mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points), 14, 0.035, 5, false), '#dfc394', [0, 0, 0]);
      }
      for (let i = 0; i < 6; i++) {
        const compost = sphere(['#4a3927', '#6a4d2c', '#3c4930'][i % 3], [-1.1 + (i % 3) * 0.8, 1.22 + Math.floor(i / 3) * 0.14, -0.2 + (i % 2) * 0.3], [0.36, 0.22, 0.3]);
        this.addAnimator(compost, 'bob', 0.035, 0.7 + i * 0.08);
      }
    } else if (kind === 'pest') {
      const leaf = sphere('#79ae4b', [0.25, 0.65, 0], [1.85, 0.28, 0.62]);
      leaf.rotation.z = -0.18;
      cylinder('#76a84f', [0.15, 0.7, 0], 0.045, 2.8, [0, 0, Math.PI / 2]);
      for (let i = 0; i < 5; i++) sphere('#9b493e', [-0.75 + i * 0.42, 0.82 + (i % 2) * 0.08, 0.26], [0.11, 0.11, 0.08]);
      const bug = sphere('#252f26', [0.55, 1.3, 0.38], [0.31, 0.2, 0.22]);
      sphere('#46513c', [0.8, 1.34, 0.4], [0.16, 0.15, 0.16]);
      for (let i = 0; i < 6; i++) {
        const leg = cylinder('#323b2f', [0.35 + (i % 3) * 0.16, 1.13 - Math.floor(i / 3) * 0.04, 0.4], 0.025, 0.34, [0, 0, i % 2 ? 0.8 : -0.8]);
        leg.rotation.x = 0.55;
      }
      this.addAnimator(bug, 'crawl', 0.35, 0.7);
    } else if (kind === 'shade') {
      for (let i = 0; i < 4; i++) cylinder('#8d6844', [i % 2 ? 1.45 : -1.45, 1.25, i < 2 ? -0.72 : 0.72], 0.055, 2.55);
      const net = mesh(new T.PlaneGeometry(3.3, 1.85), '#61836a', [0, 2.49, 0], null, [-Math.PI / 2, 0, 0]);
      net.material.transparent = true;
      net.material.opacity = 0.58;
      for (let i = 0; i < 4; i++) {
        const strip = mesh(new T.BoxGeometry(0.035, 0.035, 1.8), '#b7cf89', [-1.2 + i * 0.8, 2.52, 0]);
      }
      this.addAnimator(net, 'sway', 0.035, 0.8);
    } else if (kind === 'wind') {
      for (let row = 0; row < 3; row++) {
        const y = 0.75 + row * 0.52;
        const points = [new T.Vector3(-1.8, y, 0), new T.Vector3(-0.7, y + 0.32, 0.1), new T.Vector3(0.35, y - 0.18, 0), new T.Vector3(1.6, y + 0.16, -0.1)];
        const ribbon = mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points), 28, 0.045, 7, false), ['#a8dff2', '#e1d8ae', '#7dd5bf'][row], [0, 0, 0]);
        this.addAnimator(ribbon, 'sway', 0.18, 1 + row * 0.25);
      }
      for (let i = 0; i < 3; i++) {
        const vane = cylinder('#bd9c61', [-1.25 + i * 1.25, 0.7, 0.2], 0.035, 1.35);
        const arrow = mesh(new T.ConeGeometry(0.13, 0.4, 5), '#efd58e', [-1.25 + i * 1.25 + 0.45, 1.3, 0.2], null, [0, 0, -Math.PI / 2]);
        this.addAnimator(vane, 'sway', 0.1, 1.4);
      }
    } else if (kind === 'frost') {
      box('#667648', [0, 0.08, 0], [3.5, 0.1, 1.35]);
      for (let i = 0; i < 3; i++) {
        const x = -0.9 + i * 0.9;
        cylinder('#70a94e', [x, 0.78, 0], 0.065, 1.05);
        sphere('#8bc85c', [x - 0.16, 1.04, 0], [0.34, 0.1, 0.18]);
        sphere('#8bc85c', [x + 0.16, 0.84, 0], [0.34, 0.1, 0.18]);
      }
      const across = 16, length = 6, vertices = [], indices = [];
      for (let zIndex = 0; zIndex <= length; zIndex++) {
        const z = -0.72 + zIndex * 1.44 / length;
        for (let xIndex = 0; xIndex <= across; xIndex++) {
          const x = -1.65 + xIndex * 3.3 / across;
          const y = 0.16 + 1.15 * Math.sqrt(Math.max(0, 1 - (x / 1.65) ** 2));
          vertices.push(x, y, z);
          if (zIndex < length && xIndex < across) {
            const a = zIndex * (across + 1) + xIndex;
            const b = a + across + 1;
            indices.push(a, a + 1, b, a + 1, b + 1, b);
          }
        }
      }
      const filmGeometry = new T.BufferGeometry();
      filmGeometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
      filmGeometry.setIndex(indices);
      filmGeometry.computeVertexNormals();
      const tunnel = mesh(filmGeometry, '#bce6f0', [0, 0, 0]);
      tunnel.material.transparent = true;
      tunnel.material.opacity = 0.3;
      tunnel.material.side = T.DoubleSide;
      for (let archIndex = 0; archIndex < 3; archIndex++) {
        const z = -0.64 + archIndex * 0.64;
        const points = [];
        for (let i = 0; i <= 12; i++) {
          const x = -1.65 + i * 3.3 / 12;
          points.push(new T.Vector3(x, 0.16 + 1.15 * Math.sqrt(Math.max(0, 1 - (x / 1.65) ** 2)), z));
        }
        const arch = mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points), 32, 0.035, 6, false), '#edf7f5', [0, 0, 0]);
        this.addAnimator(arch, 'sway', 0.012, 0.55 + archIndex * 0.1);
      }
      for (let i = 0; i < 10; i++) {
        const flake = mesh(new T.OctahedronGeometry(0.1), '#effbff', [-1.5 + (i % 5) * 0.72, 1.72 + Math.floor(i / 5) * 0.42, (i % 3) * 0.38]);
        this.addAnimator(flake, 'bob', 0.16, 0.6 + (i % 4) * 0.2);
      }
      this.addAnimator(tunnel, 'sway', 0.018, 0.55);
    } else if (kind === 'journal') {
      box('#79543a', [0, 0.16, 0], [3.5, 0.28, 1.25]);
      box('#b77e47', [0, 1.05, 0], [2.35, 1.65, 0.22]);
      box('#f0e4c5', [0, 1.08, 0.14], [2.04, 1.42, 0.035]);
      for (let row = 0; row < 4; row++) {
        box('#9ba9a1', [0.25, 1.53 - row * 0.3, 0.18], [1.3, 0.035, 0.025]);
        box(row < 2 ? '#5b9b61' : '#d1b56f', [-0.61, 1.53 - row * 0.3, 0.19], [0.16, 0.16, 0.035]);
      }
      const pencil = cylinder('#e0bd56', [1.35, 1.32, 0.2], 0.07, 1.45, [0, 0, -0.62]);
      mesh(new T.ConeGeometry(0.075, 0.2, 6), '#423d30', [1.77, 1.64, 0.2], null, [0, 0, -0.62]);
      this.addAnimator(pencil, 'sway', 0.12, 0.8);
    } else {
      box('#79543a', [0, 0.14, 0], [3.4, 0.3, 1.25]);
      for (let i = 0; i < 5; i++) {
        const x = -1.25 + i * 0.62;
        const stalk = cylinder('#76ab4d', [x, 0.9, 0], 0.08, 1.5);
        sphere('#d6b655', [x, 1.68, 0], [0.19, 0.34, 0.16]);
        sphere('#95c75b', [x - 0.19, 1.02, 0], [0.42, 0.14, 0.2]);
        sphere('#95c75b', [x + 0.2, 0.8, 0], [0.42, 0.14, 0.2]);
        this.addAnimator(stalk, 'sway', 0.08, 1.2 + i * 0.1);
      }
    }
  },

  setChapter: function (video, index) {
    this.current = video;
    this.chapterIndex = index;
    if (!this.renderer) return;
    const chapter = video.chapters[index] || video.chapters[0];
    const progress = video.chapters.length < 2 ? 1 : index / (video.chapters.length - 1);
    this.plants.forEach(function (plant, i) {
      plant.scale.y = 0.48 + progress * 0.72;
      plant.rotation.z = Math.sin(i * 2.1 + index) * 0.035;
    });
    const kind = this.classifyChapter(video, chapter);
    this.buildDiagram(kind);
    this.rain.visible = kind === 'water';
    this.clouds.visible = this.rain.visible || kind === 'shade' || kind === 'wind' || kind === 'frost';
    const sceneTone = kind === 'frost' ? '#243746' : this.rain.visible ? '#142b39' : '#102528';
    this.scene.background.set(sceneTone);
    this.scene.fog.color.set(sceneTone);
    this.canvas.setAttribute('aria-label', 'Animation 3D générée : ' + video.title + ', ' + chapter.title);
    this.render();
  },

  play: function () {
    if (!this.renderer || this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.animate();
  },

  pause: function () {
    this.running = false;
    cancelAnimationFrame(this.frame);
  },

  animate: function () {
    if (!this.running) return;
    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.elapsed += delta;
    this.plants.forEach(function (plant, i) {
      plant.rotation.z = Math.sin(this.elapsed * 1.4 + i * 1.7) * 0.065;
    }, this);
    this.animators.forEach(function (animation) {
      const phase = this.elapsed * animation.speed + animation.phase;
      if (animation.mode === 'sway') animation.object.rotation.z = Math.sin(phase) * animation.amplitude;
      if (animation.mode === 'bob') animation.object.position.y = animation.y + Math.sin(phase) * animation.amplitude;
      if (animation.mode === 'drop') {
        animation.object.position.y -= delta * (1.4 + animation.speed);
        if (animation.object.position.y < 0.25) animation.object.position.y = 1.4 + (animation.phase % 1.1);
      }
      if (animation.mode === 'swim' || animation.mode === 'crawl') {
        animation.object.position.x = animation.x + Math.sin(phase) * animation.amplitude;
      }
      if (animation.mode === 'pulse') {
        const scale = 1 + Math.max(0, Math.sin(phase)) * animation.amplitude;
        animation.object.scale.set(scale, scale, scale);
      }
    }, this);
    this.clouds.position.x = Math.sin(this.elapsed * 0.12) * 0.55;
    if (this.rain.visible) {
      const positions = this.rain.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i) - delta * 3.8;
        if (y < -0.2) y = 6 + Math.random() * 2;
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
    }
    this.render();
    this.frame = requestAnimationFrame(this.animate.bind(this));
  },

  resize: function () {
    if (!this.renderer || !this.canvas) return;
    const width = Math.max(this.canvas.parentElement.clientWidth, 1);
    const height = Math.max(this.canvas.parentElement.clientHeight, 1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.render();
  },

  render: function () {
    if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
  },

  destroy: function () {
    this.pause();
    this.clearDiagram();
    if (this.observer) this.observer.disconnect();
    if (this.renderer) this.renderer.dispose();
    if (this.canvas) this.canvas.remove();
    const stage = el('player-stage');
    if (stage) stage.classList.remove('generated-video--fallback');
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.canvas = null;
    this.observer = null;
    this.plants = [];
    this.clouds = null;
    this.rain = null;
  }
};