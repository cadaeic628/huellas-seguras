// Similitud de imágenes SIN IA.
//
// Combinamos dos señales clásicas de computer vision:
//
//   1) dHash 16x16 (256 bits): hash perceptual estructural en luminancia.
//      Captura "qué bordes hay y dónde". Robusto a cambios de brillo/escala.
//
//   2) Histograma HSV con peso gaussiano al centro (22 bins).
//      Captura "de qué color es el sujeto". Como el sujeto del animal suele
//      estar centrado en la foto, pesamos los píxeles centrales mucho más
//      que los del fondo. Distinguimos grises puros (negro/gris/blanco) de
//      colores saturados con bins separados, así un perro negro NO termina
//      pareciéndose a un gato blanco solo porque ambos son grayscale.
//
// La similitud final = 0.60 * (cosine de histogramas) + 0.40 * (1 - hamming/256).
// El color pesa más porque es lo más discriminativo entre perro negro / gato
// blanco / gato tabby naranja.

import * as ImageManipulator from 'expo-image-manipulator';
import UPNG from 'upng-js';
import { Platform } from 'react-native';

// ----- Parámetros del fingerprint -----
const N = 16;                              // 16x16 píxeles
const TOTAL_HASH_BITS = (N - 1) * N;       // 240 diferencias horizontales = 240 bits
const TOTAL_HASH_BYTES = Math.ceil(TOTAL_HASH_BITS / 8); // 30 bytes

// Histograma híbrido: grises por V + colores por H×S
const GRAY_BINS = 4;                       // muy oscuro, oscuro, claro, muy claro
const HIST_H = 6;                          // 6 hues
const HIST_S = 3;                          // 3 niveles de saturación
const HIST_BINS = GRAY_BINS + HIST_H * HIST_S; // 4 + 18 = 22 bins
const SAT_THRESHOLD = 0.22;                // bajo esto, el píxel es "grayscale"
// Si V es muy bajo, la saturación HSV explota numéricamente aunque el píxel
// sea visualmente negro (ej. RGB 12,10,8 da S=0.33). Por eso, además del
// umbral de S, tratamos como grayscale a cualquier píxel con V < V_DARK.
const V_DARK = 0.18;

// Cuánto pesa el centro (en σ relativo al tamaño). Más pequeño = más enfocado al centro.
// 0.30 ≈ el sujeto pesa ~10× más que las esquinas del fondo.
const CENTER_SIGMA = 0.30;

// Pesos finales: color discrimina más entre especies/razas que la estructura.
const W_COLOR = 0.6;
const W_STRUCT = 0.4;

const LOAD_TIMEOUT_MS = 8000;

// Caché de fingerprints por URI. Evita recomputar para el mismo URI.
const fpCache = new Map();

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Timeout (${ms}ms) ${label || ''}`.trim())),
      ms
    );
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

function base64ToUint8(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ----- Lectura de píxeles (cross-platform) -----

async function getSmallRGBA(uri) {
  if (Platform.OS === 'web') {
    return withTimeout(getSmallRGBAWeb(uri), LOAD_TIMEOUT_MS, uri);
  }
  const result = await withTimeout(
    ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: N, height: N } }],
      {
        base64: true,
        compress: 1,
        format: ImageManipulator.SaveFormat.PNG,
      }
    ),
    LOAD_TIMEOUT_MS,
    uri
  );
  const bytes = base64ToUint8(result.base64);
  const png = UPNG.decode(bytes.buffer);
  const rgba = new Uint8Array(UPNG.toRGBA8(png)[0]);
  return { width: png.width, height: png.height, data: rgba };
}

function getSmallRGBAWeb(uri) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        // Recortamos al cuadrado central antes de reescalar: así la foto
        // del usuario (típicamente 3:4 o 4:3) no se deforma respecto a las
        // del catálogo que ya son 1:1.
        const minSide = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - minSide) / 2;
        const sy = (img.naturalHeight - minSide) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = N;
        canvas.height = N;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, N, N);
        const imgData = ctx.getImageData(0, 0, N, N);
        resolve({ width: N, height: N, data: imgData.data });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen: ' + uri));
    img.src = uri;
  });
}

// ----- Color: RGB → HSV y binning híbrido -----

function rgbToHsv(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
    if (h < 0) h += 1;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max]; // h,s,v en [0,1]
}

function getBin(h, s, v) {
  if (v < V_DARK || s < SAT_THRESHOLD) {
    // Píxel grayscale (o demasiado oscuro para tener un matiz fiable):
    // bin según luminancia. Así negro / blanco quedan en bins distintos
    // en lugar de mezclarse con colores reales.
    return Math.min(GRAY_BINS - 1, Math.floor(v * GRAY_BINS));
  }
  const hBin = Math.min(HIST_H - 1, Math.floor(h * HIST_H));
  const sNorm = (s - SAT_THRESHOLD) / (1 - SAT_THRESHOLD);
  const sBin = Math.min(HIST_S - 1, Math.floor(sNorm * HIST_S));
  return GRAY_BINS + hBin * HIST_S + sBin;
}

// ----- Cálculo del fingerprint -----

function computeFingerprint(rgba) {
  const w = rgba.width;
  const h = rgba.height;
  const data = rgba.data;

  // Luminancia para dHash.
  const gray = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    gray[i] =
      (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) | 0;
  }

  // dHash: comparar cada píxel con su vecino derecho.
  const hashBits = new Uint8Array(TOTAL_HASH_BYTES);
  let bit = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w - 1; x++) {
      if (gray[y * w + x] > gray[y * w + x + 1]) {
        hashBits[bit >> 3] |= 1 << (bit & 7);
      }
      bit++;
    }
  }

  // Histograma HSV con peso gaussiano centrado.
  const hist = new Float32Array(HIST_BINS);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const sigma = w * CENTER_SIGMA;
  const inv2s2 = 1 / (2 * sigma * sigma);
  let total = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx] / 255;
      const g = data[idx + 1] / 255;
      const b = data[idx + 2] / 255;
      const [hue, sat, val] = rgbToHsv(r, g, b);
      const dx = x - cx;
      const dy = y - cy;
      const wt = Math.exp(-(dx * dx + dy * dy) * inv2s2);
      hist[getBin(hue, sat, val)] += wt;
      total += wt;
    }
  }
  if (total > 0) {
    for (let i = 0; i < HIST_BINS; i++) hist[i] /= total;
  }

  return { hashBits, hist };
}

// ----- Comparación -----

const POPCOUNT = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  let c = 0;
  let v = i;
  while (v) {
    c += v & 1;
    v >>= 1;
  }
  POPCOUNT[i] = c;
}

function hammingBits(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) d += POPCOUNT[a[i] ^ b[i]];
  return d;
}

function cosineSim(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na * nb);
  return denom === 0 ? 0 : dot / denom;
}

function fingerprintSimilarity(a, b) {
  if (!a || !b) return 0;
  const hashSim = 1 - hammingBits(a.hashBits, b.hashBits) / TOTAL_HASH_BITS;
  const histSim = cosineSim(a.hist, b.hist);
  const sim = W_COLOR * histSim + W_STRUCT * hashSim;
  return Math.max(0, Math.min(1, sim));
}

// ----- API pública (sin cambios para la pantalla) -----

export async function computeHash(uri) {
  if (!uri) return null;
  if (fpCache.has(uri)) return fpCache.get(uri);
  try {
    const rgba = await getSmallRGBA(uri);
    const fp = computeFingerprint(rgba);
    fpCache.set(uri, fp);
    return fp;
  } catch (e) {
    console.warn('[imageSimilarity] No se pudo procesar', uri, e?.message || e);
    return null;
  }
}

export async function precomputeCatalogHashes(animals) {
  await Promise.all(
    animals.map(async (a) => {
      await computeHash(a.foto);
    })
  );
}

export function rankBySimilarity(animals, targetFp, topN = 3) {
  if (!targetFp) return [];
  const scored = animals
    .map((animal) => {
      const fp = fpCache.get(animal.foto);
      if (!fp) return null;
      const similarity = fingerprintSimilarity(targetFp, fp);
      return { animal, similarity, distance: 1 - similarity };
    })
    .filter(Boolean);
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topN);
}
