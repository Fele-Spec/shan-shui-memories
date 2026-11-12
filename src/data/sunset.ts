export type SunsetPhoto = {
  src: string
  title: string
  place: string
  caption: string
  width: number
  height: number
}

const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

/** All photos: Willian Justen de Vasconcellos, Pexels License. */
export const sunsetPhotos: SunsetPhoto[] = [
  {
    src: asset('assets/sunset/sunset-01.webp'),
    title: '暮色临江',
    place: '桂林 · 漓江',
    caption: '山影沉入江心，最后一束光把水面烫成金色。',
    width: 1333,
    height: 2000,
  },
  {
    src: asset('assets/sunset/sunset-02.webp'),
    title: '江作青罗带',
    place: '桂林 · 漓江',
    caption: '江流绕过群峰，像一条被晚风拉长的青罗带。',
    width: 1333,
    height: 2000,
  },
  {
    src: asset('assets/sunset/sunset-03.webp'),
    title: '群峰鎏金',
    place: '桂林 · 喀斯特峰林',
    caption: '落日把一层薄金敷在峰顶，山的褶皱都温柔起来。',
    width: 1400,
    height: 933,
  },
  {
    src: asset('assets/sunset/sunset-04.webp'),
    title: '万峰藏雾',
    place: '桂林 · 喀斯特峰林',
    caption: '远山一层淡似一层，最后都化进了暮霭里。',
    width: 1400,
    height: 933,
  },
  {
    src: asset('assets/sunset/sunset-05.webp'),
    title: '山衔落日',
    place: '桂林 · 漓江谷地',
    caption: '太阳落进山脊的缺口，天地之间只剩安静。',
    width: 1400,
    height: 933,
  },
]
