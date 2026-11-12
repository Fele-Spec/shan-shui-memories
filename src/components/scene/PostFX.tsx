import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useThree } from '@react-three/fiber'
import { useExperience } from '../../store/useExperience'

export function PostFX() {
  const { size } = useThree()
  const quality = useExperience((s) => s.quality)
  const mobile = size.width < 760

  return (
    <EffectComposer multisampling={mobile || quality !== 'high' ? 0 : 2} enableNormalPass={false}>
      <Bloom
        mipmapBlur
        intensity={quality === 'low' ? 0 : mobile ? 0.26 : 0.34}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.28}
        radius={0.62}
      />
      <Vignette eskil={false} offset={0.2} darkness={0.48} />
      <Noise
        premultiply
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={quality === 'high' ? 0.022 : 0}
      />
    </EffectComposer>
  )
}
