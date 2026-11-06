'use strict';
class BulkColonyRenderer {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x879caa);
    this.scene.fog = new THREE.Fog(0x879caa, 35, 160);
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 240);
    this.camera.position.set(0, 10, 60);
    this.scene.add(new THREE.HemisphereLight(0xd0dbe0, 0x65563f, 2.1));
    const sun = new THREE.DirectionalLight(0xffe3bd, 2.3);
    sun.position.set(-25, 60, 10);
    this.scene.add(sun);
    this.geometries = new Set();
    this.materials = new Set();
    this.textures = new Set();
    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();
    this.inverse = new THREE.Quaternion();
    this.goal = new THREE.Vector3();
    this.models = new Map();
    this.lastEvent = 0;
    this.g = {
      box: this.geo(new THREE.BoxGeometry(1, 1, 1)),
      sphere: this.geo(new THREE.SphereGeometry(1, 10, 8)),
      cone: this.geo(new THREE.ConeGeometry(1, 1, 8)),
      roof: this.geo(new THREE.ConeGeometry(1, 1, 4)),
      cylinder: this.geo(new THREE.CylinderGeometry(1, 1, 1, 10)),
      rock: this.geo(new THREE.IcosahedronGeometry(1, 0)),
      crystal: this.geo(new THREE.OctahedronGeometry(1, 0)),
      plane: this.geo(new THREE.PlaneGeometry(1, 1)),
      circle: this.geo(new THREE.CircleGeometry(1, 32)),
      ring: this.geo(new THREE.RingGeometry(0.84, 1, 40)),
      sector: this.geo(new THREE.CircleGeometry(1, 32, -Math.PI / 2 - 1.4, 2.8)),
    };
    this.m = {
      stone: this.mat(0x7a7d76),
      wood: this.mat(0x68523d),
      dark: this.mat(0x292e31),
      roof: this.mat(0x685442),
      gold: this.mat(0xc3a16b),
      metal: this.mat(0xa4adb0),
      skin: this.mat(0xc9a182),
      flame: this.mat(0xffb05d, 1),
      ore: this.mat(0x9fc8f8, 0.5),
      leaf: this.mat(0x3b5d50),
    };
    this.buildWorld();
    this.hero = this.actor('hero');
    this.scene.add(this.hero.root);
    this.npcs = new Map();
    for (const [id, n] of Object.entries(BulkColony.NPCS)) {
      const m = this.actor(id);
      m.root.position.set(n.x, BulkColony.height(n.x, n.z), n.z);
      m.root.rotation.y = Math.atan2(-n.x, 20 - n.z);
      m.hp.visible = false;
      this.scene.add(m.root);
      this.npcs.set(id, m);
    }
    this.bolts = this.instances(this.g.sphere, this.mat(0xffc075, 1), 6);
    this.sparks = this.instances(this.g.sphere, this.m.flame, 40);
    this.particles = Array.from({ length: 40 }, () => ({ life: 0 }));
    this.cursor = 0;
    this.resize();
  }
  geo(g) {
    this.geometries.add(g);
    return g;
  }
  mat(color, glow = 0) {
    const m = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: glow });
    this.materials.add(m);
    return m;
  }
  basic(color, opacity = 1) {
    const m = new THREE.MeshBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity === 1,
      side: THREE.DoubleSide,
    });
    this.materials.add(m);
    return m;
  }
  mesh(parent, geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    parent.add(m);
    return m;
  }
  box(parent, mat, x, y, z, w, h, d) {
    return this.mesh(parent, this.g.box, mat, x, y, z, w, h, d);
  }
  instances(g, m, n) {
    const o = new THREE.InstancedMesh(g, m, n);
    o.count = 0;
    o.frustumCulled = false;
    o.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(o);
    return o;
  }
  set(o, i, x, y, z, sx, sy, sz, ry = 0, rx = 0) {
    this.dummy.position.set(x, y, z);
    this.dummy.rotation.set(rx, ry, 0);
    this.dummy.scale.set(sx, sy, sz);
    this.dummy.updateMatrix();
    o.setMatrixAt(i, this.dummy.matrix);
  }
  finish(o, n) {
    o.count = n;
    o.instanceMatrix.needsUpdate = true;
    if (o.instanceColor) o.instanceColor.needsUpdate = true;
  }
  label(text) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const p = c.getContext('2d');
    p.fillStyle = '#15211fd9';
    p.fillRect(0, 0, 256, 64);
    p.font = 'bold 25px Georgia';
    p.fillStyle = '#f5d7a3';
    p.textAlign = 'center';
    p.fillText(text, 128, 43, 240);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    this.textures.add(t);
    const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false });
    this.materials.add(m);
    const s = new THREE.Sprite(m);
    s.scale.set(4, 1, 1);
    return s;
  }
  buildWorld() {
    const terrain = this.geo(new THREE.PlaneGeometry(180, 180, 64, 64).rotateX(-Math.PI / 2)),
      v = terrain.attributes.position,
      colors = [];
    for (let i = 0; i < v.count; i++) {
      const x = v.getX(i),
        z = v.getZ(i);
      v.setY(i, BulkColony.height(x, z));
      const path = Math.abs(x) < 4 || BulkColony.camp(x, z),
        c = new THREE.Color(path ? 0x8a8066 : 0x65745a).multiplyScalar(
          0.8 + Math.sin(x * 2 + z * 3) * 0.08,
        );
      colors.push(c.r, c.g, c.b);
    }
    terrain.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    terrain.computeVertexNormals();
    const ground = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.materials.add(ground);
    this.scene.add(new THREE.Mesh(terrain, ground));
    const walls = this.instances(this.g.box, this.m.stone, 90);
    let n = 0;
    for (let x = -30; x <= 30; x += 4)
      if (Math.abs(x) > 3)
        for (const z of [0, 36])
          this.set(walls, n++, x, BulkColony.height(x, z) + 1.6, z, 3.9, 3.2, 1.5);
    for (const x of [-32, 32])
      for (let z = 2; z < 36; z += 4)
        this.set(walls, n++, x, BulkColony.height(x, z) + 1.6, z, 1.5, 3.2, 3.9);
    this.finish(walls, n);
    this.gate = new THREE.Group();
    this.gate.position.set(0, BulkColony.height(0, 36), 36);
    this.scene.add(this.gate);
    for (let x = -3.5; x <= 3.5; x += 0.7)
      this.box(this.gate, this.m.wood, x, 1.8, 0, 0.28, 3.6, 0.3);
    this.box(this.gate, this.m.gold, 0, 1, 0, 7.5, 0.15, 0.35);
    const trunks = this.instances(this.g.cylinder, this.m.wood, BulkColony.TREES.length),
      leaves = this.instances(this.g.cone, this.m.leaf, BulkColony.TREES.length * 3);
    BulkColony.TREES.forEach((t, i) => {
      const y = BulkColony.height(t.x, t.z);
      this.set(trunks, i, t.x, y + t.h * 0.45, t.z, 0.4, t.h * 0.9, 0.4);
      for (let k = 0; k < 3; k++)
        this.set(
          leaves,
          i * 3 + k,
          t.x,
          y + t.h * (0.45 + k * 0.2),
          t.z,
          3 - k * 0.6,
          t.h * 0.65,
          3 - k * 0.6,
        );
    });
    this.finish(trunks, BulkColony.TREES.length);
    this.finish(leaves, BulkColony.TREES.length * 3);
    const huts = this.instances(this.g.box, this.mat(0x82674d), 4),
      roofs = this.instances(this.g.roof, this.m.roof, 4),
      beams = this.instances(this.g.box, this.m.wood, 24),
      windows = this.instances(this.g.box, this.m.flame, 8);
    BulkColony.HUTS.forEach((h, i) => {
      const y = BulkColony.height(h.x, h.z);
      this.set(huts, i, h.x, y + 2, h.z, h.w, 4, h.d);
      this.set(roofs, i, h.x, y + 5.3, h.z, h.w * 0.83, 3, h.d * 0.83, Math.PI / 4);
      for (let j = 0; j < 4; j++) {
        const sx = j % 2 ? 1 : -1,
          sz = j < 2 ? 1 : -1;
        this.set(
          beams,
          i * 6 + j,
          h.x + sx * (h.w / 2 - 0.1),
          y + 2,
          h.z + (sz * h.d) / 2,
          0.25,
          4.3,
          0.3,
        );
      }
      this.set(beams, i * 6 + 4, h.x, y + 3.6, h.z + h.d / 2 + 0.08, h.w, 0.22, 0.25);
      this.set(beams, i * 6 + 5, h.x, y + 1.5, h.z + h.d / 2 + 0.12, 1.8, 3, 0.25);
      for (let j = 0; j < 2; j++)
        this.set(
          windows,
          i * 2 + j,
          h.x + (j ? 1 : -1) * h.w * 0.3,
          y + 2.6,
          h.z + h.d / 2 + 0.04,
          1,
          0.9,
          0.05,
        );
    });
    this.finish(huts, 4);
    this.finish(roofs, 4);
    this.finish(beams, 24);
    this.finish(windows, 8);
    for (const x of [-7, 7]) {
      const y = BulkColony.height(x, 36);
      this.box(this.scene, this.m.stone, x, y + 3.8, 36, 3.7, 7.6, 4);
      this.mesh(this.scene, this.g.roof, this.m.roof, x, y + 8.5, 36, 3.8, 2.8, 4, Math.PI / 4);
    }
    const rocks = this.instances(this.g.rock, this.m.stone, 28);
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12,
        x = Math.sin(a) * 83,
        z = Math.cos(a) * 83;
      this.set(rocks, i, x, BulkColony.height(x, z) + 2, z, 5 + (i % 3), 6 + (i % 4), 5, a);
    }
    this.set(rocks, 24, 65, BulkColony.height(65, -18) + 5, -18, 10, 8, 10);
    this.set(rocks, 25, -9, BulkColony.height(-9, -57) + 2, -57, 2, 5, 2);
    this.set(rocks, 26, 9, BulkColony.height(9, -57) + 2, -57, 2, 5, 2);
    this.set(rocks, 27, 0, BulkColony.height(0, -57) + 6, -57, 11, 1.5, 2);
    this.finish(rocks, 28);
    this.ores = this.instances(this.g.crystal, this.m.ore, 24);
    this.oreBases = this.instances(this.g.rock, this.m.stone, 8);
    BulkColony.ORE.forEach((o, i) =>
      this.set(this.oreBases, i, o.x, BulkColony.height(o.x, o.z) + 0.4, o.z, 1.8, 0.9, 1.5),
    );
    this.finish(this.oreBases, 8);
    this.chest = new THREE.Group();
    this.chest.position.set(
      BulkColony.CHEST.x,
      BulkColony.height(BulkColony.CHEST.x, BulkColony.CHEST.z),
      BulkColony.CHEST.z,
    );
    this.scene.add(this.chest);
    this.box(this.chest, this.m.wood, 0, 0.6, 0, 2.2, 1.2, 1.2);
    for (const x of [-0.8, 0.8]) this.box(this.chest, this.m.gold, x, 0.65, 0, 0.14, 1.3, 1.24);
    this.lid = this.box(this.chest, this.m.gold, 0, 1.3, 0, 2.3, 0.2, 1.3);
    this.mineSeal = this.mesh(
      this.scene,
      this.g.circle,
      this.basic(0xa489d8, 0.55),
      59,
      BulkColony.height(59, -18) + 3,
      -18,
      4,
      4,
      1,
    );
    this.mineSeal.rotation.y = -Math.PI / 2;
    this.fire = new THREE.Group();
    this.fire.position.set(0, BulkColony.height(0, 18), 18);
    this.scene.add(this.fire);
    this.mesh(this.fire, this.g.cylinder, this.m.stone, 0, 0.12, 0, 1.2, 0.24, 1.2);
    for (let i = 0; i < 4; i++) {
      const log = this.box(this.fire, this.m.wood, 0, 0.35, 0, 0.2, 0.2, 1.7);
      log.rotation.y = (i * Math.PI) / 4;
    }
    this.flame = this.mesh(this.fire, this.g.cone, this.m.flame, 0, 0.85, 0, 0.5, 1.4, 0.5);
    const light = new THREE.PointLight(0xffa25e, 30, 16);
    light.position.set(0, this.fire.position.y + 2, 18);
    this.scene.add(light);
    const barrierMat = this.basic(0x8d91e0, 0.1);
    barrierMat.wireframe = true;
    this.barrier = this.mesh(
      this.scene,
      this.geo(new THREE.SphereGeometry(91, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)),
      barrierMat,
      0,
      0,
      0,
    );
    this.goalRing = this.mesh(this.scene, this.g.ring, this.basic(0xf0d191, 0.8), 0, 0, 0, 2, 2, 1);
    this.goalRing.rotation.x = -Math.PI / 2;
    this.arrow = this.mesh(this.scene, this.g.cone, this.m.gold, 0, 0, 0, 0.35, 0.8, 0.35);
    this.arrow.rotation.x = Math.PI;
  }
  batch(body) {
    const groups = new Map();
    for (const o of [...body.children])
      if (o.isMesh) {
        o.updateMatrix();
        const key = o.geometry.uuid + o.material.uuid,
          list = groups.get(key) || [];
        list.push(o);
        groups.set(key, list);
      }
    for (const list of groups.values())
      if (list.length > 1) {
        const b = new THREE.InstancedMesh(list[0].geometry, list[0].material, list.length);
        list.forEach((o, i) => {
          b.setMatrixAt(i, o.matrix);
          body.remove(o);
        });
        body.add(b);
      }
  }
  actor(type) {
    const root = new THREE.Group(),
      body = new THREE.Group(),
      legs = [],
      arms = [];
    root.add(body);
    const human = !['bird', 'wolf'].includes(type),
      boss = type === 'boss',
      hero = type === 'hero';
    const cloth = this.mat(
        hero
          ? 0x82705b
          : BulkColony.NPCS[type]
            ? BulkColony.NPCS[type].color
            : boss
              ? 0x3e474d
              : 0x655657,
      ),
      metal = boss ? this.m.metal : this.m.wood;
    let weapon = null,
      pick = null;
    if (human) {
      this.box(body, cloth, 0, 1.4, 0, 0.85, 0.95, 0.55);
      this.mesh(body, this.g.sphere, this.m.skin, 0, 2.2, 0, 0.33, 0.4, 0.32);
      this.box(body, this.m.dark, 0, 2.24, 0.3, 0.45, 0.06, 0.04);
      this.mesh(body, this.g.sphere, metal, 0, 2.42, -0.02, 0.36, 0.25, 0.35);
      if (type === 'mentor' || type === 'guard')
        this.mesh(body, this.g.cone, cloth, 0, 1.98, 0.24, 0.22, 0.5, 0.22);
      for (const side of [-1, 1]) {
        const leg = new THREE.Group();
        leg.position.set(side * 0.24, 1, 0);
        body.add(leg);
        this.box(leg, this.m.dark, 0, -0.42, 0, 0.3, 0.84, 0.34);
        this.box(leg, this.m.wood, 0, -0.9, 0.1, 0.34, 0.2, 0.5);
        legs.push(leg);
        const arm = new THREE.Group();
        arm.position.set(side * 0.57, 1.8, 0);
        body.add(arm);
        this.box(arm, cloth, 0, -0.3, 0, 0.25, 0.65, 0.3);
        arms.push(arm);
      }
      this.box(body, this.m.gold, 0, 1.15, 0.3, 0.85, 0.12, 0.07);
      if (hero || boss || type === 'warden') {
        weapon = new THREE.Group();
        weapon.position.set(0, -0.65, 0.15);
        arms[1].add(weapon);
        this.box(weapon, this.m.wood, 0, -0.15, 0, 0.13, 0.4, 0.13);
        this.box(weapon, this.m.gold, 0, 0.04, 0, 0.55, 0.1, 0.14);
        this.box(weapon, this.m.metal, 0, 0.85, 0, boss ? 0.6 : 0.14, boss ? 1.2 : 1.5, 0.09);
        pick = this.box(arms[1], this.m.metal, 0, -0.65, 0.25, 1.3, 0.12, 0.15);
        pick.visible = false;
      }
      this.batch(body);
    } else if (type === 'bird') {
      this.mesh(body, this.g.sphere, cloth, 0, 1.2, 0, 0.8, 0.9, 1);
      this.mesh(body, this.g.sphere, cloth, 0, 2.05, 0.55, 0.4, 0.5, 0.42);
      const beak = this.mesh(body, this.g.cone, this.m.gold, 0, 1.95, 1, 0.23, 0.85, 0.22);
      beak.rotation.x = Math.PI / 2;
      for (const side of [-1, 1]) {
        this.mesh(body, this.g.cone, this.m.wood, side * 0.67, 1.35, -0.2, 0.3, 1.3, 0.5);
        this.box(body, this.m.dark, side * 0.26, 2.1, 0.85, 0.08, 0.07, 0.03);
        const l = new THREE.Group();
        l.position.set(side * 0.35, 0.85, 0);
        body.add(l);
        this.box(l, this.m.gold, 0, -0.4, 0, 0.16, 0.8, 0.16);
        legs.push(l);
      }
    } else {
      this.mesh(body, this.g.sphere, this.m.dark, 0, 1, 0, 0.65, 0.65, 1.15);
      this.mesh(body, this.g.sphere, this.m.stone, 0, 1.35, 1, 0.4, 0.4, 0.6);
      for (const side of [-1, 1]) {
        this.mesh(body, this.g.cone, this.m.dark, side * 0.27, 1.83, 1, 0.18, 0.55, 0.17);
        this.box(body, this.m.flame, side * 0.29, 1.43, 1.48, 0.08, 0.08, 0.04);
        for (const z of [-0.7, 0.7]) {
          const l = new THREE.Group();
          l.position.set(side * 0.44, 0.8, z);
          body.add(l);
          this.box(l, this.m.dark, 0, -0.37, 0, 0.18, 0.75, 0.2);
          legs.push(l);
        }
      }
      const tail = this.mesh(body, this.g.cone, this.m.stone, 0, 1.25, -1.35, 0.25, 1, 0.25);
      tail.rotation.x = -1.1;
    }
    const hp = new THREE.Group();
    hp.position.y = human ? 3 : 2.7;
    root.add(hp);
    this.mesh(hp, this.g.plane, this.basic(0x1c2727), 0, 0, 0, 1.6, 0.12, 1);
    const fill = this.mesh(
      hp,
      this.g.plane,
      this.basic(hero ? 0x97c77f : 0xc17569),
      0,
      0,
      0.01,
      1.5,
      0.075,
      1,
    );
    const marker = new THREE.Group();
    this.scene.add(marker);
    const markerMat = this.basic(0xe08c79, 0.32),
      sector = this.mesh(marker, this.g.sector, markerMat, 0, 0.09, 0);
    sector.rotation.x = -Math.PI / 2;
    const circle = this.mesh(marker, this.g.circle, markerMat, 0, 0.09, 0);
    circle.rotation.x = -Math.PI / 2;
    root.scale.setScalar(boss ? 1.55 : 1);
    let label = null;
    if (BulkColony.NPCS[type]) {
      label = this.label(BulkColony.NPCS[type].name.split(' · ')[0]);
      label.position.y = 3.4;
      root.add(label);
    }
    return {
      root,
      body,
      legs,
      arms,
      hp,
      fill,
      marker,
      sector,
      circle,
      markerMat,
      cloth,
      weapon,
      pick,
      type,
      label,
    };
  }
  pose(m, a, game, hero = false) {
    m.root.position.set(
      a.x,
      BulkColony.height(a.x, a.z) +
        (hero && a.roll > 0 ? Math.sin((a.roll / 0.4) * Math.PI) * 0.25 : 0),
      a.z,
    );
    m.root.rotation.y = a.angle;
    const moved = Math.hypot(a.x - (m.lastX ?? a.x), a.z - (m.lastZ ?? a.z));
    m.lastX = a.x;
    m.lastZ = a.z;
    m.walk = (m.walk || 0) + Math.min(0.6, moved) * 3;
    m.legs.forEach(
      (l, i) => (l.rotation.x = moved > 0.001 ? Math.sin(m.walk + i * Math.PI) * 0.6 : 0),
    );
    if (m.arms.length) {
      let swing = 0;
      if (hero && a.action) {
        const k = a.action;
        if (k.kind === 'mine') swing = Math.sin(k.time * 13) * 0.9;
        else
          swing =
            k.time < k.hitAt
              ? -k.time / k.hitAt
              : 1.4 * (1 - (k.time - k.hitAt) / (k.total - k.hitAt));
      } else if (a.state === 'windup') swing = -0.9;
      else if (a.state === 'strike') swing = 1.2;
      m.arms[1].rotation.x = swing;
      m.arms[0].rotation.x = hero && a.blocking ? -1.1 : 0;
      if (m.pick) {
        m.pick.visible = hero && a.action?.kind === 'mine';
        m.weapon.visible = !m.pick.visible;
      }
    }
    if (m.type === 'boss') m.cloth.color.setHex(a.phase === 2 ? 0x995e50 : 0x3e474d);
    if (hero)
      m.cloth.color.setHex(
        game.progress.armor
          ? 0x65766d
          : game.progress.faction === 'mage'
            ? 0x70668b
            : game.progress.faction === 'guard'
              ? 0x96665c
              : 0x82705b,
      );
    m.body.visible = !hero || a.inv <= 0 || Math.sin(game.time * 25) > -0.2;
    const pct = hero ? a.hp / game.maxHp : a.hp / a.maxHp;
    m.fill.scale.x = 1.5 * Math.max(0, pct);
    m.fill.position.x = (pct - 1) * 0.75;
    m.hp.quaternion
      .copy(this.camera.quaternion)
      .premultiply(this.inverse.copy(m.root.quaternion).invert());
    m.marker.visible = !hero && a.hp > 0 && a.state === 'windup';
    if (m.marker.visible) {
      m.marker.position.set(a.x, BulkColony.height(a.x, a.z), a.z);
      m.marker.rotation.y = a.attackAngle;
      m.sector.visible = a.kind !== 'nova';
      m.circle.visible = a.kind === 'nova';
      m.sector.scale.setScalar(a.range + 0.35);
      m.circle.scale.setScalar(a.range + 0.35);
      m.markerMat.opacity = 0.2 + (1 - a.timer / a.windup) * 0.3;
    }
  }
  resize() {
    const c = this.renderer.domElement,
      w = Math.max(1, c.clientWidth),
      h = Math.max(1, c.clientHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1, Math.sqrt(900000 / (w * h))));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  render(game, dt, view = { yaw: 0 }) {
    if (this.lastGame !== game) {
      this.lastGame = game;
      this.lastEvent = 0;
      this.first = true;
      for (const p of this.particles) p.life = 0;
    }
    const p = game.player;
    this.goal.set(
      p.x + Math.sin(view.yaw) * 16,
      BulkColony.height(p.x, p.z) + 10,
      p.z + Math.cos(view.yaw) * 16,
    );
    if (this.first) {
      this.camera.position.copy(this.goal);
      this.first = false;
    } else this.camera.position.lerp(this.goal, 1 - Math.exp(-dt * 8));
    this.camera.lookAt(p.x, BulkColony.height(p.x, p.z) + 1.5, p.z);
    this.pose(this.hero, p, game, true);
    this.hero.marker.visible = false;
    for (const m of this.models.values()) {
      m.root.visible = false;
      m.marker.visible = false;
    }
    for (const e of game.enemies) {
      if (e.hp <= 0) continue;
      let m = this.models.get(e.id);
      if (!m) {
        m = this.actor(e.type);
        this.models.set(e.id, m);
        this.scene.add(m.root);
      }
      m.root.visible = true;
      this.pose(m, e, game);
    }
    for (const [id, m] of this.npcs) {
      const n = BulkColony.NPCS[id];
      m.label.visible = Math.hypot(n.x - p.x, n.z - p.z) < 19;
      m.arms[1].rotation.x = Math.sin(game.time * 2 + id.length) * 0.04;
    }
    this.gate.visible = game.progress.quest === 0;
    this.lid.rotation.x = game.progress.quest >= 3 ? -0.9 : 0;
    this.mineSeal.visible = game.progress.quest < 4;
    this.barrier.material.opacity = game.progress.quest === 5 ? 0.02 : 0.1;
    this.flame.scale.y = 1.4 + Math.sin(game.time * 6) * 0.1;
    let oreCount = 0;
    BulkColony.ORE.forEach((o, i) => {
      if (game.progress.mined[i]) return;
      for (let j = 0; j < 3; j++)
        this.set(
          this.ores,
          oreCount++,
          o.x + Math.sin(j * 2) * 0.55,
          BulkColony.height(o.x, o.z) + 0.9,
          o.z + Math.cos(j * 2) * 0.55,
          0.25,
          0.9,
          0.25,
          j,
        );
    });
    this.finish(this.ores, oreCount);
    const goal = game.objective();
    this.goalRing.position.set(goal.x, BulkColony.height(goal.x, goal.z) + 0.08, goal.z);
    this.arrow.position.set(
      goal.x,
      BulkColony.height(goal.x, goal.z) + 4 + Math.sin(game.time * 2) * 0.2,
      goal.z,
    );
    this.goalRing.visible = this.arrow.visible = game.progress.quest < 5;
    game.bolts.forEach((b, i) =>
      this.set(this.bolts, i, b.x, BulkColony.height(b.x, b.z) + 1.5, b.z, 0.25, 0.25, 0.25),
    );
    this.finish(this.bolts, game.bolts.length);
    for (const e of game.events) {
      if (e.id <= this.lastEvent) continue;
      this.lastEvent = e.id;
      if (['ore', 'enemyHit', 'hurt', 'victory', 'healed', 'spell', 'quest'].includes(e.type))
        for (let i = 0; i < 10; i++) {
          const s = this.particles[this.cursor++ % 40],
            a = (i * Math.PI) / 5;
          s.x = e.x;
          s.z = e.z;
          s.y = BulkColony.height(e.x, e.z) + 1;
          s.vx = Math.sin(a) * 2;
          s.vz = Math.cos(a) * 2;
          s.life = 0.7;
        }
    }
    let count = 0;
    for (const s of this.particles) {
      if (s.life <= 0) continue;
      if (game.state === 'playing') {
        s.life = Math.max(0, s.life - dt);
        s.x += s.vx * dt;
        s.z += s.vz * dt;
        s.y += dt;
      }
      if (s.life > 0) this.set(this.sparks, count++, s.x, s.y, s.z, 0.1, 0.1, 0.1);
    }
    this.finish(this.sparks, count);
    this.renderer.render(this.scene, this.camera);
  }
  destroy() {
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    for (const t of this.textures) t.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.scene.clear();
    this.models.clear();
  }
}
if (typeof window !== 'undefined') window.BulkColonyRenderer = BulkColonyRenderer;
