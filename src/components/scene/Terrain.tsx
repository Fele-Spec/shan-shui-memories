import { useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { buildTerrainGeometry } from '../../lib/terrainGeometry'
import { visualState } from '../../lib/visualState'
import { useExperience } from '../../store/useExperience'

const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

export function Terrain() {
  const geo = useMemo(() => buildTerrainGeometry(), [])
  const [normal, cliff, ground] = useTexture([
    asset('assets/textures/cliff/cliff_side_nor_gl_1k.jpg'),
    asset('assets/textures/cliff/cliff_side_diff_1k.jpg'),
    asset('assets/textures/ground/forest_ground_diff_1k.jpg'),
  ])
  const { gl } = useThree()
  const mat = useRef<THREE.MeshLambertMaterial>(null)
  const enterSunset = useExperience((s) => s.enterSunset)
  const sunsetMode = useExperience((s) => s.sunsetMode)
  const locked = useExperience((s) => s.interactionLocked)

  const maps = useMemo(() => {
    const maxAniso = Math.min(8, gl.capabilities.getMaxAnisotropy())
    const n = normal.clone()
    n.wrapS = n.wrapT = THREE.RepeatWrapping
    n.repeat.set(34, 38)
    n.anisotropy = maxAniso
    n.colorSpace = THREE.NoColorSpace
    n.needsUpdate = true
    const c = cliff.clone()
    c.wrapS = c.wrapT = THREE.RepeatWrapping
    c.colorSpace = THREE.SRGBColorSpace
    c.anisotropy = maxAniso
    c.needsUpdate = true
    const g = ground.clone()
    g.wrapS = g.wrapT = THREE.RepeatWrapping
    g.colorSpace = THREE.SRGBColorSpace
    g.anisotropy = maxAniso
    g.needsUpdate = true
    return { n, c, g }
  }, [normal, cliff, ground, gl])

  const customize = useMemo(
    () => (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uCliffMap = { value: maps.c }
      shader.uniforms.uGroundMap = { value: maps.g }
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          attribute float aRock;
          varying float vRock;
          varying vec3 vTerrainWorld;
          varying vec3 vTerrainNormal;`
        )
        .replace(
          '#include <beginnormal_vertex>',
          `#include <beginnormal_vertex>
          vTerrainNormal = normalize(mat3(modelMatrix) * objectNormal);`
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vTerrainWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
          vRock = aRock;`
        )
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform sampler2D uCliffMap;
          uniform sampler2D uGroundMap;
          varying float vRock;
          varying vec3 vTerrainWorld;
          varying vec3 vTerrainNormal;
          vec3 triTexture(sampler2D tex, vec3 p, vec3 n, float scale) {
            vec3 w = pow(abs(n), vec3(4.0));
            w /= max(w.x + w.y + w.z, 0.0001);
            vec3 x = texture2D(tex, p.zy * scale).rgb;
            vec3 y = texture2D(tex, p.xz * scale).rgb;
            vec3 z = texture2D(tex, p.xy * scale).rgb;
            return x * w.x + y * w.y + z * w.z;
          }`
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          vec3 nrm = normalize(vTerrainNormal);
          float rockMask = smoothstep(0.12, 0.7, vRock);
          vec3 cliffDetail = triTexture(uCliffMap, vTerrainWorld, nrm, 0.11);
          vec3 groundDetail = triTexture(uGroundMap, vTerrainWorld, nrm, 0.24);
          float cliffLum = dot(cliffDetail, vec3(0.333));
          vec3 cliffTint = vec3(cliffLum) * vec3(1.0, 1.01, 0.96) * 1.85;
          float groundLum = dot(groundDetail, vec3(0.333));
          vec3 groundTint = vec3(groundLum) * vec3(0.9, 1.0, 0.91) * 1.55;
          vec3 detail = mix(groundTint, cliffTint, rockMask);
          diffuseColor.rgb *= mix(vec3(1.0), detail, 0.66);
          // Fresh limestone scars and damp dark seams on the steep faces.
          float seam = smoothstep(0.48, 0.9, cliffLum + vRock * 0.15);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.46, 0.45, 0.4), rockMask * seam * 0.22);`
        )
    },
    [maps.c]
  )

  useFrame(() => {
    if (!mat.current) return
    const t = visualState.sunset
    // A cooler, deeper base tint keeps the terrain from reading as sand under
    // the strong key light; dusk pushes it toward umber.
    mat.current.color.setRGB(
      THREE.MathUtils.lerp(0.98, 0.92, t),
      THREE.MathUtils.lerp(0.96, 0.78, t),
      THREE.MathUtils.lerp(0.9, 0.66, t)
    )
  })

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (sunsetMode || locked) return
    enterSunset()
  }

  return (
    <mesh
      geometry={geo}
      receiveShadow
      castShadow
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        if (!sunsetMode && !locked) document.body.style.cursor = 'crosshair'
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
    >
      <meshLambertMaterial
        ref={mat}
        normalMap={maps.n}
        normalScale={new THREE.Vector2(0.9, 0.9)}
        vertexColors
        dithering
        onBeforeCompile={customize}
        customProgramCacheKey={() => 'terrain-dem-splat-v4'}
      />
    </mesh>
  )
}




