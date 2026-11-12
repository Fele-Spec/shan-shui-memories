import { DEM, demElevationAt, demHeightAt } from './dem'

export const WORLD = {
  xMin: -118,
  xMax: 118,
  zMin: -150,
  zMax: 68,
  segmentsX: 320,
  segmentsZ: 320,
  waterY: DEM.waterY,
}

export function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

export function smoothstep(a: number, b: number, v: number) {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function hash2(x: number, y: number) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

export function noise2(x: number, y: number) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = hash2(ix, iy)
  const b = hash2(ix + 1, iy)
  const c = hash2(ix, iy + 1)
  const d = hash2(ix + 1, iy + 1)
  return mix(mix(a, b, ux), mix(c, d, ux), uy)
}

export function fbm2(x: number, y: number, octaves = 5) {
  let sum = 0
  let amp = 0.5
  let total = 0
  let px = x
  let py = y
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(px, py)
    total += amp
    amp *= 0.5
    px = px * 2.03 + 11.7
    py = py * 2.01 - 7.3
  }
  return sum / total
}

export function ridgedFbm(x: number, y: number, octaves = 5) {
  let sum = 0
  let amp = 0.55
  let total = 0
  let px = x
  let py = y
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise2(px, py) * 2 - 1)
    sum += amp * n * n
    total += amp
    amp *= 0.55
    px = px * 2.07 - 3.1
    py = py * 2.03 + 5.7
  }
  return sum / total
}

/**
 * Real terrain from the Xingping DEM, plus restrained high-frequency erosion
 * detail. The DEM controls the overall ridges and valleys; procedural detail
 * only breaks up the 10 m source resolution near the camera.
 */
export function terrainHeight(x: number, z: number) {
  const base = demHeightAt(x, z)
  const above = base - WORLD.waterY
  const detailMask = smoothstep(1.2, 7.0, above)
  const crag =
    (ridgedFbm(x * 0.17 + 4.2, z * 0.15 - 2.8, 4) - 0.48) * 1.35 +
    (fbm2(x * 0.46 + 9.1, z * 0.42 + 3.3, 3) - 0.5) * 0.38
  const erosion =
    Math.sin(x * 0.08 + z * 0.045 + fbm2(x * 0.05, z * 0.05, 2) * 5.0) *
    0.22 *
    smoothstep(4.0, 18.0, above)
  return base + (crag + erosion) * detailMask
}

export function demElevation(x: number, z: number) {
  return demElevationAt(x, z)
}

export function isWaterAt(x: number, z: number, margin = 0) {
  return demElevationAt(x, z) <= DEM.waterElev + margin
}

export function terrainNormal(x: number, z: number, eps = 0.7) {
  const hL = terrainHeight(x - eps, z)
  const hR = terrainHeight(x + eps, z)
  const hD = terrainHeight(x, z - eps)
  const hU = terrainHeight(x, z + eps)
  const nx = hL - hR
  const nz = hD - hU
  const ny = 2 * eps
  const len = Math.hypot(nx, ny, nz)
  return [nx / len, ny / len, nz / len] as const
}

export function slopeAt(x: number, z: number) {
  const [, ny] = terrainNormal(x, z)
  return 1 - Math.max(0, ny)
}

/** Ground elevation used to sit props on the surface. */
export function groundAt(x: number, z: number, belowWater = false) {
  const h = terrainHeight(x, z)
  if (!belowWater) return Math.max(h, WORLD.waterY + 0.15)
  return h
}

/**
 * Approximate distance from a point to the nearest water sample. Used only
 * during procedural placement (not every frame).
 */
export function distanceToWater(x: number, z: number, maxRadius = 30) {
  if (isWaterAt(x, z)) return 0
  let best = maxRadius
  for (let r = 3; r <= maxRadius; r += 3) {
    for (let a = 0; a < 12; a++) {
      const th = (a / 12) * Math.PI * 2
      if (isWaterAt(x + Math.cos(th) * r, z + Math.sin(th) * r)) {
        best = Math.min(best, r)
      }
    }
  }
  return best
}

/** Kept for older imports; the river is now defined by DEM low ground. */
export function riverCenterX(z: number) {
  return Math.sin(z * 0.02) * 12
}

export function riverWidth(z: number) {
  return 12 + Math.sin(z * 0.07) * 2
}

export { DEM }

