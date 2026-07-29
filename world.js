(function () {
  "use strict";

  const geometryCache = new Map();

  function cachedGeometry(key, factory) {
    if (!geometryCache.has(key)) geometryCache.set(key, factory());
    return geometryCache.get(key);
  }

  function makeMaterials(THREE) {
    const physical = (color, roughness, metalness, extra) =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness,
        metalness,
        clearcoat: 0,
        clearcoatRoughness: 0.28,
        ...extra
      });

    return {
      navy: physical(0x112039, 0.28, 0.24, { clearcoat: 0.42 }),
      navyDark: physical(0x07111e, 0.48, 0.34),
      ivory: physical(0xe9e2d5, 0.38, 0.06, { clearcoat: 0.24 }),
      ivoryDark: physical(0xb9b4aa, 0.46, 0.12),
      orange: physical(0xe6632b, 0.32, 0.18, { clearcoat: 0.38 }),
      orangeGlow: new THREE.MeshBasicMaterial({ color: 0xff7138, toneMapped: false }),
      cyan: physical(0x79b7c8, 0.32, 0.36),
      alloy: physical(0xaab0b2, 0.28, 0.88, { clearcoat: 0.12 }),
      darkMetal: physical(0x171d23, 0.43, 0.78),
      rubber: physical(0x0c0f12, 0.82, 0.02),
      glass: physical(0x183043, 0.12, 0.08, {
        clearcoat: 0.8,
        transmission: 0.15,
        transparent: true,
        opacity: 0.88
      }),
      lens: physical(0xf5c1a3, 0.14, 0.03, {
        emissive: 0xe6632b,
        emissiveIntensity: 1.1,
        clearcoat: 1
      }),
      whiteLens: physical(0xe9f2ed, 0.08, 0.02, {
        emissive: 0xd9f1ed,
        emissiveIntensity: 0.72,
        clearcoat: 1
      }),
      oxide: physical(0x8d4638, 0.55, 0.18),
      water: physical(0x0d2c3d, 0.25, 0.42, {
        clearcoat: 0.6,
        clearcoatRoughness: 0.35
      }),
      asphalt: physical(0x111923, 0.88, 0.02),
      ground: physical(0x172332, 0.82, 0.08),
      containerBlue: physical(0x1a334c, 0.5, 0.24),
      containerOrange: physical(0xcf5a28, 0.48, 0.2),
      containerIvory: physical(0xcfc7b8, 0.52, 0.18),
      containerCyan: physical(0x477d88, 0.5, 0.22)
    };
  }

  function roundedRectShape(THREE, width, height, radius) {
    const x = -width / 2;
    const y = -height / 2;
    const r = Math.min(radius, width / 2, height / 2);
    const shape = new THREE.Shape();
    shape.moveTo(x + r, y);
    shape.lineTo(x + width - r, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + r);
    shape.lineTo(x + width, y + height - r);
    shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    shape.lineTo(x + r, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }

  function roundedBox(THREE, width, height, depth, radius, material, bevelSegments) {
    const key = `rounded:${width}:${height}:${depth}:${radius}:${bevelSegments || 2}`;
    const geometry = cachedGeometry(key, () => {
      const shape = roundedRectShape(THREE, width, height, radius);
      const bevel = Math.min(radius * 0.42, depth * 0.12);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        steps: 1,
        curveSegments: 5,
        bevelEnabled: true,
        bevelSegments: bevelSegments || 2,
        bevelSize: bevel,
        bevelThickness: bevel
      });
      geo.center();
      geo.computeVertexNormals();
      return geo;
    });
    return new THREE.Mesh(geometry, material);
  }

  function simpleBox(THREE, width, height, depth, material) {
    const key = `box:${width}:${height}:${depth}`;
    const geometry = cachedGeometry(key, () => new THREE.BoxGeometry(width, height, depth));
    return new THREE.Mesh(geometry, material);
  }

  function cylinder(THREE, radiusTop, radiusBottom, length, segments, material) {
    const key = `cylinder:${radiusTop}:${radiusBottom}:${segments || 20}`;
    const geometry = cachedGeometry(
      key,
      () => new THREE.CylinderGeometry(radiusTop, radiusBottom, 1, segments || 20, 1, false)
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.y = length;
    return mesh;
  }

  function tubeBetween(THREE, start, end, radius, material, segments) {
    const a = start.isVector3 ? start : new THREE.Vector3(...start);
    const b = end.isVector3 ? end : new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(b, a);
    const mesh = cylinder(THREE, radius, radius, direction.length(), segments || 12, material);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return mesh;
  }

  function curveTube(THREE, points, radius, material, tubularSegments) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    const geometry = new THREE.TubeGeometry(curve, tubularSegments || 24, radius, 6, false);
    return new THREE.Mesh(geometry, material);
  }

  function extrudedPolygon(THREE, points, depth, material, bevelSize) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) shape.lineTo(points[i][0], points[i][1]);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      steps: 1,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: bevelSize || 0.04,
      bevelThickness: bevelSize || 0.04,
      curveSegments: 4
    });
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, material);
  }

  function addLugs(THREE, parent, radius, z, material, count) {
    const lugGeometry = cachedGeometry("lug-sphere", () => new THREE.SphereGeometry(0.035, 8, 6));
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      const lug = new THREE.Mesh(lugGeometry, material);
      lug.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
      parent.add(lug);
    }
  }

  function createWheel(THREE, materials, radius, width) {
    const group = new THREE.Group();
    const tireGeometry = cachedGeometry(
      `tire:${radius}:${width}`,
      () => new THREE.TorusGeometry(radius * 0.72, width * 0.48, 12, 28)
    );
    const tire = new THREE.Mesh(tireGeometry, materials.rubber);
    const hub = cylinder(THREE, radius * 0.46, radius * 0.46, width * 0.7, 24, materials.alloy);
    hub.rotation.x = Math.PI / 2;
    const inset = cylinder(THREE, radius * 0.21, radius * 0.21, width * 0.76, 20, materials.darkMetal);
    inset.rotation.x = Math.PI / 2;
    group.add(tire, hub, inset);
    addLugs(THREE, group, radius * 0.32, width * 0.37, materials.darkMetal, 8);
    addLugs(THREE, group, radius * 0.32, -width * 0.37, materials.darkMetal, 8);
    group.userData.isWheel = true;
    return group;
  }

  function createTruck(THREE, materials, detailLevel) {
    const truck = new THREE.Group();
    truck.name = "reference-driven-freight-truck";

    const chassis = roundedBox(THREE, 11.1, 0.28, 1.66, 0.07, materials.darkMetal);
    chassis.position.set(0.8, 0.72, 0);
    truck.add(chassis);

    const frameLeft = simpleBox(THREE, 10.5, 0.18, 0.12, materials.navyDark);
    frameLeft.position.set(0.8, 0.92, -0.63);
    const frameRight = frameLeft.clone();
    frameRight.position.z = 0.63;
    truck.add(frameLeft, frameRight);

    const cabProfile = [
      [-4.62, 0.22],
      [-4.58, 1.55],
      [-4.36, 2.72],
      [-3.76, 3.34],
      [-2.86, 3.62],
      [-1.45, 3.54],
      [-0.92, 2.95],
      [-0.92, 0.22]
    ];
    const cab = extrudedPolygon(THREE, cabProfile, 2.22, materials.navy, 0.08);
    cab.position.z = -1.11;
    truck.add(cab);

    const cabCrown = extrudedPolygon(
      THREE,
      [
        [-4.22, 2.95],
        [-3.55, 3.48],
        [-2.7, 3.74],
        [-1.35, 3.66],
        [-1.02, 3.25],
        [-2.25, 3.26]
      ],
      2.18,
      materials.navy,
      0.06
    );
    cabCrown.position.z = -1.09;
    truck.add(cabCrown);

    const roofVisor = roundedBox(THREE, 1.52, 0.18, 2.38, 0.05, materials.navyDark);
    roofVisor.position.set(-3.91, 2.98, 0);
    roofVisor.rotation.z = -0.08;
    truck.add(roofVisor);

    const windshieldGeometry = cachedGeometry(
      "truck-windshield",
      () => new THREE.BoxGeometry(0.07, 1.02, 0.93)
    );
    [-0.49, 0.49].forEach((z) => {
      const glass = new THREE.Mesh(windshieldGeometry, materials.glass);
      glass.position.set(-4.52, 2.44, z);
      glass.rotation.z = -0.16;
      truck.add(glass);
    });

    [-1.13, 1.13].forEach((z) => {
      const sideWindow = roundedBox(THREE, 1.28, 0.9, 0.045, 0.12, materials.glass);
      sideWindow.position.set(-2.42, 2.36, z);
      truck.add(sideWindow);
      const stripe = simpleBox(THREE, 1.65, 0.055, 0.035, materials.orange);
      stripe.position.set(-1.95, 1.55, z * 1.01);
      stripe.rotation.z = 0.08;
      truck.add(stripe);
    });

    const grilleFrame = roundedBox(THREE, 0.16, 0.92, 1.72, 0.12, materials.alloy);
    grilleFrame.position.set(-4.66, 1.12, 0);
    truck.add(grilleFrame);
    const grilleCore = roundedBox(THREE, 0.18, 0.74, 1.5, 0.08, materials.navyDark);
    grilleCore.position.set(-4.75, 1.12, 0);
    truck.add(grilleCore);

    for (let index = -2; index <= 2; index += 1) {
      const fin = simpleBox(THREE, 0.08, 0.055, 1.34, materials.alloy);
      fin.position.set(-4.85, 1.12 + index * 0.12, 0);
      truck.add(fin);
    }

    const bumper = roundedBox(THREE, 0.38, 0.42, 2.48, 0.08, materials.alloy);
    bumper.position.set(-4.57, 0.45, 0);
    truck.add(bumper);
    const lowerIntake = roundedBox(THREE, 0.2, 0.24, 1.36, 0.05, materials.navyDark);
    lowerIntake.position.set(-4.8, 0.7, 0);
    truck.add(lowerIntake);

    [-0.79, 0.79].forEach((z) => {
      const headlight = roundedBox(THREE, 0.12, 0.56, 0.34, 0.06, materials.whiteLens);
      headlight.position.set(-4.75, 0.99, z);
      truck.add(headlight);
      const marker = roundedBox(THREE, 0.13, 0.08, 0.3, 0.03, materials.lens);
      marker.position.set(-4.78, 0.59, z);
      truck.add(marker);
    });

    [-1, 1].forEach((side) => {
      const arm = tubeBetween(
        THREE,
        [-3.38, 2.55, side * 1.05],
        [-3.56, 2.32, side * 1.5],
        0.045,
        materials.darkMetal,
        10
      );
      const mirror = roundedBox(THREE, 0.24, 0.58, 0.33, 0.07, materials.navy);
      mirror.position.set(-3.58, 2.18, side * 1.53);
      truck.add(arm, mirror);
    });

    const trailer = roundedBox(THREE, 7.72, 3.38, 2.36, 0.1, materials.ivory);
    trailer.position.set(3.02, 2.23, 0);
    truck.add(trailer);

    const topRail = roundedBox(THREE, 7.84, 0.14, 2.44, 0.04, materials.alloy);
    topRail.position.set(3.02, 3.88, 0);
    const bottomRail = roundedBox(THREE, 7.84, 0.17, 2.44, 0.04, materials.alloy);
    bottomRail.position.set(3.02, 0.58, 0);
    truck.add(topRail, bottomRail);

    const ribGeometry = cachedGeometry("trailer-rib", () => new THREE.BoxGeometry(7.48, 0.035, 0.035));
    for (let index = 0; index < 12; index += 1) {
      const y = 0.87 + index * 0.24;
      [-1.2, 1.2].forEach((z) => {
        const rib = new THREE.Mesh(ribGeometry, materials.ivoryDark);
        rib.position.set(3.02, y, z);
        truck.add(rib);
      });
    }

    [-0.88, 6.91].forEach((x) => {
      [-1.21, 1.21].forEach((z) => {
        const post = roundedBox(THREE, 0.14, 3.42, 0.14, 0.025, materials.alloy);
        post.position.set(x, 2.22, z);
        truck.add(post);
        for (let index = 0; index < 3; index += 1) {
          const latch = roundedBox(THREE, 0.12, 0.18, 0.08, 0.02, materials.darkMetal);
          latch.position.set(x + (x > 0 ? 0.08 : -0.08), 0.84 + index * 1.28, z * 1.02);
          truck.add(latch);
        }
      });
    });

    const trailerDoorSeam = simpleBox(THREE, 0.03, 2.9, 0.05, materials.darkMetal);
    trailerDoorSeam.position.set(6.95, 2.22, 0);
    trailerDoorSeam.rotation.y = Math.PI / 2;
    truck.add(trailerDoorSeam);

    for (let index = 0; index < 9; index += 1) {
      [-1.24, 1.24].forEach((z) => {
        const marker = roundedBox(THREE, 0.12, 0.075, 0.04, 0.02, materials.lens);
        marker.position.set(-0.5 + index * 0.88, 0.59, z);
        truck.add(marker);
      });
    }

    [-0.25, 0.55].forEach((x, index) => {
      [-1.02, 1.02].forEach((z) => {
        const tank = cylinder(THREE, 0.4, 0.4, 0.76, 24, materials.alloy);
        tank.rotation.z = Math.PI / 2;
        tank.position.set(x, 0.7, z);
        truck.add(tank);
        const strap = cylinder(THREE, 0.415, 0.415, 0.035, 24, materials.darkMetal);
        strap.rotation.z = Math.PI / 2;
        strap.position.set(x + (index ? 0.19 : -0.19), 0.7, z);
        truck.add(strap);
      });
    });

    const wheelPositions = [-3.38, -1.12, 4.78, 5.92];
    const wheels = [];
    wheelPositions.forEach((x, axleIndex) => {
      [-1.15, 1.15].forEach((z) => {
        const wheel = createWheel(THREE, materials, axleIndex === 0 ? 0.68 : 0.65, 0.46);
        wheel.position.set(x, 0.58, z);
        truck.add(wheel);
        wheels.push(wheel);
      });
    });

    const archGeometry = cachedGeometry(
      "wheel-arch",
      () => new THREE.TorusGeometry(0.75, 0.06, 8, 24, Math.PI)
    );
    [-1.15, 1.15].forEach((z) => {
      const arch = new THREE.Mesh(archGeometry, materials.navyDark);
      arch.position.set(-3.38, 0.58, z * 1.015);
      arch.rotation.z = Math.PI;
      truck.add(arch);
    });

    const guardTop = simpleBox(THREE, 3.05, 0.09, 0.11, materials.alloy);
    const guardBottom = guardTop.clone();
    [-1.27, 1.27].forEach((z) => {
      const top = guardTop.clone();
      const bottom = guardBottom.clone();
      top.position.set(2.4, 0.92, z);
      bottom.position.set(2.4, 0.38, z);
      truck.add(top, bottom);
      [1.0, 3.8].forEach((x) => {
        const brace = simpleBox(THREE, 0.09, 0.62, 0.1, materials.alloy);
        brace.position.set(x, 0.65, z);
        truck.add(brace);
      });
    });

    if (detailLevel !== "low") {
      [-0.55, 0.55].forEach((z) => {
        const wiper = tubeBetween(
          THREE,
          [-4.61, 2.05, z],
          [-4.64, 2.58, z * 0.55],
          0.018,
          materials.darkMetal,
          8
        );
        truck.add(wiper);
      });
    }

    truck.userData.wheels = wheels;
    truck.userData.sculptRuntime = {
      pivots: ["root", "wheel-assemblies", "trailer-handoff"],
      sockets: ["front-route", "rear-route", "fifth-wheel"],
      fidelity: "reference-informed procedural"
    };
    truck.scale.setScalar(0.78);
    return truck;
  }

  function loftGeometry(THREE, sections, radialSegments, options) {
    const vertices = [];
    const upperIndices = [];
    const lowerIndices = [];
    const segments = radialSegments || 14;
    const settings = options || {};
    const lowerMaterialFromSin = Number.isFinite(settings.lowerMaterialFromSin)
      ? settings.lowerMaterialFromSin
      : null;
    const ringSin = [];

    sections.forEach((section) => {
      const sinValues = [];
      for (let index = 0; index < segments; index += 1) {
        const angle = (index / segments) * Math.PI * 2;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const upperFlatten = settings.topFlatten !== false && sin > 0.58 ? 0.84 : 1;
        vertices.push(
          section.x,
          section.cy + sin * section.ry * upperFlatten,
          cos * section.rz
        );
        sinValues.push(sin);
      }
      ringSin.push(sinValues);
    });

    function addTriangle(target, a, b, c) {
      target.push(a, b, c);
    }

    function targetForSin(value) {
      return lowerMaterialFromSin !== null && value < lowerMaterialFromSin
        ? lowerIndices
        : upperIndices;
    }

    for (let ring = 0; ring < sections.length - 1; ring += 1) {
      for (let index = 0; index < segments; index += 1) {
        const next = (index + 1) % segments;
        const a = ring * segments + index;
        const b = ring * segments + next;
        const c = (ring + 1) * segments + next;
        const d = (ring + 1) * segments + index;
        const target = targetForSin((ringSin[ring][index] + ringSin[ring][next]) * 0.5);
        addTriangle(target, a, d, b);
        addTriangle(target, b, d, c);
      }
    }

    if (settings.capEnds !== false) {
      const firstCenter = vertices.length / 3;
      vertices.push(sections[0].x, sections[0].cy, 0);
      const lastCenter = vertices.length / 3;
      const finalSection = sections[sections.length - 1];
      vertices.push(finalSection.x, finalSection.cy, 0);
      const lastRing = (sections.length - 1) * segments;

      for (let index = 0; index < segments; index += 1) {
        const next = (index + 1) % segments;
        const startTarget = targetForSin((ringSin[0][index] + ringSin[0][next]) * 0.5);
        const endTarget = targetForSin(
          (ringSin[ringSin.length - 1][index] + ringSin[ringSin.length - 1][next]) * 0.5
        );
        addTriangle(startTarget, firstCenter, index, next);
        addTriangle(endTarget, lastCenter, lastRing + next, lastRing + index);
      }
    }

    const indices = upperIndices.concat(lowerIndices);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.clearGroups();
    if (upperIndices.length) geometry.addGroup(0, upperIndices.length, 0);
    if (lowerIndices.length) geometry.addGroup(upperIndices.length, lowerIndices.length, 1);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function createContainer(THREE, materials, material, detailLevel) {
    const group = new THREE.Group();
    const body = roundedBox(THREE, 1.12, 0.58, 0.64, 0.025, material, 1);
    group.add(body);

    const cornerGeo = cachedGeometry("container-corner", () => new THREE.BoxGeometry(0.04, 0.62, 0.04));
    [
      [-0.54, -0.3],
      [-0.54, 0.3],
      [0.54, -0.3],
      [0.54, 0.3]
    ].forEach(([x, z]) => {
      const corner = new THREE.Mesh(cornerGeo, materials.alloy);
      corner.position.set(x, 0, z);
      group.add(corner);
    });

    if (detailLevel !== "low") {
      const ribGeo = cachedGeometry("container-rib", () => new THREE.BoxGeometry(0.035, 0.49, 0.025));
      for (let index = -4; index <= 4; index += 1) {
        [-0.326, 0.326].forEach((z) => {
          const rib = new THREE.Mesh(ribGeo, materials.darkMetal);
          rib.position.set(index * 0.105, 0, z);
          rib.scale.x = 0.48;
          group.add(rib);
        });
      }
      [-0.17, 0.17].forEach((z) => {
        const doorBar = simpleBox(THREE, 0.03, 0.47, 0.025, materials.alloy);
        doorBar.position.set(-0.575, 0, z);
        doorBar.rotation.y = Math.PI / 2;
        group.add(doorBar);
      });
    }
    return group;
  }

  function createShip(THREE, materials, detailLevel) {
    const ship = new THREE.Group();
    ship.name = "reference-driven-container-ship";

    const hullSections = [
      { x: -6.46, cy: 0.54, ry: 0.4, rz: 0.2 },
      { x: -6.08, cy: 0.24, ry: 1.1, rz: 0.7 },
      { x: -5.28, cy: 0.05, ry: 1.52, rz: 1.2 },
      { x: -3.7, cy: 0.02, ry: 1.66, rz: 1.46 },
      { x: 1.8, cy: 0.02, ry: 1.62, rz: 1.5 },
      { x: 4.55, cy: 0.03, ry: 1.52, rz: 1.4 },
      { x: 5.65, cy: 0.05, ry: 1.3, rz: 1.12 },
      { x: 6.15, cy: 0.08, ry: 0.95, rz: 0.72 }
    ];
    const hull = new THREE.Mesh(
      loftGeometry(THREE, hullSections, 28, {
        capEnds: true,
        lowerMaterialFromSin: -0.32,
        topFlatten: true
      }),
      [materials.navy, materials.oxide]
    );
    ship.add(hull);

    const bulbSections = [
      { x: -6.82, cy: -0.76, ry: 0.12, rz: 0.12 },
      { x: -6.56, cy: -0.86, ry: 0.34, rz: 0.34 },
      { x: -5.98, cy: -0.94, ry: 0.48, rz: 0.52 },
      { x: -5.34, cy: -0.84, ry: 0.42, rz: 0.5 },
      { x: -4.62, cy: -0.62, ry: 0.34, rz: 0.44 }
    ];
    const bulb = new THREE.Mesh(
      loftGeometry(THREE, bulbSections, 20, { capEnds: true, topFlatten: false }),
      materials.oxide
    );
    ship.add(bulb);

    const deck = roundedBox(THREE, 10.3, 0.2, 2.58, 0.05, materials.darkMetal);
    deck.position.set(0.12, 1.26, 0);
    ship.add(deck);

    const bowDeck = extrudedPolygon(
      THREE,
      [
        [-6.0, -1.12],
        [-5.0, -1.26],
        [-3.9, -1.26],
        [-3.9, 1.26],
        [-5.0, 1.26],
        [-6.0, 1.12]
      ],
      0.16,
      materials.navyDark,
      0.03
    );
    bowDeck.rotation.x = Math.PI / 2;
    bowDeck.position.y = 1.34;
    ship.add(bowDeck);

    const containerMaterials = [
      materials.containerBlue,
      materials.containerOrange,
      materials.containerIvory,
      materials.containerCyan
    ];
    const stackHeights = detailLevel === "low"
      ? [2, 3, 2, 3, 2, 2]
      : [2, 3, 4, 3, 4, 3, 3, 2];
    const containerRoot = new THREE.Group();
    const startX = detailLevel === "low" ? -3.2 : -3.65;
    stackHeights.forEach((height, column) => {
      [-0.67, 0, 0.67].forEach((z, lane) => {
        const boundedHeight = Math.max(1, height - ((column + lane) % 3 === 0 ? 1 : 0));
        for (let level = 0; level < boundedHeight; level += 1) {
          const material = containerMaterials[(column * 2 + lane + level) % containerMaterials.length];
          const container = createContainer(THREE, materials, material, detailLevel);
          container.position.set(startX + column * 1.08, 1.66 + level * 0.6, z);
          containerRoot.add(container);
        }
      });
    });
    ship.add(containerRoot);

    const superRoot = new THREE.Group();
    const lowerBlock = roundedBox(THREE, 1.88, 1.48, 2.26, 0.07, materials.ivory);
    lowerBlock.position.set(4.35, 2.05, 0);
    const upperBlock = roundedBox(THREE, 2.28, 0.82, 2.48, 0.08, materials.ivory);
    upperBlock.position.set(4.18, 3.02, 0);
    const bridge = roundedBox(THREE, 2.58, 0.55, 2.62, 0.08, materials.ivory);
    bridge.position.set(4.02, 3.68, 0);
    superRoot.add(lowerBlock, upperBlock, bridge);

    const windowGeo = cachedGeometry("bridge-window", () => new THREE.BoxGeometry(0.18, 0.2, 0.035));
    for (let index = 0; index < 10; index += 1) {
      const frontWindow = new THREE.Mesh(windowGeo, materials.glass);
      frontWindow.position.set(3.0 + index * 0.22, 3.74, -1.325);
      superRoot.add(frontWindow);
      const backWindow = frontWindow.clone();
      backWindow.position.z = 1.325;
      superRoot.add(backWindow);
    }
    for (let index = 0; index < 5; index += 1) {
      const sideWindow = new THREE.Mesh(windowGeo, materials.glass);
      sideWindow.rotation.y = Math.PI / 2;
      sideWindow.position.set(2.72, 3.74, -0.82 + index * 0.4);
      superRoot.add(sideWindow);
    }
    ship.add(superRoot);

    const railGeo = cachedGeometry("ship-rail", () => new THREE.CylinderGeometry(0.018, 0.018, 1, 8));
    [-1.37, 1.37].forEach((z) => {
      const topRail = tubeBetween(THREE, [-5.6, 1.76, z], [5.25, 1.76, z], 0.018, materials.alloy, 8);
      ship.add(topRail);
      const postCount = detailLevel === "low" ? 10 : 22;
      for (let index = 0; index <= postCount; index += 1) {
        const post = new THREE.Mesh(railGeo, materials.alloy);
        post.scale.y = 0.42;
        post.position.set(-5.55 + (10.7 * index) / postCount, 1.56, z);
        ship.add(post);
      }
    });

    [-4.8, 3.75].forEach((x, mastIndex) => {
      const mast = cylinder(THREE, 0.07, 0.09, mastIndex ? 2.2 : 2.45, 12, materials.ivory);
      mast.position.set(x, mastIndex ? 4.82 : 2.8, 0);
      ship.add(mast);
      const cross = tubeBetween(
        THREE,
        [x, mastIndex ? 5.55 : 3.55, -0.55],
        [x, mastIndex ? 5.55 : 3.55, 0.55],
        0.035,
        materials.alloy,
        8
      );
      ship.add(cross);
      const radar = roundedBox(THREE, 0.1, 0.08, 0.8, 0.025, materials.orange);
      radar.position.set(x, mastIndex ? 5.72 : 3.73, 0);
      ship.add(radar);
    });

    const craneXs = [-1.65, 1.45];
    craneXs.forEach((x, index) => {
      const tower = roundedBox(THREE, 0.36, 2.1, 0.48, 0.04, materials.ivory);
      tower.position.set(x, 2.35, index ? 0.92 : -0.92);
      ship.add(tower);
      const start = [x, 3.25, index ? 0.92 : -0.92];
      const end = [x - 2.05, 3.55, index ? 0.92 : -0.92];
      ship.add(tubeBetween(THREE, start, end, 0.105, materials.ivory, 12));
      ship.add(
        curveTube(
          THREE,
          [
            [x, 3.5, index ? 0.92 : -0.92],
            [x - 0.8, 3.96, index ? 0.92 : -0.92],
            [x - 2.05, 3.57, index ? 0.92 : -0.92]
          ],
          0.018,
          materials.darkMetal,
          18
        )
      );
    });

    [-1.52, 1.52].forEach((z) => {
      const anchorRing = new THREE.Mesh(
        cachedGeometry("anchor-ring", () => new THREE.TorusGeometry(0.2, 0.06, 8, 20)),
        materials.alloy
      );
      anchorRing.rotation.y = Math.PI / 2;
      anchorRing.position.set(-5.15, 0.62, z);
      ship.add(anchorRing);
    });

    ship.userData.containerRoot = containerRoot;
    ship.userData.sculptRuntime = {
      pivots: ["root", "crane-booms", "mast-radar"],
      sockets: ["bow-route", "stern-route", "container-cell-guides"],
      fidelity: "reference-informed procedural"
    };
    ship.scale.setScalar(0.78);
    return ship;
  }

  function makeWing(THREE, materials, side, scale) {
    const geometry = new THREE.BufferGeometry();
    const rootHalfThickness = 0.16 * scale;
    const tipHalfThickness = 0.065 * scale;
    const vertices = [
      -1.48, rootHalfThickness, 0.48,
      0.46, tipHalfThickness, 5.05,
      1.38, tipHalfThickness, 5.05,
      1.18, rootHalfThickness, 0.48,
      -1.48, -rootHalfThickness, 0.48,
      0.46, -tipHalfThickness, 5.05,
      1.38, -tipHalfThickness, 5.05,
      1.18, -rootHalfThickness, 0.48
    ];
    const indices = [
      0, 1, 3, 1, 2, 3,
      4, 7, 5, 5, 7, 6,
      0, 4, 1, 1, 4, 5,
      1, 5, 2, 2, 5, 6,
      2, 6, 3, 3, 6, 7,
      3, 7, 0, 0, 7, 4
    ];
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const wing = new THREE.Mesh(geometry, materials.ivory);
    wing.position.y = 0.96;
    wing.scale.z = side;
    wing.name = side > 0 ? "starboard-wing" : "port-wing";
    return wing;
  }

  function createFanRotor(THREE, materials) {
    const rotor = new THREE.Group();
    const bladeGeometry = cachedGeometry(
      "fan-blade",
      () => new THREE.BoxGeometry(0.04, 0.42, 0.1)
    );
    for (let index = 0; index < 14; index += 1) {
      const angle = (index / 14) * Math.PI * 2;
      const blade = new THREE.Mesh(bladeGeometry, materials.darkMetal);
      blade.position.set(0, Math.cos(angle) * 0.29, Math.sin(angle) * 0.29);
      blade.rotation.x = angle;
      blade.rotation.z = 0.26;
      rotor.add(blade);
    }
    const spinner = new THREE.Mesh(
      cachedGeometry("fan-spinner", () => new THREE.ConeGeometry(0.15, 0.28, 18)),
      materials.alloy
    );
    spinner.rotation.z = Math.PI / 2;
    rotor.add(spinner);
    return rotor;
  }

  function createAircraft(THREE, materials, detailLevel) {
    const aircraft = new THREE.Group();
    aircraft.name = "reference-driven-cargo-aircraft";

    const fuselageSections = [
      { x: -5.72, cy: -0.04, ry: 0.16, rz: 0.16 },
      { x: -5.42, cy: 0, ry: 0.56, rz: 0.58 },
      { x: -4.86, cy: 0.06, ry: 0.9, rz: 0.86 },
      { x: -3.82, cy: 0.1, ry: 1.18, rz: 1.15 },
      { x: -1.9, cy: 0.1, ry: 1.34, rz: 1.32 },
      { x: 0.6, cy: 0.12, ry: 1.38, rz: 1.36 },
      { x: 2.45, cy: 0.2, ry: 1.2, rz: 1.18 },
      { x: 3.62, cy: 0.36, ry: 0.9, rz: 0.92 },
      { x: 4.52, cy: 0.58, ry: 0.55, rz: 0.58 },
      { x: 5.18, cy: 0.78, ry: 0.2, rz: 0.22 }
    ];
    const fuselage = new THREE.Mesh(
      loftGeometry(THREE, fuselageSections, 32, {
        capEnds: true,
        topFlatten: false
      }),
      materials.ivory
    );
    aircraft.add(fuselage);

    const radome = new THREE.Mesh(
      loftGeometry(
        THREE,
        [
          { x: -5.75, cy: -0.04, ry: 0.12, rz: 0.12 },
          { x: -5.52, cy: -0.02, ry: 0.45, rz: 0.46 },
          { x: -5.18, cy: 0.01, ry: 0.67, rz: 0.67 },
          { x: -4.82, cy: 0.05, ry: 0.82, rz: 0.8 }
        ],
        28,
        { capEnds: true, topFlatten: false }
      ),
      materials.navy
    );
    aircraft.add(radome);

    aircraft.add(makeWing(THREE, materials, 1, 1), makeWing(THREE, materials, -1, 1));

    const wingCenter = new THREE.Mesh(
      loftGeometry(
        THREE,
        [
          { x: -1.58, cy: 0.92, ry: 0.12, rz: 0.72 },
          { x: -1.08, cy: 0.92, ry: 0.23, rz: 1.22 },
          { x: 0.62, cy: 0.9, ry: 0.21, rz: 1.18 },
          { x: 1.38, cy: 0.86, ry: 0.1, rz: 0.68 }
        ],
        20,
        { capEnds: true, topFlatten: false }
      ),
      materials.ivory
    );
    aircraft.add(wingCenter);

    [-1, 1].forEach((side) => {
      const stripe = curveTube(
        THREE,
        [
          [-4.55, -0.68, side * 0.7],
          [-2.9, -0.96, side * 1.18],
          [-0.4, -1.04, side * 1.32],
          [2.2, -0.78, side * 1.08],
          [4.08, -0.18, side * 0.56]
        ],
        0.026,
        materials.orange,
        30
      );
      aircraft.add(stripe);
    });

    const pylonShape = [
      [-0.86, 0],
      [-0.48, 0.76],
      [0.42, 0.7],
      [0.66, 0]
    ];
    const fanRotors = [];
    [-2.34, 2.34].forEach((z, engineIndex) => {
      const engine = new THREE.Group();
      engine.name = engineIndex === 0 ? "port-turbofan" : "starboard-turbofan";

      const pylon = extrudedPolygon(THREE, pylonShape, 0.34, materials.navy, 0.03);
      pylon.position.set(-0.02, 0.22, z - 0.17);
      engine.add(pylon);

      const nacelle = cylinder(THREE, 0.56, 0.68, 1.72, 32, materials.ivory);
      nacelle.rotation.z = Math.PI / 2;
      nacelle.position.set(-0.2, -0.08, z);
      engine.add(nacelle);

      const rearCowl = cylinder(THREE, 0.4, 0.55, 0.7, 28, materials.ivoryDark);
      rearCowl.rotation.z = Math.PI / 2;
      rearCowl.position.set(0.98, -0.08, z);
      engine.add(rearCowl);

      const exhaust = cylinder(THREE, 0.25, 0.34, 0.5, 24, materials.navyDark);
      exhaust.rotation.z = Math.PI / 2;
      exhaust.position.set(1.42, -0.08, z);
      engine.add(exhaust);

      const inlet = new THREE.Mesh(
        cachedGeometry(
          "nacelle-lip-refined",
          () => new THREE.TorusGeometry(0.59, 0.105, 14, 36)
        ),
        materials.alloy
      );
      inlet.rotation.y = Math.PI / 2;
      inlet.position.set(-1.09, -0.08, z);
      engine.add(inlet);

      const tunnel = cylinder(THREE, 0.49, 0.49, 0.32, 28, materials.navyDark);
      tunnel.rotation.z = Math.PI / 2;
      tunnel.position.set(-0.99, -0.08, z);
      engine.add(tunnel);

      const rotor = createFanRotor(THREE, materials);
      rotor.position.set(-1.15, -0.08, z);
      rotor.scale.setScalar(1.16);
      rotor.name = `fan-rotor-${engineIndex + 1}`;
      engine.add(rotor);
      fanRotors.push(rotor);

      aircraft.add(engine);
    });

    const fin = extrudedPolygon(
      THREE,
      [
        [2.62, 0.66],
        [3.38, 3.58],
        [4.02, 3.68],
        [4.62, 0.7]
      ],
      0.26,
      materials.navy,
      0.06
    );
    fin.position.z = -0.13;
    aircraft.add(fin);

    const finAccent = extrudedPolygon(
      THREE,
      [
        [3.26, 1.18],
        [3.58, 2.78],
        [3.88, 2.7],
        [3.68, 1.1]
      ],
      0.28,
      materials.orange,
      0.025
    );
    finAccent.position.z = -0.14;
    aircraft.add(finAccent);

    const tailPlaneShape = [
      [3.28, 0.14],
      [3.48, 2.56],
      [4.12, 2.48],
      [4.2, 0.14]
    ];
    [1, -1].forEach((side) => {
      const points = tailPlaneShape.map(([x, z]) => [x, z * side]);
      const tailPlane = extrudedPolygon(THREE, points, 0.18, materials.navy, 0.045);
      tailPlane.rotation.x = Math.PI / 2;
      tailPlane.position.y = 3.54;
      aircraft.add(tailPlane);
    });

    const cockpitPanels = [
      [
        [-4.84, 0.5],
        [-4.57, 0.94],
        [-4.24, 0.92],
        [-4.34, 0.46]
      ],
      [
        [-4.2, 0.47],
        [-4.16, 0.93],
        [-3.82, 0.88],
        [-3.76, 0.43]
      ],
      [
        [-3.63, 0.42],
        [-3.66, 0.84],
        [-3.31, 0.77],
        [-3.24, 0.38]
      ]
    ];
    [-1, 1].forEach((side) => {
      cockpitPanels.forEach((panel, index) => {
        const pane = extrudedPolygon(THREE, panel, 0.045, materials.glass, 0.012);
        const surface = 0.79 + index * 0.075;
        pane.position.z = side > 0 ? surface : -surface - 0.045;
        aircraft.add(pane);
      });
    });

    [-1, 1].forEach((side) => {
      const z = side * 1.325;
      const doorPoints = [
        [-3.18, -0.7, z],
        [-3.18, 0.74, z],
        [-1.48, 0.74, z],
        [-1.48, -0.7, z],
        [-3.18, -0.7, z]
      ];
      const doorGeometry = new THREE.BufferGeometry().setFromPoints(
        doorPoints.map((point) => new THREE.Vector3(...point))
      );
      const doorLine = new THREE.Line(
        doorGeometry,
        new THREE.LineBasicMaterial({ color: 0xe6632b })
      );
      aircraft.add(doorLine);

      const doorHandle = roundedBox(THREE, 0.08, 0.26, 0.035, 0.018, materials.darkMetal);
      doorHandle.position.set(-1.68, -0.05, side * 1.345);
      aircraft.add(doorHandle);
    });

    const landingGear = new THREE.Group();
    landingGear.name = "landing-gear";
    const wheels = [];
    const gearSets = [
      { x: -4.18, y: -1.48, z: 0, count: 2, spread: 0.23 },
      { x: 0.72, y: -1.6, z: -0.84, count: detailLevel === "low" ? 2 : 3, spread: 0.31 },
      { x: 0.72, y: -1.6, z: 0.84, count: detailLevel === "low" ? 2 : 3, spread: 0.31 }
    ];
    gearSets.forEach((set) => {
      landingGear.add(
        tubeBetween(
          THREE,
          [set.x, set.y + 0.82, set.z],
          [set.x, set.y + 0.12, set.z],
          0.055,
          materials.darkMetal,
          10
        )
      );
      for (let index = 0; index < set.count; index += 1) {
        const wheel = createWheel(THREE, materials, 0.29, 0.19);
        wheel.scale.setScalar(0.66);
        wheel.position.set(
          set.x + (index - (set.count - 1) / 2) * set.spread,
          set.y,
          set.z
        );
        landingGear.add(wheel);
        wheels.push(wheel);
      }
    });
    aircraft.add(landingGear);

    [-5.05, 5.05].forEach((z, index) => {
      const light = new THREE.Mesh(
        cachedGeometry("nav-light", () => new THREE.SphereGeometry(0.09, 10, 8)),
        index ? materials.lens : materials.whiteLens
      );
      light.position.set(1.0, 1.0, z);
      aircraft.add(light);
    });

    if (detailLevel !== "low") {
      [-1, 1].forEach((side) => {
        const panelLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-0.75, 0.42, side * 1.34),
            new THREE.Vector3(0.4, 0.48, side * 1.36),
            new THREE.Vector3(1.45, 0.45, side * 1.29)
          ]),
          new THREE.LineBasicMaterial({ color: 0xb9b4aa })
        );
        aircraft.add(panelLine);
      });
    }

    aircraft.userData.fanRotors = fanRotors;
    aircraft.userData.wheels = wheels;
    aircraft.userData.sculptRuntime = {
      pivots: ["root", "fan-rotors", "landing-gear", "tail-surfaces"],
      sockets: ["nose-route", "cargo-door", "wing-pylons"],
      fidelity: "reference-informed procedural"
    };
    aircraft.scale.setScalar(0.7);
    return aircraft;
  }

  function setShadows(root, enabled) {
    root.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = enabled;
      object.receiveShadow = enabled;
    });
  }

  function addRoadEnvironment(THREE, scene, materials, detailLevel) {
    const road = new THREE.Mesh(
      cachedGeometry("road-plane", () => new THREE.PlaneGeometry(8.2, 58)),
      materials.asphalt
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(2.7, -0.01, -8);
    road.receiveShadow = true;
    scene.add(road);

    const shoulderLeft = simpleBox(THREE, 0.25, 0.08, 58, materials.ivoryDark);
    shoulderLeft.position.set(-1.46, 0.03, -8);
    const shoulderRight = shoulderLeft.clone();
    shoulderRight.position.x = 6.86;
    scene.add(shoulderLeft, shoulderRight);

    const dashGeo = cachedGeometry("road-dash", () => new THREE.BoxGeometry(0.09, 0.025, 1.55));
    for (let index = 0; index < 16; index += 1) {
      const dash = new THREE.Mesh(dashGeo, materials.ivory);
      dash.position.set(2.7, 0.04, 16 - index * 3.5);
      scene.add(dash);
    }

    const buildingCount = detailLevel === "low" ? 5 : 9;
    for (let index = 0; index < buildingCount; index += 1) {
      const side = index % 2 ? 1 : -1;
      const width = 2.4 + (index % 3) * 0.6;
      const height = 1.2 + (index % 4) * 0.35;
      const building = roundedBox(THREE, width, height, 3.0, 0.08, index % 3 ? materials.navyDark : materials.navy);
      building.position.set(2.7 + side * (6.5 + (index % 2)), height / 2, 12 - index * 5.4);
      scene.add(building);
      const light = simpleBox(THREE, width * 0.65, 0.05, 0.05, materials.orangeGlow);
      light.position.set(building.position.x, 0.45 + (index % 3) * 0.2, building.position.z + (side > 0 ? -1.51 : 1.51));
      scene.add(light);
    }
  }

  function addPortEnvironment(THREE, scene, materials, detailLevel) {
    const water = new THREE.Mesh(
      cachedGeometry("water-plane", () => new THREE.PlaneGeometry(28, 48, 1, 1)),
      materials.water
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -0.22, -62);
    water.receiveShadow = true;
    scene.add(water);

    const quay = roundedBox(THREE, 7.5, 0.42, 18, 0.06, materials.ground);
    quay.position.set(9.2, 0.05, -57);
    scene.add(quay);

    const waveCount = detailLevel === "low" ? 6 : 14;
    for (let index = 0; index < waveCount; index += 1) {
      const wave = curveTube(
        THREE,
        [
          [-8 + (index % 4) * 4.5, -0.16, -44 - index * 2.4],
          [-4 + (index % 3) * 4, -0.13, -43.6 - index * 2.4],
          [1 + (index % 4) * 3.2, -0.16, -44 - index * 2.4]
        ],
        0.018,
        index % 4 === 0 ? materials.orange : materials.cyan,
        14
      );
      scene.add(wave);
    }

    const craneCount = detailLevel === "low" ? 2 : 4;
    for (let index = 0; index < craneCount; index += 1) {
      const x = 11.8 + index * 1.55;
      const z = -49 - index * 4.6;
      const tower = simpleBox(THREE, 0.22, 4.6, 0.22, materials.ivoryDark);
      tower.position.set(x, 2.4, z);
      scene.add(tower);
      scene.add(
        tubeBetween(
          THREE,
          [x, 4.45, z],
          [x - 2.4, 5.05, z],
          0.07,
          materials.ivoryDark,
          10
        )
      );
      scene.add(
        tubeBetween(
          THREE,
          [x - 2.4, 5.05, z],
          [x - 2.4, 2.25, z],
          0.025,
          materials.darkMetal,
          8
        )
      );
    }
  }

  function addAirEnvironment(THREE, scene, materials, detailLevel) {
    const runway = new THREE.Mesh(
      cachedGeometry("runway-plane", () => new THREE.PlaneGeometry(9, 48)),
      materials.asphalt
    );
    runway.rotation.x = -Math.PI / 2;
    runway.position.set(1.2, 0, -108);
    runway.receiveShadow = true;
    scene.add(runway);

    const stripeGeo = cachedGeometry("runway-stripe", () => new THREE.BoxGeometry(0.13, 0.025, 2.0));
    for (let index = 0; index < 11; index += 1) {
      const stripe = new THREE.Mesh(stripeGeo, materials.ivory);
      stripe.position.set(1.2, 0.04, -88 - index * 3.8);
      scene.add(stripe);
    }

    const lightCount = detailLevel === "low" ? 12 : 24;
    for (let index = 0; index < lightCount; index += 1) {
      const z = -86 - index * 1.8;
      [-3.35, 5.75].forEach((x) => {
        const light = new THREE.Mesh(
          cachedGeometry("runway-light", () => new THREE.SphereGeometry(0.055, 8, 6)),
          index % 4 === 0 ? materials.orangeGlow : materials.cyan
        );
        light.position.set(x, 0.08, z);
        scene.add(light);
      });
    }

    const hangar = roundedBox(THREE, 7.2, 2.9, 5.4, 0.14, materials.navyDark);
    hangar.position.set(-8.5, 1.45, -113);
    scene.add(hangar);
    const hangarDoor = roundedBox(THREE, 5.1, 2.2, 0.08, 0.06, materials.navy);
    hangarDoor.position.set(-8.5, 1.12, -110.27);
    scene.add(hangarDoor);
  }

  function addJourneyGate(THREE, scene, materials) {
    const gate = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(4.2, 0.08, 10, 64),
      materials.orange
    );
    ring.rotation.y = Math.PI / 2;
    ring.position.y = 3.2;
    gate.add(ring);

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.75, 0.025, 8, 48),
      materials.cyan
    );
    innerRing.rotation.y = Math.PI / 2;
    innerRing.position.y = 3.2;
    gate.add(innerRing);

    const plinth = roundedBox(THREE, 8.5, 0.28, 6.0, 0.08, materials.ground);
    gate.add(plinth);
    for (let index = 0; index < 4; index += 1) {
      const marker = roundedBox(THREE, 0.42, 0.42, 0.42, 0.07, index === 3 ? materials.orange : materials.ivory);
      marker.position.set(-2.7 + index * 1.8, 0.36, 0);
      gate.add(marker);
    }
    gate.position.set(0, 0, -141);
    scene.add(gate);
    return gate;
  }

  function createRoute(THREE, materials) {
    const points = [
      new THREE.Vector3(2.7, 0.12, 14),
      new THREE.Vector3(2.7, 0.12, -28),
      new THREE.Vector3(1.2, 0.2, -39),
      new THREE.Vector3(-2.0, 0.44, -50),
      new THREE.Vector3(-1.5, 0.5, -67),
      new THREE.Vector3(1.2, 0.12, -84),
      new THREE.Vector3(1.2, 0.25, -101),
      new THREE.Vector3(1.0, 2.1, -114),
      new THREE.Vector3(0.4, 4.0, -127),
      new THREE.Vector3(0, 0.22, -141)
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 320, 0.045, 7, false);
    const mesh = new THREE.Mesh(geometry, materials.orangeGlow);
    mesh.renderOrder = 4;
    mesh.userData.fullDrawCount = geometry.index ? geometry.index.count : geometry.attributes.position.count;
    mesh.geometry.setDrawRange(0, Math.floor(mesh.userData.fullDrawCount * 0.08));
    return mesh;
  }

  function createWorld(THREE, options) {
    const detailLevel = options && options.detailLevel ? options.detailLevel : "high";
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07111e);
    scene.fog = new THREE.FogExp2(0x07111e, detailLevel === "low" ? 0.021 : 0.018);
    const materials = makeMaterials(THREE);

    const base = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 180),
      materials.ground
    );
    base.rotation.x = -Math.PI / 2;
    base.position.set(0, -0.3, -64);
    base.receiveShadow = true;
    scene.add(base);

    addRoadEnvironment(THREE, scene, materials, detailLevel);
    addPortEnvironment(THREE, scene, materials, detailLevel);
    addAirEnvironment(THREE, scene, materials, detailLevel);
    const journeyGate = addJourneyGate(THREE, scene, materials);

    const truck = createTruck(THREE, materials, detailLevel);
    truck.position.set(2.7, 0.1, 0.8);
    truck.rotation.y = -Math.PI / 2;
    scene.add(truck);

    const ship = createShip(THREE, materials, detailLevel);
    ship.position.set(-1.8, 0.82, -60);
    ship.rotation.y = 0.06;
    scene.add(ship);

    const aircraft = createAircraft(THREE, materials, detailLevel);
    aircraft.position.set(1.0, 2.1, -109);
    aircraft.rotation.y = Math.PI / 2;
    aircraft.rotation.z = -0.025;
    scene.add(aircraft);

    const route = createRoute(THREE, materials);
    scene.add(route);

    setShadows(truck, detailLevel !== "low");
    setShadows(ship, detailLevel !== "low");
    setShadows(aircraft, detailLevel !== "low");
    setShadows(journeyGate, false);

    const hemi = new THREE.HemisphereLight(0xcfe2ec, 0x101722, 1.0);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffedcf, 4.0);
    key.position.set(-10, 15, 14);
    key.castShadow = detailLevel !== "low";
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -18;
    key.shadow.camera.right = 18;
    key.shadow.camera.top = 18;
    key.shadow.camera.bottom = -18;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 52;
    key.shadow.bias = -0.0004;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x8fc8d8, 2.2);
    fill.position.set(11, 7, 4);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xff7a3e, 2.8);
    rim.position.set(4, 8, -14);
    scene.add(rim);

    return {
      scene,
      materials,
      objects: { truck, ship, aircraft, route, journeyGate },
      lights: { key, fill, rim }
    };
  }

  function init(canvas, options) {
    const THREE = window.THREE;
    if (!THREE || !canvas) throw new Error("Three.js or the target canvas is unavailable.");

    const context = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      powerPreference: "high-performance"
    }) || canvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      powerPreference: "high-performance"
    });
    if (!context) throw new Error("WebGL is unavailable.");

    const mobile = window.matchMedia("(max-width: 780px)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      context,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !mobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const world = createWorld(THREE, { detailLevel: mobile ? "low" : "high" });
    const camera = new THREE.PerspectiveCamera(
      mobile ? 46 : 40,
      window.innerWidth / window.innerHeight,
      0.1,
      260
    );
    const target = new THREE.Vector3(1.8, 1.45, -0.8);
    if (mobile) {
      camera.position.set(5.8, 4.4, 13.5);
    } else {
      camera.position.set(9.4, 5.5, 14.2);
    }
    camera.lookAt(target);

    let paused = document.hidden;
    let progress = 0;
    let frame = 0;
    const clock = new THREE.Clock();

    function render() {
      frame = requestAnimationFrame(render);
      if (paused) return;
      const elapsed = clock.getElapsedTime();
      if (!reducedMotion) {
        world.objects.truck.userData.wheels.forEach((wheel) => {
          wheel.rotation.z = -progress * Math.PI * 13;
        });
        world.objects.aircraft.userData.fanRotors.forEach((rotor, index) => {
          rotor.rotation.x = progress * Math.PI * 38 + index * 0.6;
        });
        world.objects.ship.position.y = 0.82 + Math.sin(elapsed * 0.42) * 0.025;
        world.objects.aircraft.position.y = 2.1 + Math.sin(elapsed * 0.58) * 0.035;
        world.objects.journeyGate.rotation.y = Math.sin(elapsed * 0.15) * 0.02;
      }
      camera.lookAt(target);
      renderer.render(world.scene, camera);
    }

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.fov = width <= 780 ? 46 : 40;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
    }

    function setProgress(value) {
      progress = Math.max(0, Math.min(1, value));
      const full = world.objects.route.userData.fullDrawCount;
      const count = Math.max(6, Math.floor(full * (0.08 + progress * 0.92)));
      world.objects.route.geometry.setDrawRange(0, count);
    }

    function setPaused(value) {
      paused = Boolean(value);
      if (!paused) clock.getDelta();
    }

    function dispose() {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    }

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", () => setPaused(document.hidden));
    render();

    return {
      renderer,
      scene: world.scene,
      camera,
      target,
      objects: world.objects,
      setProgress,
      setPaused,
      resize,
      dispose,
      reducedMotion,
      mobile
    };
  }

  window.VelaNorthWorld = {
    init,
    createWorld,
    factories: {
      createTruck,
      createShip,
      createAircraft,
      makeMaterials
    }
  };
})();
