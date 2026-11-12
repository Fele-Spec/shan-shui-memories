/**
 * Real DEM loader — Xingping / Yangshuo, Guilin.
 *
 * Source: AWS Terrain Tiles (Terrarium), zoom 14, 4×4 tiles around
 * 24.936 N, 110.532 E, decoded and cropped to 5.2 km, then resampled to 512².
 * The binary stores quantised elevation in metres (80–520 m).
 */
export const DEM = {
  width: 512,
  height: 512,
  xMin: -118,
  xMax: 118,
  zMin: -150,
  zMax: 68,
  elevMin: 80,
  elevMax: 520,
  waterElev: 116,
  /** world units per metre of real elevation (vertical exaggeration ≈ 5×) */
  verticalScale: 0.16,
  waterY: 0.34,
}

let elevations: Float32Array | null = null
let loading: Promise<void> | null = null

export function isDEMReady() {
  return elevations !== null
}

export async function loadDEM() {
  if (elevations) return
  if (loading) return loading
  loading = (async () => {
    const url = `${import.meta.env.BASE_URL}assets/dem/xingping_crop512_u16.bin`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`DEM load failed: ${res.status}`)
    const buf = await res.arrayBuffer()
    const u16 = new Uint16Array(buf)
    if (u16.length !== DEM.width * DEM.height) {
      throw new Error(`DEM size mismatch: ${u16.length}`)
    }
    const out = new Float32Array(u16.length)
    const range = DEM.elevMax - DEM.elevMin
    for (let i = 0; i < u16.length; i++) {
      out[i] = DEM.elevMin + (u16[i] / 65535) * range
    }
    elevations = out
  })()
  await loading
}

function clampIndex(v: number, max: number) {
  return Math.max(0, Math.min(max, v))
}

/** Bilinear elevation in metres at a world XZ position. */
export function demElevationAt(x: number, z: number) {
  if (!elevations) return DEM.waterElev + 2
  const u = ((x - DEM.xMin) / (DEM.xMax - DEM.xMin)) * (DEM.width - 1)
  const v = ((z - DEM.zMin) / (DEM.zMax - DEM.zMin)) * (DEM.height - 1)
  const x0 = Math.floor(u)
  const y0 = Math.floor(v)
  const x1 = clampIndex(x0 + 1, DEM.width - 1)
  const y1 = clampIndex(y0 + 1, DEM.height - 1)
  const fx = u - x0
  const fy = v - y0
  const a = elevations[clampIndex(y0, DEM.height - 1) * DEM.width + clampIndex(x0, DEM.width - 1)]
  const b = elevations[clampIndex(y0, DEM.height - 1) * DEM.width + x1]
  const c = elevations[y1 * DEM.width + clampIndex(x0, DEM.width - 1)]
  const d = elevations[y1 * DEM.width + x1]
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
}

/** Real DEM elevation mapped into scene units. Water surface sits at 0.34. */
export function demHeightAt(x: number, z: number) {
  return DEM.waterY + (demElevationAt(x, z) - DEM.waterElev) * DEM.verticalScale
}

export function demDistanceToWater(x: number, z: number) {
  // Cheap local probe used only at load time for vegetation placement.
  const h = demElevationAt(x, z)
  return Math.max(0, (h - DEM.waterElev) * DEM.verticalScale)
}

