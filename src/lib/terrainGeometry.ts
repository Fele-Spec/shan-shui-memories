import * as THREE from 'three'
import { WORLD, DEM, fbm2, smoothstep, terrainHeight, terrainNormal } from './terrain'

const C = {
  limestone: new THREE.Color('#8f8b7c'),
  limestoneLight: new THREE.Color('#a8a492'),
  weathered: new THREE.Color('#6f7061'),
  weatheredDark: new THREE.Color('#464d45'),
  moss: new THREE.Color('#59694d'),
  grass: new THREE.Color('#59684b'),
  grassDry: new THREE.Color('#6c7052'),
  soil: new THREE.Color('#6c5d47'),
  wetRock: new THREE.Color('#44524b'),
  riverbed: new THREE.Color('#4f5547'),
}

/**
 * Build the DEM-driven terrain mesh. The real Xingping heightfield controls
 * the large forms; vertex colours carry the six-way surface blend
 * (limestone, weathered rock, moss, soil, grass, wet rock).
 */
export function buildTerrainGeometry() {
  const nx = WORLD.segmentsX + 1
  const nz = WORLD.segmentsZ + 1
  const count = nx * nz
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const uvs = new Float32Array(count * 2)
  const rockAttr = new Float32Array(count)
  const indices = new Uint32Array(WORLD.segmentsX * WORLD.segmentsZ * 6)

  const tmp = new THREE.Color()
  let p = 0
  let u = 0
  let vi = 0

  for (let iz = 0; iz < nz; iz++) {
    const z = WORLD.zMin + (iz / WORLD.segmentsZ) * (WORLD.zMax - WORLD.zMin)
    for (let ix = 0; ix < nx; ix++) {
      const x = WORLD.xMin + (ix / WORLD.segmentsX) * (WORLD.xMax - WORLD.xMin)
      const y = terrainHeight(x, z)
      positions[p] = x
      positions[p + 1] = y
      positions[p + 2] = z
      uvs[u] = (x - WORLD.xMin) / (WORLD.xMax - WORLD.xMin)
      uvs[u + 1] = (z - WORLD.zMin) / (WORLD.zMax - WORLD.zMin)

      const n = terrainNormal(x, z, 1.2)
      const slope = 1 - n[1]
      const moisture = fbm2(x * 0.12 + 30, z * 0.11 - 10, 4)
      const grain = fbm2(x * 0.55, z * 0.52, 3)
      const strata = 0.5 + 0.5 * Math.sin(y * 1.15 + fbm2(x * 0.08, z * 0.08, 3) * 6)
      const gully = fbm2(x * 0.42 + 7, z * 0.055 - 3, 3)
      const wet = 1 - smoothstep(WORLD.waterY + 0.25, WORLD.waterY + 2.1, y)
      const above = y - WORLD.waterY
      const relief =
        y -
        (terrainHeight(x + 1.8, z) +
          terrainHeight(x - 1.8, z) +
          terrainHeight(x, z + 1.8) +
          terrainHeight(x, z - 1.8)) /
          4
      const cavity = THREE.MathUtils.clamp(0.9 + relief * 0.055, 0.68, 1.04)

      const rockAmount = THREE.MathUtils.clamp(
        smoothstep(0.2, 0.58, slope) * 1.12 +
          smoothstep(16, 38, above) * 0.74 +
          smoothstep(0.58, 0.85, grain) * 0.12,
        0,
        1
      )
      const mossAmount = smoothstep(0.38, 0.82, moisture) * (1 - rockAmount * 0.75) * (0.35 + wet * 0.5)
      const soilAmount = (1 - rockAmount) * smoothstep(0.56, 0.82, grain) * 0.5
      const dryGrass = smoothstep(0.45, 0.75, fbm2(x * 0.07, z * 0.06, 3)) * (1 - rockAmount) * 0.55

      // Grass -> dry grass -> moss -> soil.
      tmp.copy(C.grass).lerp(C.grassDry, dryGrass)
      tmp.lerp(C.moss, mossAmount * 0.75)
      tmp.lerp(C.soil, soilAmount * 0.7)

      // Rock family: weathered rock low, pale limestone on exposed faces.
      tmp.lerp(C.weathered, rockAmount * 0.8)
      tmp.lerp(C.limestone, rockAmount * smoothstep(0.5, 0.9, strata) * 0.55)
      tmp.lerp(C.limestoneLight, rockAmount * smoothstep(30, 48, above) * 0.3)
      tmp.lerp(C.weatheredDark, rockAmount * smoothstep(0.6, 1.0, slope) * 0.38)

      // Wet rock and riverbed at the waterline.
      tmp.lerp(C.wetRock, wet * 0.75)
      tmp.lerp(C.riverbed, wet * smoothstep(WORLD.waterY + 0.45, WORLD.waterY - 1.8, y) * 0.72)

      const gullyShade = 0.88 + gully * 0.16
      const shade = (0.92 + grain * 0.12) * cavity * gullyShade * (1 - wet * 0.06)
      colors[p] = tmp.r * shade
      colors[p + 1] = tmp.g * shade
      colors[p + 2] = tmp.b * shade
      rockAttr[vi] = rockAmount
      p += 3
      u += 2
      vi += 1
    }
  }

  let k = 0
  for (let iz = 0; iz < WORLD.segmentsZ; iz++) {
    for (let ix = 0; ix < WORLD.segmentsX; ix++) {
      const a = iz * nx + ix
      const b = a + 1
      const c = a + nx
      const d = c + 1
      indices[k++] = a
      indices[k++] = c
      indices[k++] = b
      indices[k++] = b
      indices[k++] = c
      indices[k++] = d
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.setAttribute('aRock', new THREE.BufferAttribute(rockAttr, 1))
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geo.setIndex(new THREE.BufferAttribute(indices, 1))
  geo.computeVertexNormals()
  geo.computeBoundingSphere()
  return geo
}

export { DEM }


