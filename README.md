# 山水拾忆 · Landscape Memories

A real-time Chinese landscape memory experience built with React, Vite, Three.js, React Three Fiber, and a real Xingping DEM.

Live demo: **https://fele-spec.github.io/shan-shui-memories/**

## Features

- Real Xingping DEM terrain (512² heightfield, 288² mesh), DEM-shaped river and triplanar six-surface terrain shader.
- Procedural waterfall, mountain tributary, river rocks, bamboo, pines, river grass and broadleaf forest.
- Six memory objects with two-level interaction:
  - first click: object focus, camera move, local fill light, name and hint;
  - second click / “查看照片”: **access-code dialog**;
  - correct code: gallery;
  - close gallery: return to the focused object;
  - “返回山水”: restore the landscape camera.
- Code is checked in the browser (SHA-256 digest, no visible code text). The original photos are intentionally publishable; this gate keeps them out of the normal click path, not out of direct asset URLs.
- Local IndexedDB photo library:
  - upload, drag/drop, multiple files;
  - JPEG/PNG/WebP/AVIF, max 20 MB each;
  - thumbnail, original Blob, caption, cover, reorder, replace, delete with confirmation;
  - export/import JSON + base64 backup;
  - duplicate handling: skip/replace;
  - persistence after reload, quota checks, Object URL cleanup.

## Important security note

This GitHub Pages build is **static**. The access dialog is a UI gate, not a server-side access-control system. The original photos are intentionally publicly publishable; anyone who knows a direct asset URL can still request it. Do not use this build for genuinely confidential photos.

A real server-side gate exists in the separate local `server/` (Node) and `worker/` (Cloudflare) development files, but those are not part of this static GitHub Pages build.

## Development

```bash
npm ci
npm run dev
npm run build
npm run preview
```

For GitHub Project Pages:

```bash
VITE_BASE=/shan-shui-memories/ npm run build
```

The included workflow builds with `VITE_BASE=/shan-shui-memories/` and deploys `dist`.

## Known limits

The scene is a real-time Three.js scene, not a UE5/Nanite/Lumen render. The focused background uses a CSS backdrop-filter vignette, not optical depth of field. The waterfall, tributary and stone pillars are procedural geometry. The six objects are stylized; Pooh/leopard are photo-fusion standees.

## Credits

See `ASSET_CREDITS.md`.
