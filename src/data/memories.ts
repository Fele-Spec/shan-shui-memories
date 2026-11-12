export type MemoryId = 'pooh' | 'bamboo' | 'pearl' | 'beads' | 'microphone' | 'leopard'

export type MemoryPhoto = {
  src: string
  alt: string
  caption: string
}

export type Memory = {
  id: MemoryId
  name: string
  en: string
  glyph: string
  subtitle: string
  description: string
  quote: string
  /** x / z location; y is resolved from the terrain at runtime. */
  position: [number, number, number]
  rotationY: number
  scale: number
  hitRadius: number
  focusHeight: number
  focusDistance: number
  focusFov?: number
  focusSpeed?: number
  cameraView?: {
    position: [number, number, number]
    target: [number, number, number]
  }
  accent: string
  images: MemoryPhoto[]
}

const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

export const memories: Memory[] = [
  {
    id: 'pooh',
    name: '维尼小熊',
    en: 'THE LITTLE BEAR',
    glyph: '熊',
    subtitle: '陪伴，是记忆里最柔软的黄色',
    description:
      '它坐在临水的石头上，像所有不曾走远的朋友。红色上衣被岁月洗得温暖，蜂蜜罐里装的不是糖，是那些一起笑到很晚的夜晚。',
    quote: '有些陪伴不声不响，却一直在。',
    position: [-18, 0, 26],
    rotationY: 0.34,
    scale: 1.58,
    hitRadius: 2.0,
    focusHeight: 1.55,
    focusDistance: 9.0,
    focusFov: 38,
    focusSpeed: 2.0,
    accent: '#e7bc68',
    images: [
      {
        src: asset('assets/user/pooh/pooh-01.webp'),
        alt: '私人照片未随公开版本发布',
        caption: '照片未随公开版本发布',
      },
      {
        src: asset('assets/user/pooh/pooh-02.webp'),
        alt: '私人照片未随公开版本发布',
        caption: '照片未随公开版本发布',
      },
    ],
  },
  {
    id: 'bamboo',
    name: '竹林',
    en: 'BAMBOO GROVE',
    glyph: '竹',
    subtitle: '风过竹梢，光阴有了声音',
    description:
      '竹子一节一节地长，日子也一节一节地过。站在林下抬头，光被叶子筛成细碎的句子，落在肩上，像有人在轻声说：慢一点。',
    quote: '未出土时先有节，及凌云处尚虚心。',
    position: [-24, 0, 16],
    rotationY: 0.1,
    scale: 1,
    hitRadius: 4.8,
    focusHeight: 2.8,
    focusDistance: 12.0,
    focusFov: 50,
    focusSpeed: 1.7,
    cameraView: { position: [-8, 6, 8], target: [-24, 10, 16] },
    accent: '#82a06f',
    images: [
      {
        src: asset('assets/user/bamboo/bamboo-01.webp'),
        alt: '私人照片未随公开版本发布',
        caption: '照片未随公开版本发布',
      },
      {
        src: asset('assets/user/bamboo/bamboo-02.webp'),
        alt: '私人照片未随公开版本发布',
        caption: '照片未随公开版本发布',
      },
    ],
  },
  {
    id: 'pearl',
    name: '珍珠手链',
    en: 'PEARL BRACELET',
    glyph: '珠',
    subtitle: '温润的光，绕在腕间',
    description:
      '珍珠不是生来就圆润的。它把砂砾一层层包起来，最后成了光。就像某些日子，起初并不明亮，回头看，却泛着柔和的晕。',
    quote: '愿所有磨砺，最后都变成光。',
    position: [18, 0, 26],
    rotationY: -0.55,
    scale: 1.4,
    hitRadius: 1.8,
    focusHeight: 1.15,
    focusDistance: 6.2,
    focusFov: 30,
    focusSpeed: 2.5,
    accent: '#e9ded0',
    images: [
      {
        src: asset('assets/user/pearl/pearl-01.webp'),
        alt: '私人照片未随公开版本发布',
        caption: '照片未随公开版本发布',
      },
      {
        src: asset('assets/user/pearl/pearl-02.webp'),
        alt: '私人照片未随公开版本发布',
        caption: '照片未随公开版本发布',
      },
    ],
  },
  {
    id: 'beads',
    name: '拼豆',
    en: 'PERLER BEADS',
    glyph: '豆',
    subtitle: '一格一格，拼出小小的宇宙',
    description:
      '把颜色一颗一颗放进格子里，狐狸和鹦鹉就慢慢有了轮廓。世界很大，但快乐有时只需要一张板、一把镊子，和一点耐心。',
    quote: '微小的事物，也能拼成完整的光。',
    position: [-6, 0, 28],
    rotationY: 0.18,
    scale: 1.48,
    hitRadius: 1.9,
    focusHeight: 1.35,
    focusDistance: 6.2,
    focusFov: 30,
    focusSpeed: 2.5,
    accent: '#e48a5f',
    images: [
      {
        src: asset('assets/user/beads/beads-01.webp'),
        alt: '私人照片未随公开版本发布',
        caption: '照片未随公开版本发布',
      },
      {
        src: asset('assets/user/beads/beads-02.webp'),
        alt: '私人照片未随公开版本发布',
        caption: '照片未随公开版本发布',
      },
    ],
  },
  {
    id: 'microphone',
    name: '话筒',
    en: 'MICROPHONE',
    glyph: '声',
    subtitle: '把心跳，交给一束光',
    description:
      '舞台的灯亮起来之前，世界很安静。握住话筒的那一刻，所有练习过的句子都变成了自己的声音。勇敢，大概就是明知会紧张，还是往前走一步。',
    quote: '让世界听见，你正在发光。',
    position: [12, 0, 24],
    rotationY: -0.9,
    scale: 1.48,
    hitRadius: 1.6,
    focusHeight: 1.7,
    focusDistance: 9.5,
    focusFov: 38,
    focusSpeed: 2.2,
    accent: '#cf9d5b',
    images: [
      {
        src: asset('assets/user/microphone/microphone-01.webp'),
        alt: '私人照片未随公开版本发布',
        caption: '照片未随公开版本发布',
      },
      {
        src: asset('assets/user/microphone/microphone-02.webp'),
        alt: '私人照片未随公开版本发布',
        caption: '照片未随公开版本发布',
      },
    ],
  },
  {
    id: 'leopard',
    name: '花豹',
    en: 'LEOPARD',
    glyph: '豹',
    subtitle: '把野性与温柔，都留在山间',
    description:
      '它伏在中景的岩石上，斑纹像被夕光揉碎的影子。看似慵懒，耳朵却始终听着风。我们都有这样一面：安静，但从未失去力量。',
    quote: '温柔不是退让，是收起的爪。',
    position: [24, 0, 14],
    rotationY: -0.7,
    scale: 2.15,
    hitRadius: 2.6,
    focusHeight: 1.4,
    focusDistance: 9.5,
    focusFov: 42,
    focusSpeed: 2.0,
    cameraView: { position: [30, 7, 26], target: [24, 5, 14] },
    accent: '#c79455',
    images: [
      {
        src: asset('assets/user/leopard/leopard-01.webp'),
        alt: '私人照片未随公开版本发布',
        caption: '照片未随公开版本发布',
      },
    ],
  },
]

export function getMemory(id: string | null) {
  if (!id) return null
  return memories.find((m) => m.id === id) ?? null
}












