
(() => {
  'use strict';

  // ── Las fases del plan (§2). Fuente única de los tiempos de esta animática. ──
  const FASES = [
    { nombre: 'manubrio', desde: 0.00, hasta: 0.08 },
    { nombre: 'giro',     desde: 0.08, hasta: 0.40 },
    { nombre: 'lateral',  desde: 0.40, hasta: 0.52 },
    { nombre: 'avance',   desde: 0.52, hasta: 0.82 },
    { nombre: 'destino',  desde: 0.82, hasta: 1.00 },
  ];

  const escena = document.getElementById('escena');
  const escenario = document.getElementById('escenario');
  const lienzo = document.getElementById('carrito');
  const ctx = lienzo.getContext('2d');
  const fondos = [...document.querySelectorAll('.fondo')];
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  // Reposo + salto: dentro de cada tramo de movimiento, arranca y llega suave.
  const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const tramo = (p, a, b) => suave(clamp((p - a) / (b - a), 0, 1));

  // ── El carrito, en metros. +z = la nariz, +x = su derecha, +y = arriba. ──
  // Canasta más ancha y alta atrás que adelante, como un carrito real.
  const at = (t) => ({
    z: -0.40 + 0.85 * t,
    a: 0.27 - 0.06 * t,   // medio ancho
    arriba: 0.98 - 0.06 * t,
    abajo: 0.50 - 0.05 * t,
  });

  // Alambre cromado, armazón marino, manubrio crema y tapas rojas. El color real de sus
  // carritos está pendiente de una foto (plan §10): esto es el de marca.
  const ALAMBRE = '#8E92A0', ARMAZON = '#2A3172', MANUBRIO = '#F4EFE4', TAPA = '#B9262B';
  function geometria() {
    const s = []; // [p1, p2, color, grosor en metros]
    const linea = (p, q, c = ALAMBRE, g = 0.006) => s.push([p, q, c, g]);
    // costados: verticales y horizontales
    for (const lado of [-1, 1]) {
      for (let i = 0; i <= 12; i++) {
        const k = at(i / 12);
        linea([lado * k.a, k.abajo, k.z], [lado * k.a, k.arriba, k.z]);
      }
      for (const h of [0, 0.25, 0.5, 0.75, 1]) {
        const k0 = at(0), k1 = at(1);
        linea([lado * k0.a, lerp(k0.abajo, k0.arriba, h), k0.z], [lado * k1.a, lerp(k1.abajo, k1.arriba, h), k1.z], h === 1 ? ARMAZON : ALAMBRE, h === 1 ? 0.014 : 0.006);
      }
    }
    // atrás y adelante
    for (const t of [0, 1]) {
      const k = at(t);
      for (let i = 0; i <= 8; i++) {
        const x = lerp(-k.a, k.a, i / 8);
        linea([x, k.abajo, k.z], [x, k.arriba, k.z]);
      }
      for (const h of [0, 0.33, 0.66, 1]) {
        const y = lerp(k.abajo, k.arriba, h);
        linea([-k.a, y, k.z], [k.a, y, k.z], h === 1 ? ARMAZON : ALAMBRE, h === 1 ? 0.014 : 0.006);
      }
    }
    // fondo de la canasta
    for (let i = 0; i <= 6; i++) {
      const u = i / 6;
      const k0 = at(0), k1 = at(1);
      linea([lerp(-k0.a, k0.a, u), k0.abajo, k0.z], [lerp(-k1.a, k1.a, u), k1.abajo, k1.z]);
    }
    // El asiento abatible de niño, atrás: lo primero que se ve por encima del manubrio.
    for (let i = 0; i <= 6; i++) {
      const x = lerp(-0.20, 0.20, i / 6);
      linea([x, 0.70, -0.31], [x, 0.96, -0.31], ALAMBRE, 0.005);
    }
    for (const y of [0.70, 0.83, 0.96]) linea([-0.20, y, -0.31], [0.20, y, -0.31], ARMAZON, y === 0.96 ? 0.012 : 0.005);
    // Manubrio como en SU banner: barra crema con el rotulado en marino. Las tapas, que en
    // su banner son verdes (del carrito de banco de imágenes), van en el rojo de la marca.
    linea([-0.26, 1.06, -0.52], [0.26, 1.06, -0.52], MANUBRIO, 0.05);
    for (const lado of [-1, 1]) {
      linea([lado * 0.26, 1.06, -0.52], [lado * 0.33, 1.06, -0.52], TAPA, 0.058);
      linea([lado * 0.27, 0.98, -0.40], [lado * 0.30, 1.06, -0.52], ARMAZON, 0.016);
    }
    // chasis y rejilla de abajo
    for (const lado of [-1, 1]) {
      linea([lado * 0.27, 0.50, -0.40], [lado * 0.22, 0.12, -0.36], ARMAZON, 0.016);
      linea([lado * 0.21, 0.45, 0.45], [lado * 0.20, 0.12, 0.42], ARMAZON, 0.016);
      linea([lado * 0.22, 0.12, -0.36], [lado * 0.20, 0.12, 0.42], ARMAZON, 0.016);
    }
    linea([-0.22, 0.12, -0.36], [0.22, 0.12, -0.36], ARMAZON, 0.016);
    linea([-0.20, 0.12, 0.42], [0.20, 0.12, 0.42], ARMAZON, 0.016);
    for (let i = 1; i <= 6; i++) {
      const t = i / 7;
      linea([-0.21, 0.14, lerp(-0.36, 0.42, t)], [0.21, 0.14, lerp(-0.36, 0.42, t)], ALAMBRE, 0.005);
    }
    for (const x of [-0.10, 0, 0.10]) linea([x, 0.14, -0.36], [x, 0.14, 0.42], ALAMBRE, 0.005);
    // Horquillas de las llantas: del chasis al eje.
    for (const [x, z] of [[-0.22, -0.36], [0.22, -0.36], [-0.20, 0.42], [0.20, 0.42]]) {
      linea([x, 0.12, z], [x, 0.06, z], ARMAZON, 0.014);
    }
    return s;
  }
  const SEGMENTOS = geometria();
  const RUEDAS = [[-0.22, -0.36], [0.22, -0.36], [-0.20, 0.42], [0.20, 0.42]];
  const R_RUEDA = 0.06;

  // ── Lo que cae al carrito mientras dobla (plan §2b) ──
  // Un producto por departamento REAL (src/data/pasillos.ts), en el orden de sus pasillos;
  // el último, de Ferretería: #LaVictoriaLoTiene, hasta el martillo. Empaques lisos en
  // tintas de marca: ni marcas inventadas ni texto que se lea como dato del negocio.
  const CAIDA = 0.065;   // cuánto avance dura cada caída
  const ALTURA = 1.6;    // desde cuántos metros sobre su lugar cae
  const caja = (tam, color, d = [0, 0, 0]) => ({ tipo: 'caja', tam, color, d });
  const bola = (r, color, d) => ({ tipo: 'bola', r, color, d });
  const PRODUCTOS = [
    { depto: 'Frutas y verduras', desde: 0.12, en: [-0.09, 0.545, 0.26], ry: 0, rz: 0,
      partes: [bola(0.042, '#C62E2E', [-0.03, 0, -0.04]), bola(0.042, '#B9262B', [0.05, 0, 0.01]), bola(0.040, '#D9452F', [-0.01, 0, 0.06])] },
    { depto: 'Abarrotes', desde: 0.15, en: [0.09, 0.56, -0.12], ry: 0.15, rz: 0, partes: [caja([0.20, 0.10, 0.28], '#EADFC6')] },
    { depto: 'Abarrotes', desde: 0.18, en: [-0.11, 0.66, -0.22], ry: 0.25, rz: 0, partes: [caja([0.21, 0.30, 0.07], '#E0B13A')] },
    { depto: 'Lácteos', desde: 0.21, en: [0.13, 0.615, 0.21], ry: 0.4, rz: 0,
      partes: [caja([0.09, 0.21, 0.09], '#F2F0EA'), caja([0.092, 0.03, 0.092], '#2A3172', [0, 0.12, 0])] },
    { depto: 'Salchichonería', desde: 0.24, en: [-0.03, 0.64, 0.06], ry: -0.3, rz: 0.12, partes: [caja([0.17, 0.04, 0.12], '#E7A3A0')] },
    { depto: 'Carnes', desde: 0.27, en: [0.07, 0.68, -0.04], ry: 0.5, rz: -0.08,
      partes: [caja([0.22, 0.04, 0.15], '#F4F2EC'), caja([0.18, 0.03, 0.11], '#A3312E', [0, 0.03, 0])] },
    { depto: 'Pescados y mariscos', desde: 0.30, en: [-0.12, 0.71, 0.13], ry: 0.9, rz: 0.1,
      partes: [caja([0.20, 0.04, 0.14], '#F4F2EC'), caja([0.16, 0.03, 0.10], '#E9805B', [0, 0.03, 0])] },
    { depto: 'Productos orientales', desde: 0.33, en: [0.15, 0.74, -0.18], ry: 0, rz: 0,
      partes: [caja([0.06, 0.18, 0.06], '#5A3A26'), caja([0.03, 0.04, 0.03], '#B9262B', [0, 0.11, 0])] },
    { depto: 'Mascotas y desechables', desde: 0.36, en: [0.02, 0.78, 0.25], ry: -0.2, rz: -0.25, partes: [caja([0.24, 0.16, 0.10], '#2E7D4F')] },
    { depto: 'Ferretería', desde: 0.39, en: [-0.03, 0.90, -0.04], ry: 0.75, rz: Math.PI / 2,
      partes: [caja([0.03, 0.30, 0.03], '#9A6B3F'), caja([0.12, 0.04, 0.04], '#3A3D4A', [0, 0.16, 0])] },
  ];

  // Dónde va un producto en el avance p: arriba sin entrar, cayendo o ya en su lugar.
  function enCaida(prod, p) {
    const u = clamp((p - prod.desde) / CAIDA, 0, 1);
    const caer = clamp(u / 0.82, 0, 1);                 // gravedad: arranca lento y acelera
    const rebote = u > 0.82 ? Math.sin(((u - 0.82) / 0.18) * Math.PI) * 0.035 : 0;
    const vuelta = (1 - caer) * 2.6;                    // da vueltas mientras cae
    return {
      u,
      pos: [prod.en[0], prod.en[1] + ALTURA * (1 - caer * caer) + rebote, prod.en[2]],
      ry: prod.ry + vuelta * 0.8,
      rz: prod.rz + vuelta,
    };
  }
  const rotar = (v, ry, rz) => {
    const cz = Math.cos(rz), sz = Math.sin(rz);
    const x1 = v[0] * cz - v[1] * sz, y1 = v[0] * sz + v[1] * cz;
    const cy = Math.cos(ry), sy = Math.sin(ry);
    return [x1 * cy + v[2] * sy, y1, -x1 * sy + v[2] * cy];
  };
  const CARAS = [ // índices de esquina y normal de cada cara de una caja
    [[1, 3, 7, 5], [1, 0, 0]], [[0, 4, 6, 2], [-1, 0, 0]],
    [[2, 6, 7, 3], [0, 1, 0]], [[0, 1, 5, 4], [0, -1, 0]],
    [[4, 5, 7, 6], [0, 0, 1]], [[0, 2, 3, 1], [0, 0, -1]],
  ];
  const LUZ = (() => { const v = [-0.4, 0.85, -0.45], l = Math.hypot(...v); return v.map((x) => x / l); })();
  const tono = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(Math.min(255, v * f))).join(',')})`;
  };

  // ── Cámara y encuadres, distintos en vertical y en horizontal (plan §3) ──
  function encuadre(ancho, alto) {
    const vertical = ancho / alto < 1;
    return vertical
      ? {
          fov: 62,
          cam0: [0, 1.46, -1.20], mira0: [0, 0.50, 0.90], // manubrio al ~59 % del alto: arriba del directorio 2×2
          cam1: [0, 0.95, -3.90], mira1: [0, 0.55, 0.00],
          pos2: [0.45, 0, 4.4], giro2: 62,
        }
      : {
          fov: 45,
          // Manubrio al ~66 % del alto (arriba del directorio) y a ~60 % del ancho: más cerca,
          // en 16:9 cruzaba casi toda la pantalla y le apretaba el titular (visto a 1366 px).
          cam0: [0, 1.42, -1.18], mira0: [0, 0.62, 0.90],
          cam1: [0, 0.88, -2.90], mira1: [0, 0.52, 0.00],
          pos2: [1.35, 0, 3.4], giro2: 60,
        };
  }

  // p → estado de la escena
  function estado(p, e) {
    const g = tramo(p, 0.08, 0.40);   // el giro
    const a = tramo(p, 0.52, 0.82);   // el avance
    const pos = lerp3([0, 0, 0], e.pos2, a);
    return {
      g, a,
      yaw: lerp(0, 90, g) + lerp(0, e.giro2 - 90, a), // dobla a la derecha y, al avanzar, la nariz entra al pasillo
      cam: lerp3(e.cam0, e.cam1, g),
      mira: lerp3(e.mira0, e.mira1, g),
      pos,
      // Las llantas giran con la DISTANCIA: si el visitante sube, giran al revés.
      rueda: Math.hypot(pos[0], pos[2]) / R_RUEDA,
      letrero: tramo(p, 0.36, 0.46),
    };
  }

  function camara(cam, mira, fov, ancho, alto) {
    const f = norm(sub(mira, cam));
    const r = norm(cruz([0, 1, 0], f));
    const u = cruz(f, r);
    const F = (alto / 2) / Math.tan((fov * Math.PI) / 360);
    return (w) => {
      const d = sub(w, cam);
      const zc = punto(d, f);
      if (zc < 0.05) return null;
      return [ancho / 2 + (punto(d, r) / zc) * F, alto / 2 - (punto(d, u) / zc) * F, zc, F];
    };
  }
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const punto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  // Del carrito al mundo: dobla (yaw, a la derecha visto desde arriba) y se desplaza.
  const alMundo = (pt, yaw, pos) => {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    return [pt[0] * c + pt[2] * s + pos[0], pt[1] + pos[1], -pt[0] * s + pt[2] * c + pos[2]];
  };

  // ── El carrito en 3D sólido si el navegador puede; si no, el de alambre ──
  // El motor recibe la MISMA geometría, los mismos productos y la misma caída: los
  // tiempos y las formas tienen una sola fuente, que es este archivo.
  const lienzo3d = document.getElementById('carrito3d');
  let motor3d = null;

  /*
   * El motor 3D NO se arranca al cargar: interpretarlo y preparar sus reflejos le cuesta a
   * un teléfono justo cuando está pintando la página por primera vez. Arranca cuando ya se
   * mostró —con el navegador desocupado— y entra con un fundido. Mientras tanto se ve el
   * pasillo, el titular y los accesos: la portada completa, sin el carrito.
   * Con movimiento reducido o ahorro de datos ni siquiera se baja: va el de alambre.
   * Si no llega (sin WebGL, sin red), también va el de alambre.
   */
  const ahorro = !!(navigator.connection && navigator.connection.saveData);
  const conAlambre = () => { lienzo3d.style.display = 'none'; lienzo.style.display = ''; pedir(); };
  lienzo.style.display = 'none';

  function arrancarMotor() {
    if (motor3d) return;
    if (!window.Escena3D) { conAlambre(); return; }
    try {
      motor3d = window.Escena3D.crear({
        lienzo: lienzo3d, segmentos: SEGMENTOS, productos: PRODUCTOS, ruedas: RUEDAS, rRueda: R_RUEDA,
        colores: { ALAMBRE, ARMAZON, MANUBRIO, TAPA }, enCaida,
      });
      motor3d.medir(W, H, resolucion3d);
      cuadro();
      requestAnimationFrame(() => lienzo3d.classList.add('listo'));
    } catch (error) {
      motor3d = null;
      conAlambre();
    }
  }

  // Dónde está el motor: incrustado (la animática de un solo archivo) o como archivo
  // aparte (la versión servida en la web, que se baja solo cuando hace falta).
  function cargarMotor() {
    if (window.Escena3D) { arrancarMotor(); return; }
    const fuente = document.querySelector('meta[name="motor-3d"]');
    if (!fuente) { conAlambre(); return; }
    const guion = document.createElement('script');
    guion.src = fuente.content;
    guion.onload = arrancarMotor;
    guion.onerror = conAlambre;
    document.head.appendChild(guion);
  }

  const cuandoDesocupado = (fn) =>
    'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 250);

  // ── Dibujar ──
  let dpr = 1, W = 0, H = 0;
  let foto = null; // la imagen de pasillo que se haya soltado, si hay una
  /*
   * Los dos fondos se guardan a un cuarto de la pantalla y se desenfocan UNA vez con
   * JavaScript (ver `desenfocar`). A esa escala el radio va en píxeles del lienzo: 3 ≈ los
   * 14 px del desenfoque fuerte de antes, 1 ≈ los 4 px del suave.
   */
  const ESCALA_FONDO = 4;
  const RADIOS = [3, 1]; // muy desenfocado, medio desenfocado — en un celular de 390 px
  // …y crecen con la pantalla. Fijos en píxeles, en una PC de 1366 px casi no desenfocaban
  // y el pasillo de muestra se veía tal cual, con sus bloques toscos: en el iPhone se veía
  // bien y en la PC mal (Alejandro, 05-oct-2026). El desenfoque es proporción, no píxeles.
  const ANCHO_DE_REFERENCIA = 390;
  /*
   * La resolución del 3D arranca en la de la pantalla (topada en 1.5 en celular y 2 en
   * escritorio) y BAJA sola si el
   * teléfono no alcanza: el lienzo 3D cubre la pantalla entera, así que cada paso de 0.25
   * le quita al teléfono del orden de un 30 % de píxeles que pintar.
   */
  let resolucion3d = null;
  function medir() {
    dpr = Math.min(devicePixelRatio || 1, matchMedia('(max-width: 700px)').matches ? 1.5 : 2);
    resolucion3d = resolucion3d === null ? dpr : Math.min(resolucion3d, dpr);
    W = escenario.clientWidth; H = escenario.clientHeight;
    lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr);
    for (const c of fondos) {
      c.width = Math.max(8, Math.round(W / ESCALA_FONDO));
      c.height = Math.max(8, Math.round(H / ESCALA_FONDO));
    }
    if (motor3d) motor3d.medir(W, H, resolucion3d);
    pasillo();
  }

  /*
   * El pasillo se dibuja UNA vez a la mitad de la pantalla, se reduce a un cuarto y ahí se
   * desenfoca, una vez por fondo. Se repite solo al cambiar el tamaño o la foto, nunca al
   * hacer scroll. (Estirar desde 1/16 en vez de desenfocar dejaba cuadritos: medido.)
   */
  function pasillo() {
    const base = document.createElement('canvas');
    base.width = Math.max(16, Math.round(W / 2)); base.height = Math.max(16, Math.round(H / 2));
    dibujarPasillo(base);
    fondos.forEach((destino, i) => {
      const g = destino.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(base, 0, 0, destino.width, destino.height);
      desenfocar(destino, Math.max(RADIOS[i], Math.round((RADIOS[i] * W) / ANCHO_DE_REFERENCIA)));
    });
  }

  /*
   * Desenfoque de caja en tres pasadas, que se parece mucho a uno gaussiano. Separado en
   * horizontal y vertical, con una suma que corre: cada píxel cuesta lo mismo sin importar
   * el radio. En un lienzo de un cuarto de pantalla tarda unos milisegundos, una vez.
   */
  function desenfocar(lienzoFondo, radio, pasadas = 3) {
    const g = lienzoFondo.getContext('2d');
    const w = lienzoFondo.width, h = lienzoFondo.height;
    const imagen = g.getImageData(0, 0, w, h);
    const a = imagen.data, b = new Uint8ClampedArray(a.length);
    const caja = (fuente, destino, horizontal) => {
      const largo = horizontal ? w : h, lineas = horizontal ? h : w;
      const paso = horizontal ? 4 : w * 4, salto = horizontal ? w * 4 : 4;
      const div = 2 * radio + 1;
      for (let l = 0; l < lineas; l++) {
        const inicio = l * salto;
        for (let canal = 0; canal < 4; canal++) {
          let suma = 0;
          for (let i = -radio; i <= radio; i++) suma += fuente[inicio + clamp(i, 0, largo - 1) * paso + canal];
          for (let i = 0; i < largo; i++) {
            destino[inicio + i * paso + canal] = suma / div;
            suma += fuente[inicio + Math.min(largo - 1, i + radio + 1) * paso + canal]
              - fuente[inicio + Math.max(0, i - radio) * paso + canal];
          }
        }
      }
    };
    for (let n = 0; n < pasadas; n++) { caja(a, b, true); caja(b, a, false); }
    g.putImageData(imagen, 0, 0);
  }

  // El pasillo de muestra: perspectiva de un punto, anaqueles con producto, piso y luces.
  function dibujarPasillo(c) {
    {
      const g = c.getContext('2d');
      const w = c.width, h = c.height;
      const fx = w * 0.54, fy = h * 0.42;
      if (foto) {
        // Como `object-fit: cover`: llena el lienzo sin deformar. El desenfoque sale de
        // reducirlo, igual que el pasillo dibujado.
        const esc = Math.max(w / foto.width, h / foto.height);
        const fw = foto.width * esc, fh = foto.height * esc;
        g.drawImage(foto, (w - fw) / 2, (h - fh) / 2, fw, fh);
        return;
      }
      g.fillStyle = '#e8e2d6'; g.fillRect(0, 0, w, h);
      // techo y luces
      g.fillStyle = '#f4f0e8'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(fx + w * .04, fy - h * .03); g.lineTo(fx - w * .04, fy - h * .03); g.closePath(); g.fill();
      for (let i = 0; i < 7; i++) {
        const t = Math.pow(i / 7, 1.7);
        g.fillStyle = 'rgba(255,255,255,.95)';
        g.beginPath(); g.ellipse(lerp(w * .5, fx, t), lerp(h * .02, fy - h * .04, t), lerp(w * .12, 4, t), lerp(h * .02, 1, t), 0, 0, Math.PI * 2); g.fill();
      }
      // piso
      g.fillStyle = '#cfc8ba'; g.beginPath(); g.moveTo(0, h); g.lineTo(w, h); g.lineTo(fx + w * .04, fy + h * .03); g.lineTo(fx - w * .04, fy + h * .03); g.closePath(); g.fill();
      // anaqueles a cada lado
      const colores = ['#B9262B', '#2A3172', '#E0B13A', '#2E7D4F', '#98979D', '#D2333A', '#3D4590', '#E8E1D0', '#C46B2D'];
      for (const lado of [-1, 1]) {
        const xb = lado < 0 ? 0 : w;
        for (let nivel = 0; nivel < 6; nivel++) {
          const y0 = lerp(h * .1, h * .92, nivel / 6), y1 = lerp(h * .1, h * .92, (nivel + 1) / 6);
          for (let k = 0; k < 26; k++) {
            const t0 = Math.pow(k / 26, 0.55), t1 = Math.pow((k + 1) / 26, 0.55);
            const xa = lerp(xb, fx + lado * w * .04, t0), xc = lerp(xb, fx + lado * w * .04, t1);
            const ya0 = lerp(y0, fy - h * .03 + (y0 / h) * h * .06, t0), ya1 = lerp(y1, fy - h * .03 + (y1 / h) * h * .06, t0);
            const yc0 = lerp(y0, fy - h * .03 + (y0 / h) * h * .06, t1), yc1 = lerp(y1, fy - h * .03 + (y1 / h) * h * .06, t1);
            g.fillStyle = colores[(k * 7 + nivel * 3 + (lado > 0 ? 4 : 0)) % colores.length];
            g.beginPath(); g.moveTo(xa, ya0 + (ya1 - ya0) * .12); g.lineTo(xc, yc0 + (yc1 - yc0) * .12); g.lineTo(xc, yc1); g.lineTo(xa, ya1); g.closePath(); g.fill();
          }
        }
      }
    }
  }

  /*
   * Escribir una variable de CSS invalida el estilo de toda la escena. Se escribe solo si
   * cambió: en los reposos casi ninguna cambia, y el navegador no recalcula nada.
   */
  const escritas = {};
  const poner = (nombre, valor) => {
    if (escritas[nombre] === valor) return;
    escritas[nombre] = valor;
    escenario.style.setProperty(nombre, valor);
  };

  // `cima` llega ya medida: leer la posición DESPUÉS de escribir estilos obliga al
  // navegador a recalcular todo dos veces en el mismo cuadro.
  function pintar(p, cima = Math.max(0, escena.getBoundingClientRect().top)) {
    const e = encuadre(W, H);
    const s = estado(p, e);

    if (taller) {
      const cayendo = PRODUCTOS.find((prod) => { const u = enCaida(prod, p).u; return u > 0 && u < 1; });
      hudCae.textContent = cayendo ? 'cae: ' + cayendo.depto : '';
    }
    poner('--giro', s.g.toFixed(3));
    // La portada sale en 0.06–0.20: antes de que el manubrio, al doblar, barra su zona.
    poner('--salida', tramo(p, 0.06, 0.20).toFixed(3));
    poner('--letrero', s.letrero.toFixed(3));
    poner('--cima', cima.toFixed(0) + 'px');

    if (motor3d) { motor3d.pintar(s, e, p); return; }
    if (lienzo.style.display === 'none') return; // el 3D todavía no llega: no se dibuja nada

    // ── Respaldo: el carrito de alambre, proyectado a mano ──
    const ver = camara(s.cam, s.mira, e.fov, W, H);
    const yaw = (s.yaw * Math.PI) / 180;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // sombra en el piso
    const centro = ver(alMundo([0, 0, 0.03], yaw, s.pos));
    if (centro) {
      const k = centro[3] / centro[2];
      ctx.fillStyle = 'rgba(30,25,20,.22)';
      ctx.beginPath(); ctx.ellipse(centro[0], centro[1], 0.55 * k, 0.12 * k, 0, 0, Math.PI * 2); ctx.fill();
    }

    // segmentos, del más lejano al más cercano
    const lista = [];
    for (const [a, b, color, grosor] of SEGMENTOS) {
      const pa = ver(alMundo(a, yaw, s.pos)), pb = ver(alMundo(b, yaw, s.pos));
      if (!pa || !pb) continue;
      lista.push({ pa, pb, color, ancho: Math.max(0.8, (grosor * (pa[3] + pb[3])) / (pa[2] + pb[2])), z: pa[2] + pb[2] });
    }
    for (const [x, z] of RUEDAS) {
      const pts = [];
      for (let i = 0; i <= 18; i++) {
        const t = (i / 18) * Math.PI * 2;
        pts.push(ver(alMundo([x, R_RUEDA + Math.sin(t) * R_RUEDA, z + Math.cos(t) * R_RUEDA], yaw, s.pos)));
      }
      if (pts.some((q) => !q)) continue;
      const rayos = [0, Math.PI / 2].map((d) => {
        const t = s.rueda + d;
        return [ver(alMundo([x, R_RUEDA + Math.sin(t) * R_RUEDA, z + Math.cos(t) * R_RUEDA], yaw, s.pos)), ver(alMundo([x, R_RUEDA - Math.sin(t) * R_RUEDA, z - Math.cos(t) * R_RUEDA], yaw, s.pos))];
      });
      lista.push({ rueda: pts, rayos, z: pts[0][2] * 2 });
    }

    // Los productos: caras sombreadas que se ordenan junto con el alambre, así la malla
    // que queda delante de ellos se dibuja encima y se leen DENTRO de la canasta.
    for (const prod of PRODUCTOS) {
      const c = enCaida(prod, p);
      if (c.u <= 0) continue; // todavía no entra: no se dibuja flotando arriba
      for (const parte of prod.partes) {
        if (parte.tipo === 'bola') {
          const centro = alMundo(add(c.pos, rotar(parte.d, c.ry, c.rz)), yaw, s.pos);
          const q = ver(centro);
          if (q) lista.push({ bola: q, r: (parte.r * q[3]) / q[2], color: parte.color, z: q[2] * 2 });
          continue;
        }
        const [w, h, d] = parte.tam;
        const esquinas = [];
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
          const local = add(parte.d, [sx * w / 2, sy * h / 2, sz * d / 2]);
          esquinas.push(alMundo(add(c.pos, rotar(local, c.ry, c.rz)), yaw, s.pos));
        }
        for (const [idx, normal] of CARAS) {
          const nm = alMundo(rotar(normal, c.ry, c.rz), yaw, [0, 0, 0]);
          const medio = idx.reduce((m, i) => add(m, esquinas[i].map((v) => v / 4)), [0, 0, 0]);
          if (punto(nm, sub(s.cam, medio)) <= 0) continue; // cara de espaldas
          const qs = idx.map((i) => ver(esquinas[i]));
          if (qs.some((q) => !q)) continue;
          const luz = 0.62 + 0.5 * Math.max(0, punto(nm, LUZ));
          lista.push({ cara: qs, color: tono(parte.color, luz), borde: tono(parte.color, 0.55), z: qs.reduce((m, q) => m + q[2], 0) / 2 });
        }
      }
    }

    lista.sort((m, n) => n.z - m.z);

    ctx.lineCap = 'round';
    for (const it of lista) {
      if (it.rueda) {
        ctx.fillStyle = '#232741'; ctx.strokeStyle = '#98979D'; ctx.lineWidth = 1.2;
        ctx.beginPath(); it.rueda.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#E4DDD1'; ctx.lineWidth = 1.4;
        for (const [q1, q2] of it.rayos) { if (q1 && q2) { ctx.beginPath(); ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); ctx.stroke(); } }
        continue;
      }
      if (it.cara) {
        ctx.fillStyle = it.color; ctx.strokeStyle = it.borde; ctx.lineWidth = 0.8;
        ctx.beginPath(); it.cara.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.fill(); ctx.stroke();
        continue;
      }
      if (it.bola) {
        ctx.fillStyle = it.color;
        ctx.beginPath(); ctx.arc(it.bola[0], it.bola[1], Math.max(1, it.r), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.45)';
        ctx.beginPath(); ctx.arc(it.bola[0] - it.r * 0.35, it.bola[1] - it.r * 0.35, Math.max(0.5, it.r * 0.28), 0, Math.PI * 2); ctx.fill();
        continue;
      }
      ctx.strokeStyle = it.color; ctx.lineWidth = it.ancho;
      ctx.beginPath(); ctx.moveTo(it.pa[0], it.pa[1]); ctx.lineTo(it.pb[0], it.pb[1]); ctx.stroke();
    }

    // El rotulado del manubrio, como en su banner. Se borra al doblar.
    const visible = Math.pow(Math.max(0, Math.cos(yaw)), 3);
    if (visible > 0.02) {
      const A = ver(alMundo([-0.26, 1.06, -0.52], yaw, s.pos)), B = ver(alMundo([0.26, 1.06, -0.52], yaw, s.pos));
      if (A && B) {
        const largo = Math.hypot(B[0] - A[0], B[1] - A[1]);
        const grueso = (0.05 * (A[3] + B[3])) / (A[2] + B[2]);
        ctx.save();
        ctx.translate((A[0] + B[0]) / 2, (A[1] + B[1]) / 2);
        ctx.rotate(Math.atan2(B[1] - A[1], B[0] - A[0]));
        ctx.globalAlpha = visible;
        // Marino sobre crema y con la ortografía de SU rotulado (con espacios): es su
        // lettering, no el hashtag escrito. El vector real está pendiente (plan §7).
        ctx.fillStyle = '#2A3172';
        ctx.font = `italic 600 ${Math.max(9, Math.min(grueso * 0.7, largo / 10.5))}px Georgia, serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('#La Victoria lo tiene', 0, 1);
        ctx.restore();
      }
    }

  }

  // ── El avance del scroll dentro de la escena ──
  function avance(r = escena.getBoundingClientRect()) {
    const recorrido = escena.offsetHeight - escenario.offsetHeight;
    return recorrido > 0 ? clamp(-r.top / recorrido, 0, 1) : 0;
  }
  const hudCae = document.getElementById('hud-cae');
  const hudP = document.getElementById('hud-p'), hudF = document.getElementById('hud-fase'), hudM = document.getElementById('hud-marca');
  const riel = document.getElementById('hud-riel');
  for (const f of FASES) {
    if (f.nombre === 'giro' || f.nombre === 'avance') {
      const i = document.createElement('i'); i.style.left = f.desde * 100 + '%'; i.style.width = (f.hasta - f.desde) * 100 + '%'; riel.appendChild(i);
    }
  }

  let pendiente = false;
  let taller = false;

  // Si el teléfono no alcanza, el 3D baja su resolución por pasos (ver resolucion3d).
  const intervalos = [];
  let anterior = 0;
  function vigilarRitmo(t) {
    if (anterior && t - anterior < 250) intervalos.push(t - anterior);
    anterior = t;
    if (!motor3d || intervalos.length < 30) return;
    const mediana = [...intervalos].sort((a, b) => a - b)[15];
    intervalos.length = 0;
    if (mediana > 22 && resolucion3d > 1) {          // por debajo de ~45 cuadros por segundo
      resolucion3d = Math.max(1, resolucion3d - 0.25);
      motor3d.medir(W, H, resolucion3d);
    }
  }

  /*
   * Con mouse, la escena ALCANZA al scroll en ~0.1 s en vez de ir pegada a él.
   * Cada muesca de la rueda brinca ~100 px; en una escena de ~1,800 px de recorrido eso es
   * un 5 % por clic, y el carrito avanzaba a saltos. El scroll no se toca —el visitante
   * sigue mandando—: solo el dibujo se pone al día con suavidad.
   * En pantallas táctiles el dedo ya desplaza suave y la escena sigue pegada al scroll,
   * como estaba: en el iPhone se veía bien y no se le cambia nada.
   */
  const conMouse = matchMedia('(pointer: fine)');
  const ALCANCE_MS = 110;
  let pMostrado = null, tAnterior = 0;

  function cuadro(t = performance.now()) {
    pendiente = false;
    vigilarRitmo(t);
    // Primero TODAS las lecturas; luego las escrituras.
    const r = escena.getBoundingClientRect();
    const objetivo = quieto.matches ? 0 : avance(r);
    let p = objetivo;
    if (conMouse.matches && pMostrado !== null) {
      const dt = Math.min(64, t - tAnterior || 16);
      p = pMostrado + (objetivo - pMostrado) * (1 - Math.exp(-dt / ALCANCE_MS));
      if (Math.abs(objetivo - p) < 0.0005) p = objetivo;
    }
    pMostrado = p;
    tAnterior = t;
    const fase = FASES.find((f) => p <= f.hasta) || FASES[FASES.length - 1];
    if (escena.dataset.fase !== fase.nombre) escena.dataset.fase = fase.nombre;
    pintar(p, Math.max(0, r.top));
    if (taller) { hudP.textContent = p.toFixed(2); hudF.textContent = fase.nombre; hudM.style.left = p * 100 + '%'; }
    if (p !== objetivo) pedir(); // sigue alcanzando aunque el scroll ya se haya detenido
  }
  const pedir = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(cuadro); } };

  addEventListener('scroll', pedir, { passive: true });
  addEventListener('resize', () => { medir(); pedir(); });
  quieto.addEventListener('change', () => { medir(); pedir(); });

  document.getElementById('hud-boton').addEventListener('click', (ev) => {
    const hud = document.getElementById('hud');
    hud.classList.toggle('oculto');
    ev.currentTarget.textContent = hud.classList.contains('oculto') ? 'Ver medidor' : 'Ocultar medidor';
  });

  // Modo taller: ?taller en la dirección, o la tecla T.
  if (new URLSearchParams(location.search).has('taller')) document.body.classList.add('taller');
  taller = document.body.classList.contains('taller');
  addEventListener('keydown', (ev) => {
    if (ev.key.toLowerCase() === 't' && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      taller = document.body.classList.toggle('taller');
      pedir();
    }
  });

  // La foto de pasillo: se lee en el navegador y ahí se queda.
  const marca = document.getElementById('marca-muestra');
  function usarFoto(archivo) {
    if (!archivo || !archivo.type.startsWith('image/')) return;
    // Se decodifica directo del archivo, sin crear una URL blob: que la CSP del sitio
    // (img-src 'self') bloquearía al servir la animática desde ahí.
    createImageBitmap(archivo).then((imagen) => {
      foto = imagen;
      pasillo();
      marca.textContent = 'Vista previa · imagen de referencia del pasillo';
    });
  }
  document.getElementById('foto-pasillo').addEventListener('change', (ev) => usarFoto(ev.target.files[0]));
  addEventListener('dragover', (ev) => { ev.preventDefault(); document.body.classList.add('soltando'); });
  addEventListener('dragleave', () => document.body.classList.remove('soltando'));
  addEventListener('drop', (ev) => {
    ev.preventDefault();
    document.body.classList.remove('soltando');
    usarFoto(ev.dataTransfer.files[0]);
  });

  medir();
  cuadro();
  if (quieto.matches || ahorro) {
    conAlambre();
  } else if (document.readyState === 'complete') {
    cuandoDesocupado(cargarMotor);
  } else {
    addEventListener('load', () => cuandoDesocupado(cargarMotor), { once: true });
  }
})();
