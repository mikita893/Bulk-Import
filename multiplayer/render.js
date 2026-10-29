/* Procedural multiplayer renderer. All hit detection and movement are authoritative on the server. */
(function () {
  'use strict';
  const ENEMY_COLORS = {
    reaper: 0xec9369,
    collector: 0xd8b956,
    geth: 0x7abaff,
    banshee: 0xde87ed,
    boss: 0xff8266,
    excel: 0x75e8a0,
  };
  const TEAM_COLORS = { salesforce: 0x74e2ee, excel: 0x78e69b };
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  class BulkArenaRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.state = null;
      this.localId = null;
      this.quality = 'auto';
      this.adaptiveRatio = 1;
      this.averageFrameMs = 16.7;
      this.qualityClock = 0;
      this.zoomFactor = 1;
      this.mapKey = '';
      this.frameTime = 0;
      this.players = new Map();
      this.enemies = new Map();
      this.pools = new Map();
      this.materials = new Map();
      this.floorTextures = new Map();
      this.kitTextures = new Map();
      this.staticGeometries = [];
      this.stamp = 0;
      this.contextLost = false;
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        stencil: false,
        alpha: false,
        powerPreference: 'high-performance',
        precision: 'mediump',
      });
      this.renderer.setClearColor(0x06101b);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.shadowMap.enabled = false;
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0x091725, 0.008);
      this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 240);
      this.camera.position.set(0, 29, 29);
      this.camera.lookAt(0, 0, -2);
      this.scene.add(new THREE.HemisphereLight(0xc9edff, 0x263c45, 2.1));
      const sun = new THREE.DirectionalLight(0xe4f7ff, 2.8);
      sun.position.set(-20, 35, 10);
      this.scene.add(sun);
      this.G = {
        box: new THREE.BoxGeometry(1, 1, 1),
        sphere: new THREE.SphereGeometry(1, 10, 8),
        cylinder: new THREE.CylinderGeometry(1, 1, 1, 8),
        cone: new THREE.ConeGeometry(1, 1, 8),
        plane: new THREE.PlaneGeometry(1, 1),
        barrier: new THREE.CylinderGeometry(
          2,
          2,
          2.85,
          18,
          1,
          true,
          -Math.PI / 3,
          (Math.PI * 2) / 3,
        ),
        barrierArc: new THREE.RingGeometry(
          1.94,
          2.03,
          24,
          1,
          (-Math.PI * 5) / 6,
          (Math.PI * 2) / 3,
        ),
        rewindRing: new THREE.RingGeometry(0.91, 1, 28),
      };
      this.sharedGeometry = new Set(Object.values(this.G));
      this.environment = new THREE.Group();
      this.actors = new THREE.Group();
      this.effects = new THREE.Group();
      this.scene.add(this.environment, this.actors, this.effects);
      this.ray = new THREE.Raycaster();
      this.ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      this.pointer = new THREE.Vector2();
      this.aimPoint = new THREE.Vector3();
      this.target = new THREE.Vector3();
      this.instance = new THREE.Object3D();
      this.color = new THREE.Color();
      this.quat = new THREE.Quaternion();
      this.walk = 0;
      this._setupInstances();
      this._setupKitEffects();
      this._setupStars();
      this._setupSupport();
      this._buildArena('demo', 'port', []);
      this.resize();
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        this.contextLost = true;
      });
      canvas.addEventListener('webglcontextrestored', () => {
        this.contextLost = false;
        this.resize();
      });
    }
    material(color, emissive = 0, basic = false) {
      const key = color + ':' + emissive + ':' + basic;
      if (!this.materials.has(key))
        this.materials.set(
          key,
          basic
            ? new THREE.MeshBasicMaterial({ color, toneMapped: false })
            : new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity: 0.7 }),
        );
      return this.materials.get(key);
    }
    mesh(parent, geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
      const obj = new THREE.Mesh(geo, mat);
      obj.position.set(x, y, z);
      obj.scale.set(sx, sy, sz);
      parent.add(obj);
      return obj;
    }
    box(parent, mat, x, y, z, w, h, d) {
      return this.mesh(parent, this.G.box, mat, x, y, z, w, h, d);
    }
    sphere(parent, mat, x, y, z, r) {
      return this.mesh(parent, this.G.sphere, mat, x, y, z, r, r, r);
    }
    cylinder(parent, mat, x, y, z, r, h) {
      return this.mesh(parent, this.G.cylinder, mat, x, y, z, r, h, r);
    }
    _batch(root) {
      root.updateMatrixWorld(true);
      const groups = new Map(),
        inverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
      root.traverse((o) => {
        if (o.isMesh && !Array.isArray(o.material)) {
          let list = groups.get(o.material);
          if (!list) {
            list = [];
            groups.set(o.material, list);
          }
          list.push(o);
        }
      });
      for (const [material, meshes] of groups) {
        if (meshes.length < 2) continue;
        let count = 0,
          indicesCount = 0;
        for (const m of meshes) {
          count += m.geometry.attributes.position.count;
          indicesCount += m.geometry.index
            ? m.geometry.index.count
            : m.geometry.attributes.position.count;
        }
        const positions = new Float32Array(count * 3),
          normals = new Float32Array(count * 3),
          uvs = new Float32Array(count * 2),
          indices = new Uint32Array(indicesCount);
        let offset = 0,
          index = 0;
        for (const m of meshes) {
          const matrix = new THREE.Matrix4().multiplyMatrices(inverse, m.matrixWorld),
            g = m.geometry.clone().applyMatrix4(matrix);
          positions.set(g.attributes.position.array, offset * 3);
          if (g.attributes.normal) normals.set(g.attributes.normal.array, offset * 3);
          if (g.attributes.uv) uvs.set(g.attributes.uv.array, offset * 2);
          if (g.index) {
            for (const n of g.index.array) indices[index++] = offset + n;
          } else {
            for (let n = 0; n < g.attributes.position.count; n++) indices[index++] = offset + n;
          }
          offset += g.attributes.position.count;
          g.dispose();
          m.parent.remove(m);
          if (!this.sharedGeometry.has(m.geometry)) m.geometry.dispose();
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        g.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        g.setIndex(new THREE.BufferAttribute(indices, 1));
        g.computeBoundingSphere();
        const merged = new THREE.Mesh(g, material);
        merged.matrixAutoUpdate = false;
        root.add(merged);
      }
    }
    _setupInstances() {
      const projectileMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        toneMapped: false,
      });
      this.projectileInstances = new THREE.InstancedMesh(this.G.box, projectileMaterial, 220);
      this.projectileInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.projectileInstances.frustumCulled = false;
      this.projectileInstances.count = 0;
      this.effects.add(this.projectileInstances);
      this.pickupInstances = new THREE.InstancedMesh(
        this.G.box,
        new THREE.MeshLambertMaterial({ color: 0xffffff }),
        60,
      );
      this.pickupInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.pickupInstances.frustumCulled = false;
      this.pickupInstances.count = 0;
      this.effects.add(this.pickupInstances);
      this.warningRingGeometry = new THREE.RingGeometry(0.86, 1, 28);
      this.warningFillGeometry = new THREE.CircleGeometry(1, 28);
      this.warningRings = new THREE.InstancedMesh(
        this.warningRingGeometry,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
        24,
      );
      this.warningFills = new THREE.InstancedMesh(
        this.warningFillGeometry,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
        24,
      );
      for (const obj of [this.warningRings, this.warningFills]) {
        obj.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        obj.frustumCulled = false;
        obj.count = 0;
        this.effects.add(obj);
      }
    }
    _kitTexture(key, draw, width = 256, height = 256) {
      if (this.kitTextures.has(key)) return this.kitTextures.get(key);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      draw(canvas.getContext('2d'), width, height);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.kitTextures.set(key, texture);
      return texture;
    }
    _setupKitEffects() {
      const sheet = this._kitTexture(
        'sheet',
        (a, w, h) => {
          a.fillStyle = '#effff1';
          a.fillRect(0, 0, w, h);
          a.fillStyle = '#1f7043';
          a.fillRect(0, 0, w, 35);
          a.font = 'bold 22px Arial';
          a.textAlign = 'center';
          a.textBaseline = 'middle';
          a.fillStyle = '#e8fff1';
          a.fillText('=PIVOT()', w / 2, 18);
          a.strokeStyle = '#559368';
          a.lineWidth = 2;
          for (let x = 0; x <= w; x += w / 4) {
            a.beginPath();
            a.moveTo(x, 35);
            a.lineTo(x, h);
            a.stroke();
          }
          for (let y = 35; y <= h; y += 36) {
            a.beginPath();
            a.moveTo(0, y);
            a.lineTo(w, y);
            a.stroke();
          }
          a.fillStyle = '#28623d';
          a.font = 'bold 22px monospace';
          a.fillText('SUMA: AUĆ', w / 2, 105);
          a.font = '17px monospace';
          a.fillText('#REF!', w / 2, 150);
        },
        256,
        192,
      );
      const pivot = this._kitTexture(
        'pivot',
        (a, w, h) => {
          a.clearRect(0, 0, w, h);
          a.fillStyle = 'rgba(255,255,255,.16)';
          a.fillRect(0, 0, w, h);
          a.strokeStyle = 'rgba(255,255,255,.95)';
          a.lineWidth = 9;
          a.strokeRect(5, 5, w - 10, h - 10);
          a.lineWidth = 3;
          for (let x = 0; x <= w; x += w / 4) {
            a.beginPath();
            a.moveTo(x, 0);
            a.lineTo(x, h);
            a.stroke();
          }
          for (let y = 0; y <= h; y += h / 4) {
            a.beginPath();
            a.moveTo(0, y);
            a.lineTo(w, y);
            a.stroke();
          }
          a.fillStyle = '#ffffff';
          a.font = 'bold 34px monospace';
          a.textAlign = 'center';
          a.fillText('TABELA PRZESTAWNA', w / 2, 67);
          a.font = 'bold 42px monospace';
          a.fillText('SUMA: AUĆ!', w / 2, 147);
          a.font = '26px monospace';
          a.fillText('ZMIEN WIERSZ!', w / 2, 213);
        },
        512,
        256,
      );
      const query = this._kitTexture(
        'query',
        (a, w, h) => {
          a.fillStyle = 'rgba(4,23,33,.88)';
          a.fillRect(0, 0, w, h);
          a.strokeStyle = '#bfffff';
          a.lineWidth = 4;
          a.strokeRect(2, 2, w - 4, h - 4);
          a.fillStyle = '#ffffff';
          a.textAlign = 'center';
          a.textBaseline = 'middle';
          a.font = 'bold 34px monospace';
          a.fillText('SELECT *', w / 2, h / 2);
        },
        320,
        80,
      );
      const rewind = this._kitTexture(
        'rewind',
        (a, w, h) => {
          a.clearRect(0, 0, w, h);
          a.strokeStyle = '#ffffff';
          a.lineWidth = 12;
          a.beginPath();
          a.arc(w / 2, h / 2, 90, -1.3, 3.3);
          a.stroke();
          a.beginPath();
          a.moveTo(39, 105);
          a.lineTo(27, 159);
          a.lineTo(84, 148);
          a.stroke();
          a.fillStyle = '#ffffff';
          a.font = 'bold 49px Arial';
          a.textAlign = 'center';
          a.textBaseline = 'middle';
          a.fillText('Ctrl+Z', w / 2, h / 2);
        },
        256,
        256,
      );
      const barrier = this._kitTexture(
        'barrier',
        (a, w, h) => {
          a.clearRect(0, 0, w, h);
          a.fillStyle = 'rgba(255,255,255,.2)';
          a.fillRect(0, 0, w, h);
          a.strokeStyle = 'rgba(255,255,255,.8)';
          a.lineWidth = 3;
          for (let y = -18; y < h + 20; y += 32)
            for (let x = -18; x < w + 22; x += 38) {
              a.beginPath();
              for (let j = 0; j <= 6; j++) {
                const t = (j * Math.PI) / 3;
                a.lineTo(x + (y % 64 ? 19 : 0) + Math.cos(t) * 21, y + Math.sin(t) * 21);
              }
              a.stroke();
            }
        },
        128,
        128,
      );
      const instance = (geometry, material, count) => {
        const obj = new THREE.InstancedMesh(geometry, material, count);
        obj.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        obj.frustumCulled = false;
        obj.count = 0;
        this.effects.add(obj);
        return obj;
      };
      this.sheetInstances = instance(
        this.G.plane,
        new THREE.MeshBasicMaterial({ map: sheet, side: THREE.DoubleSide, toneMapped: false }),
        220,
      );
      this.queryInstances = instance(
        this.G.plane,
        new THREE.MeshBasicMaterial({
          map: query,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
        24,
      );
      this.pivotInstances = instance(
        this.G.plane,
        new THREE.MeshBasicMaterial({
          map: pivot,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
        36,
      );
      this.apexInstances = instance(
        this.G.box,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          toneMapped: false,
        }),
        36,
      );
      this.pivotSlams = instance(
        this.G.plane,
        new THREE.MeshBasicMaterial({
          map: sheet,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
        36,
      );
      this.rewindInstances = instance(
        this.G.plane,
        new THREE.MeshBasicMaterial({
          map: rewind,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
        24,
      );
      this.barrierTexture = barrier;
      this.rewindTexture = rewind;
    }
    _setupStars() {
      const data = new Float32Array(600 * 3);
      let seed = 90210;
      for (let n = 0; n < 600; n++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const a = (seed / 4294967296) * Math.PI * 2;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const y = 18 + (seed / 4294967296) * 80;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const r = 55 + (seed / 4294967296) * 70;
        data[n * 3] = Math.cos(a) * r;
        data[n * 3 + 1] = y;
        data[n * 3 + 2] = Math.sin(a) * r;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(data, 3));
      const stars = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          color: 0x9bc2d9,
          size: 0.19,
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
        }),
      );
      this.scene.add(stars);
      const planet = this.sphere(this.scene, this.material(0x234b65), -38, 18, -78, 17);
      planet.scale.y = 0.98;
      this.planet = planet;
    }
    _floorTexture(map) {
      if (this.floorTextures.has(map)) return this.floorTextures.get(map);
      const c = document.createElement('canvas');
      c.width = c.height = 512;
      const a = c.getContext('2d'),
        spreadsheet = map === 'spreadsheet',
        hive = map === 'hive',
        archive = map === 'archive';
      a.fillStyle = spreadsheet ? '#123427' : hive ? '#403a24' : archive ? '#302c43' : '#183142';
      a.fillRect(0, 0, 512, 512);
      a.strokeStyle = spreadsheet ? '#2e7952' : hive ? '#75623d' : archive ? '#615777' : '#3b6577';
      a.lineWidth = 2;
      for (let i = 0; i <= 8; i++) {
        const p = i * 64;
        a.beginPath();
        a.moveTo(p, 0);
        a.lineTo(p, 512);
        a.stroke();
        a.beginPath();
        a.moveTo(0, p);
        a.lineTo(512, p);
        a.stroke();
      }
      a.fillStyle = spreadsheet ? '#a2dab7' : '#7799a9';
      a.font = 'bold 21px monospace';
      a.textAlign = 'center';
      if (spreadsheet) {
        for (let i = 0; i < 8; i++) a.fillText(String.fromCharCode(65 + i), i * 64 + 32, 28);
        a.fillText('#REF!', 120, 235);
        a.fillText('=TEAM()', 355, 421);
      } else {
        for (let i = 0; i < 8; i++) a.fillRect(i * 64 + 16, 61, 30, 3);
      }
      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(spreadsheet ? 2 : 5, spreadsheet ? 2 : 4);
      this.floorTextures.set(map, texture);
      return texture;
    }
    _disposeGeometry(root) {
      root.traverse((o) => {
        if (o.isMesh && !this.sharedGeometry.has(o.geometry)) o.geometry.dispose();
      });
    }
    _buildArena(mode, map, obstacles) {
      this._disposeGeometry(this.environment);
      this.environment.clear();
      const accent =
        map === 'spreadsheet'
          ? 0x56d799
          : map === 'hive'
            ? 0xd6b56d
            : map === 'archive'
              ? 0xb39ce5
              : map === 'core'
                ? 0xf58f7f
                : 0x73d9e7;
      const floor = new THREE.MeshLambertMaterial({
        color: 0xc7d7df,
        map: this._floorTexture(map),
      });
      if (this.arenaFloorMaterial) this.arenaFloorMaterial.dispose();
      this.arenaFloorMaterial = floor;
      const dark = this.material(0x132838),
        edge = this.material(0x4b6a7d),
        black = this.material(0x07111b),
        neon = this.material(accent, accent),
        steel = this.material(0x274255),
        gold = this.material(0xb49a62);
      this.box(this.environment, floor, 0, -0.3, 0, 51, 0.55, 43);
      this.box(this.environment, black, 0, -1, 0, 53, 0.8, 45);
      for (const x of [-25.5, 25.5]) {
        this.box(this.environment, dark, x, 0.6, 0, 0.55, 1.3, 44);
        this.box(this.environment, neon, x, 0.68, 0, 0.08, 0.06, 43);
        for (let z = -19; z <= 19; z += 6) {
          this.box(this.environment, steel, x, 1.8, z, 0.75, 3.5, 0.8);
          this.box(this.environment, neon, x, 3.55, z, 0.8, 0.08, 0.9);
        }
      }
      for (const z of [-21.5, 21.5]) {
        this.box(this.environment, dark, 0, z < 0 ? 1 : 0.18, z, 51, z < 0 ? 2 : 0.36, 0.65);
        this.box(this.environment, neon, 0, z < 0 ? 2.04 : 0.4, z, 49, 0.06, 0.08);
      }
      for (const x of [-21, 21]) {
        this.box(this.environment, neon, x, 0.015, 0, 0.05, 0.025, 37);
        for (let z = -18; z <= 18; z += 6) {
          const stripe = this.box(this.environment, gold, x + 1, 0.023, z, 1.1, 0.025, 0.12);
          stripe.rotation.y = 0.5;
        }
      }
      const height = map === 'archive' ? 2.8 : map === 'hive' ? 2.3 : 1.65;
      for (const o of obstacles.slice(0, 32)) {
        this.box(this.environment, dark, o.x, height / 2, o.z, o.w, height, o.d);
        this.box(this.environment, edge, o.x, height + 0.08, o.z, o.w + 0.08, 0.17, o.d + 0.08);
        this.box(this.environment, neon, o.x, height + 0.18, o.z, o.w * 0.75, 0.06, o.d * 0.65);
        this.box(this.environment, steel, o.x, height + 0.23, o.z, o.w * 0.68, 0.035, o.d * 0.57);
      }
      for (const x of [-23, 23])
        for (const z of [-17, 17]) {
          this.box(this.environment, dark, x, 0.75, z, 2, 1.5, 2.7);
          this.box(this.environment, steel, x, 1.6, z, 2.15, 0.15, 2.9);
        }
      if (mode === 'versus') {
        for (const x of [-19, 19]) {
          const teamMat = this.material(
            x < 0 ? TEAM_COLORS.salesforce : TEAM_COLORS.excel,
            x < 0 ? 0x236a7c : 0x2c6f41,
          );
          this.box(this.environment, teamMat, x, 0.02, 0, 5, 0.04, 27);
          for (const z of [-10, 0, 10])
            this.cylinder(this.environment, black, x, 0.06, z, 1.3, 0.12);
        }
        this.box(this.environment, gold, 0, 0.01, 0, 0.1, 0.04, 40);
      }
      if (map === 'archive') {
        for (const x of [-20, 0, 20]) {
          this.cylinder(this.environment, dark, x, 0.3, -17, 1.7, 0.6);
          const artifact = this.mesh(
            this.environment,
            new THREE.OctahedronGeometry(1.1),
            neon,
            x,
            2,
            -17,
          );
          artifact.rotation.z = 0.4;
        }
      }
      if (map === 'hive') {
        for (const x of [-22, 22])
          for (const z of [-12, 12]) {
            const pod = this.sphere(this.environment, this.material(0x746746), x, 1.7, z, 1);
            pod.scale.y = 1.7;
            this.cylinder(this.environment, gold, x, 0.2, z, 1.2, 0.4);
          }
      }
      if (map === 'network') {
        for (const x of [-23, 23])
          for (const z of [-13, -5, 3, 11]) {
            this.box(this.environment, dark, x, 1.9, z, 1.4, 3.8, 1.7);
            for (let y = 0; y < 4; y++)
              this.box(this.environment, neon, x, 1 + y * 0.55, z + 0.86, 0.8, 0.09, 0.03);
          }
      }
      if (map === 'core' || map === 'spreadsheet') {
        for (const x of [-20, 20]) {
          this.cylinder(this.environment, dark, x, 0.2, -17, 2, 0.4);
          this.cylinder(this.environment, steel, x, 2.2, -17, 0.7, 4);
          this.sphere(this.environment, neon, x, 4.5, -17, 0.38);
        }
      }
      this._batch(this.environment);
    }
    _label(text, color, width = 4.3) {
      const c = document.createElement('canvas');
      c.width = 640;
      c.height = 96;
      const a = c.getContext('2d');
      a.fillStyle = 'rgba(4,13,23,.76)';
      a.fillRect(0, 7, 640, 82);
      a.fillStyle = color;
      a.font = 'bold 34px Arial';
      a.textAlign = 'center';
      a.textBaseline = 'middle';
      a.fillText(String(text).slice(0, 38), 320, 49, 610);
      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(width, 0.65, 1);
      return sprite;
    }
    _replaceLabel(model, text, color) {
      const key = text + '|' + color;
      if (model.labelKey === key) return;
      model.labelKey = key;
      if (model.label) {
        model.root.remove(model.label);
        model.label.material.map.dispose();
        model.label.material.dispose();
      }
      model.label = this._label(
        text,
        color,
        model.type === 'excelBoss' || model.type === 'boss' ? 7.5 : 4.3,
      );
      model.label.position.set(0, model.labelY, 0);
      model.root.add(model.label);
    }
    _makeHumanoid(type, color) {
      const root = new THREE.Group(),
        body = new THREE.Group();
      root.add(body);
      const armor = this.material(color),
        dark = this.material(0x102332),
        trim = this.material(0xa6bfc9),
        skin = this.material(type === 'helper' ? 0xbd967a : 0xc1aa8d),
        lit = this.material(0x8cf2eb, 0x25959b);
      this.box(body, armor, 0, 1.7, 0, 0.98, 1.05, 0.55);
      this.box(body, dark, 0, 1.74, 0.32, 0.63, 0.48, 0.12);
      this.box(body, lit, 0, 1.97, 0.39, 0.48, 0.07, 0.03);
      this.box(body, trim, -0.5, 2.03, 0, 0.38, 0.37, 0.64);
      this.box(body, trim, 0.5, 2.03, 0, 0.38, 0.37, 0.64);
      this.sphere(body, skin, 0, 2.66, 0, 0.34);
      if (type !== 'helper') {
        this.box(body, dark, 0, 2.72, 0.26, 0.57, 0.28, 0.24);
        this.box(body, lit, 0, 2.74, 0.395, 0.44, 0.06, 0.03);
        this.box(body, armor, 0, 2.95, -0.02, 0.48, 0.13, 0.42);
      } else {
        this.sphere(body, this.material(0x40372f), 0, 2.5, 0.2, 0.25);
        this.sphere(body, this.material(0x5a5249), 0, 2.89, -0.07, 0.3);
      }
      const legs = [];
      for (const s of [-1, 1]) {
        const leg = new THREE.Group();
        leg.position.set(s * 0.27, 1.1, 0);
        this.box(leg, dark, 0, -0.37, 0, 0.37, 0.82, 0.43);
        this.box(leg, armor, 0, -0.84, 0.16, 0.44, 0.23, 0.74);
        root.add(leg);
        legs.push(leg);
        this.box(body, armor, s * 0.68, 1.69, 0.19, 0.3, 0.74, 0.36);
      }
      this.box(body, dark, 0.5, 1.55, 0.8, 0.24, 0.25, 1.02);
      this.box(body, lit, 0.5, 1.57, 1.33, 0.18, 0.11, 0.055);
      this._batch(body);
      return { root, body, legs, height: 3.5, labelY: 3.9 };
    }
    _makeWorkbook(boss = false) {
      const root = new THREE.Group(),
        body = new THREE.Group();
      root.add(body);
      const green = this.material(boss ? 0x256e44 : 0x286d49),
        dark = this.material(0x0b271e),
        paper = this.material(0xd0e8d5),
        lit = this.material(0x97efb6, 0x2b7751),
        metal = this.material(0x456a57);
      this.box(body, dark, 0, 1.83, 0, 1.85, 2.2, 0.78);
      this.box(body, paper, 0.15, 1.83, 0.16, 1.56, 1.96, 0.56);
      this.box(body, green, -0.56, 1.83, 0.48, 0.9, 2.2, 0.18);
      for (const a of [-0.57, 0.57]) {
        const bar = this.box(body, lit, -0.56, 1.88, 0.59, 0.09, 0.69, 0.025);
        bar.rotation.z = a;
      }
      for (let i = 0; i < 4; i++) {
        this.box(body, metal, 0.44, 1.06 + i * 0.42, 0.47, 0.9, 0.025, 0.035);
        this.box(body, metal, 0.14 + i * 0.27, 1.85, 0.475, 0.025, 1.55, 0.025);
      }
      this.box(body, this.material(0xe77b6d, 0x4d1917), 0.22, 2.19, 0.49, 0.16, 0.09, 0.04);
      this.box(body, this.material(0xe77b6d, 0x4d1917), 0.7, 2.19, 0.49, 0.16, 0.09, 0.04);
      const legs = [];
      for (const s of [-1, 1]) {
        const leg = new THREE.Group();
        leg.position.set(s * 0.47, 0.9, 0);
        this.box(leg, dark, 0, -0.35, 0, 0.36, 0.8, 0.4);
        this.box(leg, green, 0, -0.74, 0.2, 0.55, 0.18, 0.75);
        root.add(leg);
        legs.push(leg);
        this.box(body, metal, s * 1.04, 1.85, 0.12, 0.33, 0.67, 0.4);
        this.box(body, dark, s * 1.05, 1.42, 0.65, 0.35, 0.3, 0.72);
        this.box(body, lit, s * 1.05, 1.43, 1.04, 0.2, 0.08, 0.03);
      }
      this._batch(body);
      if (boss) {
        body.scale.setScalar(1.8);
        for (const leg of legs) {
          leg.position.multiplyScalar(1.8);
          leg.scale.setScalar(1.8);
        }
      }
      return { root, body, legs, height: boss ? 6.3 : 3.5, labelY: boss ? 6.8 : 3.9 };
    }
    _makeEnemy(type) {
      if (type === 'excel') return this._makeWorkbook(true);
      const root = new THREE.Group(),
        body = new THREE.Group();
      root.add(body);
      const color = ENEMY_COLORS[type] || 0xef836d,
        armor = this.material(
          type === 'geth'
            ? 0x4b6474
            : type === 'collector'
              ? 0x847142
              : type === 'banshee'
                ? 0x584263
                : 0x58434b,
        ),
        dark = this.material(0x192630),
        lit = this.material(color, color);
      if (type === 'geth') {
        this.box(body, armor, 0, 1.9, 0, 1.1, 1.45, 0.65);
        this.sphere(body, armor, 0, 2.85, 0, 0.4);
        this.sphere(body, lit, 0.11, 2.91, 0.36, 0.14);
        this.box(body, dark, 0.68, 1.6, 0.7, 0.3, 0.33, 1);
        for (const s of [-1, 1]) {
          this.box(body, dark, s * 0.35, 0.57, 0, 0.38, 1.2, 0.48);
          this.box(body, lit, s * 0.58, 2.16, 0.35, 0.15, 0.49, 0.06);
        }
      } else if (type === 'collector') {
        this.mesh(body, this.G.sphere, armor, 0, 1.65, 0, 0.61, 1.1, 0.4);
        this.sphere(body, armor, 0, 2.9, 0.16, 0.38);
        for (const s of [-1, 1]) {
          const wing = this.mesh(
            body,
            this.G.sphere,
            this.material(0xc7ad63),
            s * 0.72,
            1.8,
            -0.12,
            0.4,
            0.99,
            0.12,
          );
          wing.rotation.z = -s * 0.4;
          this.box(body, dark, s * 0.5, 0.56, 0.2, 0.22, 1.12, 0.28);
          this.sphere(body, lit, s * 0.15, 2.94, 0.47, 0.1);
        }
      } else if (type === 'banshee') {
        this.mesh(body, this.G.cone, armor, 0, 1.65, 0, 0.75, 2.9, 0.65);
        this.sphere(body, armor, 0, 3.25, 0, 0.34);
        for (const s of [-1, 1]) {
          const arm = this.box(body, armor, s * 0.63, 2.15, 0.13, 0.19, 1.8, 0.26);
          arm.rotation.z = -s * 0.27;
          this.box(body, lit, s * 0.14, 3.28, 0.3, 0.08, 0.08, 0.04);
        }
        this.box(body, lit, 0, 2.2, 0.51, 0.16, 1.35, 0.05);
      } else {
        this.mesh(body, this.G.sphere, armor, 0, 1.8, 0, 0.7, 1.16, 0.46);
        this.mesh(body, this.G.cone, armor, 0, 2.95, 0, 0.5, 0.7, 0.42);
        for (const s of [-1, 1]) {
          const arm = this.box(body, armor, s * 0.88, 1.55, 0.13, 0.24, 2.05, 0.31);
          arm.rotation.z = -s * 0.34;
          this.box(body, dark, s * 0.43, 0.45, 0.18, 0.26, 0.85, 0.38);
          this.box(body, lit, s * 0.45, 1.65, 0.45, 0.12, 0.83, 0.07);
        }
        this.sphere(body, lit, 0, 2.89, 0.37, 0.16);
      }
      this._batch(body);
      if (type === 'boss') body.scale.setScalar(1.9);
      return {
        root,
        body,
        legs: [],
        height: type === 'boss' ? 6.8 : type === 'banshee' ? 4.15 : 3.6,
        labelY: type === 'boss' ? 7.2 : type === 'banshee' ? 4.5 : 4,
      };
    }
    _makeModel(type, player = false) {
      const source = player
        ? type === 'excelPlayer'
          ? this._makeWorkbook(false)
          : this._makeHumanoid('human', 0x608e9e)
        : this._makeEnemy(type === 'excelBoss' ? 'excel' : type);
      const root = source.root,
        bar = new THREE.Group();
      bar.position.set(0, source.height, 0);
      root.add(bar);
      const bg = this.material(0x06121b, 0, true),
        hp = this.material(
          player ? (type === 'excelPlayer' ? TEAM_COLORS.excel : TEAM_COLORS.salesforce) : 0xff9c8e,
          0,
          true,
        ),
        shield = this.material(0x79b3ff, 0, true);
      this.box(bar, bg, 0, 0, 0, 1.9, 0.14, 0.025);
      const hpFill = this.box(bar, hp, 0, 0, 0.025, 1.8, 0.07, 0.025);
      const shieldBack = this.box(bar, bg, 0, 0.2, 0, 1.9, 0.1, 0.025),
        shieldFill = this.box(bar, shield, 0, 0.2, 0.025, 1.8, 0.055, 0.025);
      const revive = this.box(
        bar,
        this.material(0xffd185, 0, true),
        0,
        -0.2,
        0.025,
        0,
        0.055,
        0.025,
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xd7c38c,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        toneMapped: false,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.83, 0.94, 24), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04;
      root.add(ring);
      ring.visible = false;
      const model = {
        ...source,
        type,
        player,
        bar,
        hpFill,
        shieldFill,
        shieldBack,
        revive,
        ring,
        ringMat,
        label: null,
        labelKey: '',
        data: null,
        x: 0,
        z: 0,
        stamp: 0,
        lastX: 0,
        lastZ: 0,
      };
      if (type === 'excelBoss') {
        const material = new THREE.MeshBasicMaterial({
          color: 0x72ffbc,
          transparent: true,
          opacity: 0.15,
          depthWrite: false,
          wireframe: false,
          toneMapped: false,
        });
        const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), material);
        shell.scale.set(2.55, 3, 2.2);
        shell.position.set(0, 3, 0);
        root.add(shell);
        model.shell = shell;
        model.shellMaterial = material;
        const label = this._label('NIETYKALNY / WEZWIJ MARCA', '#a0ffd2', 6.7);
        label.position.set(0, 7.5, 0);
        root.add(label);
        model.shieldLabel = label;
      }
      if (player) this._setupPlayerKit(model);
      return model;
    }
    _setupPlayerKit(model) {
      const root = model.root,
        barrier = new THREE.Group(),
        rewind = new THREE.Group(),
        trail = new THREE.Group();
      root.add(barrier, rewind, trail);
      const barrierMaterial = new THREE.MeshBasicMaterial({
        map: this.barrierTexture,
        color: 0x78e9ff,
        transparent: true,
        opacity: 0.36,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      this.mesh(barrier, this.G.barrier, barrierMaterial, 0, 1.48, 0);
      const lip = this.mesh(
        barrier,
        this.G.barrierArc,
        this.material(0x9bf3ff, 0, true),
        0,
        0.065,
        0,
      );
      lip.rotation.x = -Math.PI / 2;
      const top = this.mesh(
        barrier,
        this.G.barrierArc,
        this.material(0x9bf3ff, 0, true),
        0,
        2.9,
        0,
      );
      top.rotation.x = -Math.PI / 2;
      for (const s of [-1, 1])
        this.box(
          barrier,
          this.material(0x9bf3ff, 0, true),
          s * Math.sin(Math.PI / 3) * 2,
          1.48,
          Math.cos(Math.PI / 3) * 2,
          0.07,
          2.85,
          0.07,
        );
      const rewindMaterial = new THREE.MeshBasicMaterial({
        color: 0x9dffb3,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      for (let n = 0; n < 3; n++) {
        const ring = this.mesh(
          rewind,
          this.G.rewindRing,
          rewindMaterial,
          0,
          0.12 + n * 0.38,
          0,
          1.1 + n * 0.24,
          1.1 + n * 0.24,
          1,
        );
        ring.rotation.x = -Math.PI / 2;
      }
      const rewindGlyphMaterial = new THREE.MeshBasicMaterial({
        map: this.rewindTexture,
        color: 0xbaffc7,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const glyph = this.mesh(rewind, this.G.plane, rewindGlyphMaterial, 0, 2.2, 0, 2.5, 2.5, 1);
      const excel = model.type === 'excelPlayer',
        dashMaterial = new THREE.MeshBasicMaterial({
          color: excel ? 0x77f59c : 0x78eaff,
          transparent: true,
          opacity: 0.6,
          depthWrite: false,
          toneMapped: false,
        });
      if (excel) {
        for (let n = 0; n < 3; n++) {
          this.box(trail, dashMaterial, 0, 0.08, -0.5 - n * 0.85, 0.8, 0.055, 0.72);
          this.box(
            trail,
            this.material(0xc0ffd3, 0, true),
            0,
            0.12,
            -0.5 - n * 0.85,
            0.04,
            0.02,
            0.68,
          );
        }
      } else
        for (let n = 0; n < 3; n++)
          this.box(trail, dashMaterial, 0, 0.12, -0.6 - n * 1.35, 0.5 - n * 0.1, 0.06, 1.65);
      barrier.visible = rewind.visible = trail.visible = false;
      model.kit = {
        barrier,
        barrierMaterial,
        rewind,
        rewindMaterial,
        rewindGlyphMaterial,
        glyph,
        trail,
        dashMaterial,
        dashFade: 0,
      };
    }
    _acquire(type, player) {
      const pool = this.pools.get(type);
      const model = pool && pool.length ? pool.pop() : this._makeModel(type, player);
      model.root.visible = true;
      model.body.rotation.set(0, 0, 0);
      if (model.kit) {
        model.kit.dashFade = 0;
        model.kit.barrier.visible = model.kit.rewind.visible = model.kit.trail.visible = false;
      }
      this.actors.add(model.root);
      return model;
    }
    _destroyModel(model) {
      this._disposeGeometry(model.root);
      if (model.label) {
        model.label.material.map.dispose();
        model.label.material.dispose();
      }
      if (model.shieldLabel) {
        model.shieldLabel.material.map.dispose();
        model.shieldLabel.material.dispose();
      }
      model.ringMat.dispose();
      if (model.shellMaterial) model.shellMaterial.dispose();
      if (model.kit)
        for (const key of [
          'barrierMaterial',
          'rewindMaterial',
          'rewindGlyphMaterial',
          'dashMaterial',
        ])
          model.kit[key].dispose();
    }
    _retire(model) {
      this.actors.remove(model.root);
      model.data = null;
      let pool = this.pools.get(model.type);
      if (!pool) {
        pool = [];
        this.pools.set(model.type, pool);
      }
      if (pool.length < (model.player ? 6 : 8)) pool.push(model);
      else this._destroyModel(model);
    }
    _syncEntities(list, table, player) {
      const stamp = this.stamp;
      for (const data of list) {
        if (!data || typeof data.id !== 'string') continue;
        let model = table.get(data.id);
        const type = player
          ? data.team === 'excel'
            ? 'excelPlayer'
            : 'humanPlayer'
          : data.type === 'excel'
            ? 'excelBoss'
            : data.type;
        if (model && model.type !== type) {
          this._retire(model);
          table.delete(data.id);
          model = null;
        }
        if (!model) {
          model = this._acquire(type, player);
          model.x = model.lastX = Number(data.x) || 0;
          model.z = model.lastZ = Number(data.z) || 0;
          model.root.position.set(model.x, 0, model.z);
          table.set(data.id, model);
        }
        if (player && model.data && model.data.alive === false && data.alive) {
          model.x = Number(data.x) || 0;
          model.z = Number(data.z) || 0;
        }
        model.data = data;
        model.stamp = stamp;
        if (player)
          this._replaceLabel(
            model,
            data.name + (data.connected === false ? ' · offline' : ''),
            data.id === this.localId ? '#d9fff1' : data.team === 'excel' ? '#b0edb6' : '#abecf2',
          );
        else if (type === 'excelBoss' || type === 'boss')
          this._replaceLabel(
            model,
            type === 'excelBoss' ? 'EXCEL ONLINE / DUPLICATE_VALUE' : 'ZWIASTUN / MERGE CONFLICT',
            type === 'excelBoss' ? '#b6f7c9' : '#ffc59d',
          );
      }
      for (const [id, model] of table)
        if (model.stamp !== stamp) {
          this._retire(model);
          table.delete(id);
        }
    }
    setState(state, localId) {
      if (!state || !Array.isArray(state.players)) return;
      this.localId = localId || this.localId;
      this.state = state;
      this.stamp++;
      const key = String(state.mode) + ':' + String(state.map);
      if (key !== this.mapKey) {
        this.mapKey = key;
        this._buildArena(
          state.mode,
          state.map || 'port',
          Array.isArray(state.obstacles) ? state.obstacles : [],
        );
      }
      this._syncEntities(state.players.slice(0, 6), this.players, true);
      this._syncEntities((state.enemies || []).slice(0, 24), this.enemies, false);
    }
    _setupSupport() {
      const model = this._makeHumanoid('helper', 0x3b84a2);
      const root = model.root;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.7, 1.9, 28),
        new THREE.MeshBasicMaterial({
          color: 0x77dfff,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04;
      root.add(ring);
      const label = this._label('MARC BENIOFF / E', '#a8ebff', 5.8);
      label.position.set(0, 4, 0);
      root.add(label);
      this.actors.add(root);
      root.visible = false;
      this.supportModel = { ...model, ring, label };
    }
    _syncEffects(time) {
      const state = this.state;
      let n = 0,
        sheets = 0,
        queries = 0;
      for (const b of (state && state.projectiles) || []) {
        if (n + sheets >= 220) break;
        const table = b.kind === 'table' || (b.team === 'excel' && b.kind !== 'apex'),
          apex = b.kind === 'apex' || b.type === 'apex';
        this.instance.position.set(b.x, 1.45, b.z);
        if (table) {
          this.instance.quaternion.copy(this.camera.quaternion);
          this.instance.rotateZ(Math.sin(time * 6 + b.x * 0.23) * 0.35);
          this.instance.scale.set(0.87, 0.64, 1);
          this.instance.updateMatrix();
          this.sheetInstances.setMatrixAt(sheets++, this.instance.matrix);
          continue;
        }
        this.instance.rotation.set(0, Math.atan2(b.vx, b.vz), 0);
        const hostile = b.team === 'enemy';
        this.instance.scale.set(
          apex ? 0.3 : b.duplicate ? 0.24 : hostile ? 0.19 : 0.09,
          apex ? 0.22 : b.duplicate ? 0.2 : hostile ? 0.17 : 0.09,
          apex ? 1.9 : b.duplicate ? 0.7 : hostile ? 0.6 : 0.95,
        );
        this.instance.updateMatrix();
        this.projectileInstances.setMatrixAt(n, this.instance.matrix);
        this.color.setHex(
          apex
            ? 0xa4ffff
            : b.duplicate
              ? 0xff7ab8
              : hostile
                ? ENEMY_COLORS[b.type] || 0xff9b7e
                : TEAM_COLORS[b.team] || 0xb6fff1,
        );
        this.projectileInstances.setColorAt(n++, this.color);
        if (apex && queries < 24) {
          this.instance.position.set(b.x, 1.95, b.z);
          this.instance.quaternion.copy(this.camera.quaternion);
          this.instance.scale.set(1.75, 0.43, 1);
          this.instance.updateMatrix();
          this.queryInstances.setMatrixAt(queries++, this.instance.matrix);
        }
      }
      this.projectileInstances.count = n;
      this.projectileInstances.instanceMatrix.needsUpdate = true;
      if (this.projectileInstances.instanceColor)
        this.projectileInstances.instanceColor.needsUpdate = true;
      this.sheetInstances.count = sheets;
      this.sheetInstances.instanceMatrix.needsUpdate = true;
      this.queryInstances.count = queries;
      n = 0;
      for (const p of (state && state.pickups) || []) {
        if (!p.ready || n >= 57) continue;
        for (let part = 0; part < 3; part++) {
          this.instance.position.set(p.x, 0.32 + (part ? 0.22 : 0), p.z);
          this.instance.rotation.set(0, 0, 0);
          this.instance.scale.set(
            part === 0 ? 1.05 : part === 1 ? 0.65 : 0.15,
            part === 0 ? 0.38 : 0.055,
            part === 0 ? 0.8 : part === 1 ? 0.15 : 0.65,
          );
          this.instance.updateMatrix();
          this.pickupInstances.setMatrixAt(n, this.instance.matrix);
          this.color.setHex(part ? 0x7effc3 : 0xb8cfd0);
          this.pickupInstances.setColorAt(n++, this.color);
        }
      }
      this.pickupInstances.count = n;
      this.pickupInstances.instanceMatrix.needsUpdate = true;
      if (this.pickupInstances.instanceColor) this.pickupInstances.instanceColor.needsUpdate = true;
      n = 0;
      for (const w of (state && state.warnings) || []) {
        if (n >= 24) break;
        this.instance.position.set(w.x, 0.055, w.z);
        this.instance.rotation.set(-Math.PI / 2, 0, 0);
        this.instance.scale.set(w.r, w.r, 1);
        this.instance.updateMatrix();
        this.warningRings.setMatrixAt(n, this.instance.matrix);
        this.warningFills.setMatrixAt(n, this.instance.matrix);
        this.color.setHex(
          w.kind === 'nova'
            ? 0xffcb76
            : w.kind && w.kind.includes('Duplicate')
              ? 0xff77aa
              : 0xff737b,
        );
        this.color.multiplyScalar(0.75 + Math.sin(time * 13) * 0.2);
        this.warningRings.setColorAt(n, this.color);
        this.warningFills.setColorAt(n, this.color);
        n++;
      }
      for (const obj of [this.warningRings, this.warningFills]) {
        obj.count = n;
        obj.instanceMatrix.needsUpdate = true;
        if (obj.instanceColor) obj.instanceColor.needsUpdate = true;
      }
      this._syncKitEffects(time);
      const support = state && state.support,
        helper = this.supportModel;
      helper.root.visible = !!(support && support.active);
      if (helper.root.visible) {
        helper.root.position.set(support.x, 0.15 + Math.sin(time * 2) * 0.04, support.z);
        helper.ring.rotation.z = time * 0.5;
        const me = this.players.get(this.localId);
        if (me) helper.body.rotation.y = Math.atan2(me.x - support.x, me.z - support.z);
      }
    }
    _effectRayLength(x, z, angle, maxRange) {
      const dx = Math.sin(angle),
        dz = Math.cos(angle);
      let range = maxRange;
      if (dx > 1e-7) range = Math.min(range, (25 - x) / dx);
      else if (dx < -1e-7) range = Math.min(range, (-25 - x) / dx);
      if (dz > 1e-7) range = Math.min(range, (21 - z) / dz);
      else if (dz < -1e-7) range = Math.min(range, (-21 - z) / dz);
      for (const o of (this.state && this.state.obstacles) || []) {
        let low = 0,
          high = range;
        const minX = o.x - o.w / 2 - 0.18,
          maxX = o.x + o.w / 2 + 0.18,
          minZ = o.z - o.d / 2 - 0.18,
          maxZ = o.z + o.d / 2 + 0.18;
        if (Math.abs(dx) < 1e-7) {
          if (x < minX || x > maxX) continue;
        } else {
          const a = (minX - x) / dx,
            b = (maxX - x) / dx;
          low = Math.max(low, Math.min(a, b));
          high = Math.min(high, Math.max(a, b));
          if (high < low) continue;
        }
        if (Math.abs(dz) < 1e-7) {
          if (z < minZ || z > maxZ) continue;
        } else {
          const a = (minZ - z) / dz,
            b = (maxZ - z) / dz;
          low = Math.max(low, Math.min(a, b));
          high = Math.min(high, Math.max(a, b));
          if (high < low) continue;
        }
        if (high >= low && low >= 0) range = Math.min(range, low);
      }
      return Math.max(0, range);
    }
    _syncKitEffects(time) {
      let pivots = 0,
        lines = 0,
        slams = 0,
        rewinds = 0,
        queries = this.queryInstances.count;
      const localTeam = this.players.get(this.localId)?.data?.team;
      for (const fx of (this.state && this.state.effects) || []) {
        if (!fx || !Number.isFinite(fx.x) || !Number.isFinite(fx.z)) continue;
        const heading = Number.isFinite(fx.angle) ? fx.angle : 0,
          friendly = localTeam && fx.team === localTeam,
          impact = fx.phase === 'impact';
        const remaining = clamp((fx.remaining || 0) / (fx.total || 1), 0, 1);
        this.color.setHex(friendly ? 0x7bdcff : 0xff6a83);
        if (fx.kind === 'pivot' && pivots < 36) {
          const width = clamp(fx.width || 6, 1, 12),
            depth = clamp(fx.depth || 5, 1, 12);
          this.instance.position.set(fx.x, 0.075, fx.z);
          this.instance.rotation.set(-Math.PI / 2, heading, 0, 'YXZ');
          this.instance.scale.set(width, depth, 1);
          this.instance.updateMatrix();
          this.pivotInstances.setMatrixAt(pivots, this.instance.matrix);
          this.color.multiplyScalar(impact ? 1 : 0.78 + Math.sin(time * 13) * 0.15);
          this.pivotInstances.setColorAt(pivots++, this.color);
          if (impact && slams < 36) {
            this.instance.position.y = 0.2 + Math.sin(remaining * Math.PI) * 1.8;
            this.instance.rotation.set(
              -Math.PI / 2 + 0.22 * Math.sin(remaining * Math.PI),
              heading,
              0,
              'YXZ',
            );
            this.instance.scale.set(width * 0.92, depth * 0.92, 1);
            this.instance.updateMatrix();
            this.pivotSlams.setMatrixAt(slams++, this.instance.matrix);
          }
        } else if (fx.kind === 'apexCast' && lines < 36) {
          const depth = this._effectRayLength(fx.x, fx.z, heading, clamp(fx.depth || 18, 0.1, 24));
          this.instance.position.set(
            fx.x + (Math.sin(heading) * depth) / 2,
            0.11,
            fx.z + (Math.cos(heading) * depth) / 2,
          );
          this.instance.rotation.set(0, heading, 0);
          this.instance.scale.set(clamp(fx.width || 0.6, 0.1, 2), impact ? 0.12 : 0.04, depth);
          this.instance.updateMatrix();
          this.apexInstances.setMatrixAt(lines, this.instance.matrix);
          this.apexInstances.setColorAt(lines++, this.color);
          if (queries < 24) {
            this.instance.position.y = 1.6;
            this.instance.quaternion.copy(this.camera.quaternion);
            this.instance.scale.set(2.7, 0.68, 1);
            this.instance.updateMatrix();
            this.queryInstances.setMatrixAt(queries++, this.instance.matrix);
          }
        } else if (
          fx.kind === 'rewind' &&
          rewinds < 24 &&
          !this.players.get(fx.ownerId)?.data?.rewindFlash
        ) {
          const size = 1.6 + (1 - remaining) * 1.3;
          this.instance.position.set(fx.x, 2.1, fx.z);
          this.instance.quaternion.copy(this.camera.quaternion);
          this.instance.scale.set(size, size, 1);
          this.instance.updateMatrix();
          this.rewindInstances.setMatrixAt(rewinds++, this.instance.matrix);
        }
      }
      this.pivotInstances.count = pivots;
      this.apexInstances.count = lines;
      this.pivotSlams.count = slams;
      this.rewindInstances.count = rewinds;
      this.queryInstances.count = queries;
      for (const mesh of [
        this.pivotInstances,
        this.apexInstances,
        this.pivotSlams,
        this.rewindInstances,
        this.queryInstances,
      ]) {
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    }
    _animateKit(model, dt, time, angle, oldX, oldZ) {
      const kit = model.kit,
        data = model.data;
      if (!kit) return;
      kit.barrier.visible = !!data.alive && data.barrierRemaining > 0 && data.barrierHp > 0;
      if (kit.barrier.visible) {
        kit.barrier.rotation.y =
          (Number.isFinite(data.barrierAngle) ? data.barrierAngle : angle) - angle;
        kit.barrierMaterial.color.setHex(data.barrierFlash > 0 ? 0xe0ffff : 0x78e9ff);
        kit.barrierMaterial.opacity =
          0.19 + 0.18 * clamp(data.barrierHp / 42, 0, 1) + (data.barrierFlash > 0 ? 0.19 : 0);
        kit.barrier.scale.y = 0.97 + Math.sin(time * 8) * 0.025;
      }
      const undo = Number(data.undoPending) || 0,
        flash = Number(data.rewindFlash) || 0;
      kit.rewind.visible = !!data.alive && (undo > 0 || flash > 0);
      if (kit.rewind.visible) {
        const progress = clamp(1 - flash / 0.6, 0, 1);
        kit.rewind.scale.setScalar(undo > 0 ? 0.8 : 1 + progress * 0.9);
        kit.rewindMaterial.opacity = undo > 0 ? 0.42 : Math.max(0.08, flash / 0.6) * 0.8;
        kit.rewindGlyphMaterial.opacity = undo > 0 ? 0.45 : Math.max(0.08, flash / 0.6);
        kit.glyph.quaternion.copy(
          this.quat.copy(model.root.quaternion).invert().multiply(this.camera.quaternion),
        );
      }
      kit.dashFade = data.dashing ? 1 : Math.max(0, kit.dashFade - dt * 6);
      kit.trail.visible = !!data.alive && kit.dashFade > 0;
      if (kit.trail.visible) {
        const dx = model.x - oldX,
          dz = model.z - oldZ;
        if (Math.hypot(dx, dz) > 0.001) kit.trail.rotation.y = Math.atan2(dx, dz) - angle;
        kit.trail.scale.z = 0.7 + 0.3 * kit.dashFade;
        kit.dashMaterial.opacity = 0.45 * kit.dashFade;
      }
    }
    _animateModel(model, dt, time, follow) {
      const data = model.data;
      if (!data) return;
      const shown = !model.player || data.alive || data.downed;
      model.root.visible = !!shown;
      if (!shown) return;
      const oldX = model.x,
        oldZ = model.z,
        alpha = 1 - Math.exp(-dt * 18);
      model.x += (data.x - model.x) * alpha;
      model.z += (data.z - model.z) * alpha;
      model.root.position.set(model.x, 0, model.z);
      let aimX = data.aimX,
        aimZ = data.aimZ;
      if (!Number.isFinite(aimX)) {
        aimX = follow ? follow.x : 0;
        aimZ = follow ? follow.z : 12;
      }
      const angle = Math.atan2(aimX - model.x, aimZ - model.z);
      model.root.rotation.y = angle;
      const moving = Math.hypot(model.x - oldX, model.z - oldZ) > 0.005;
      model.body.position.y = moving
        ? Math.abs(Math.sin(time * 13)) * 0.045
        : Math.sin(time * 2) * 0.018;
      model.body.rotation.z = data.downed ? -0.9 : 0;
      for (let i = 0; i < model.legs.length; i++)
        model.legs[i].rotation.x =
          moving && !data.downed ? Math.sin(time * 13) * (i ? -1 : 1) * 0.55 : 0;
      const hp = clamp((data.hp || 0) / (data.maxHp || 1), 0, 1),
        shield = clamp((data.shield || 0) / (data.maxShield || 1), 0, 1);
      model.hpFill.scale.x = 1.8 * hp;
      model.hpFill.position.x = (hp - 1) * 0.9;
      model.shieldFill.scale.x = 1.8 * shield;
      model.shieldFill.position.x = (shield - 1) * 0.9;
      model.shieldFill.visible = model.shieldBack.visible = !!data.maxShield;
      model.revive.scale.x = 1.8 * clamp(data.reviveProgress || 0, 0, 1);
      model.revive.position.x = (clamp(data.reviveProgress || 0, 0, 1) - 1) * 0.9;
      model.revive.visible = !!data.downed;
      model.bar.quaternion.copy(
        this.quat.copy(model.root.quaternion).invert().multiply(this.camera.quaternion),
      );
      model.ring.visible =
        model.player && (data.id === this.localId || data.downed || data.invulnerable);
      model.ring.material.opacity = data.invulnerable ? 0.55 + Math.sin(time * 18) * 0.3 : 0.8;
      if (model.shell) {
        model.shell.visible = !!data.shielded;
        model.shieldLabel.visible = !!data.shielded;
        model.shellMaterial.opacity = 0.13 + Math.sin(time * 4) * 0.035;
      }
      this._animateKit(model, dt, time, angle, oldX, oldZ);
    }
    render(dt, time) {
      if (this.contextLost) return;
      dt = clamp(Number(dt) || 0.016, 0, 0.12);
      time = Number(time) || 0;
      if (this.quality === 'auto' && this.state && this.state.phase === 'playing') {
        this.averageFrameMs = this.averageFrameMs * 0.92 + dt * 1000 * 0.08;
        this.qualityClock += dt;
        if (this.qualityClock >= 1) {
          this.qualityClock = 0;
          let ratio = this.adaptiveRatio;
          if (this.averageFrameMs > 1000 / 30) ratio = Math.max(0.6, ratio - 0.1);
          else if (this.averageFrameMs < 1000 / 55) ratio = Math.min(1, ratio + 0.03);
          if (Math.abs(ratio - this.adaptiveRatio) > 0.001) {
            this.adaptiveRatio = ratio;
            this.resize();
          }
        }
      }
      const me = this.players.get(this.localId),
        follow = me && me.data && (me.data.alive || me.data.downed) ? me : null;
      if (follow) {
        this.target.set(follow.x, 25 * this.zoomFactor, follow.z + 24 * this.zoomFactor);
        this.camera.position.lerp(this.target, 1 - Math.exp(-dt * 7));
        this.camera.lookAt(follow.x, 0, follow.z - 3);
      } else {
        this.target.set(Math.sin(time * 0.06) * 3, 28 * this.zoomFactor, 28 * this.zoomFactor);
        this.camera.position.lerp(this.target, 1 - Math.exp(-dt * 2));
        this.camera.lookAt(0, 0, -2);
      }
      for (const model of this.players.values()) this._animateModel(model, dt, time, follow);
      for (const model of this.enemies.values()) this._animateModel(model, dt, time, follow);
      this._syncEffects(time);
      this.renderer.render(this.scene, this.camera);
    }
    resize() {
      const w = Math.max(1, this.canvas.clientWidth || this.canvas.width || 800),
        h = Math.max(1, this.canvas.clientHeight || this.canvas.height || 600),
        base = this.quality === 'fast' ? 0.65 : Math.min(window.devicePixelRatio || 1, 1),
        ratio = Math.max(
          0.45,
          Math.min(base, Math.sqrt(850000 / (w * h))) *
            (this.quality === 'fast' ? 1 : this.adaptiveRatio),
        );
      this.renderer.setPixelRatio(ratio);
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
    setQuality(value) {
      this.quality = value === 'fast' ? 'fast' : 'auto';
      this.adaptiveRatio = 1;
      this.averageFrameMs = 16.7;
      this.qualityClock = 0;
      this.resize();
      return this.quality;
    }
    aim(clientX, clientY) {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      this.pointer.set(
        ((clientX - r.left) / r.width) * 2 - 1,
        (-(clientY - r.top) / r.height) * 2 + 1,
      );
      this.camera.updateMatrixWorld();
      this.ray.setFromCamera(this.pointer, this.camera);
      if (!this.ray.ray.intersectPlane(this.ground, this.aimPoint)) return null;
      return { x: this.aimPoint.x, z: this.aimPoint.z };
    }
    zoom(delta) {
      this.zoomFactor = clamp(this.zoomFactor + (Number(delta) || 0) * 0.0007, 0.7, 1.45);
      return this.zoomFactor;
    }
    reset() {
      for (const model of this.players.values()) this._retire(model);
      for (const model of this.enemies.values()) this._retire(model);
      this.players.clear();
      this.enemies.clear();
      this.state = null;
      this.localId = null;
      this.mapKey = '';
      this.supportModel.root.visible = false;
      this._buildArena('demo', 'port', []);
      this._syncEffects(0);
    }
  }
  window.BulkArenaRenderer = BulkArenaRenderer;
})();
