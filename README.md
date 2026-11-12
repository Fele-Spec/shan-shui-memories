# 山水拾忆 · Landscape Memories — Public Demo

A real-time Chinese landscape memory experience built with React, Vite, Three.js, React Three Fiber, and a real Xingping DEM.

This repository is the **public code-only edition**. Personal photographs, family/friend portraits, and the private character/animal reference cutouts used in the local edition are **not included**. The built-in gallery images in this repository are neutral “private photo not included” placeholders. Visitors can add their own photos locally; no photo is uploaded to a server.

Live demo (after GitHub Pages deployment):

`https://fele-spec.github.io/shan-shui-memories/`

## What is included

- Real Xingping DEM terrain (512² heightfield, 288² mesh), DEM-shaped river, triplanar six-surface terrain shader.
- Procedural waterfall, mountain tributary, river rocks, bamboo, pines, river grass, broadleaf forest.
- Six memory objects with two-level interaction:
  - first click: object focus, camera move, local fill light, background vignette, name and hint;
  - second click / “查看照片”: gallery;
  - close gallery: return to the focused object;
  - “返回山水”: restore the landscape camera.
- Keyboard/ESC stacking for upload → gallery/lightbox → focus → sunset.
- Local IndexedDB photo library:
  - upload, drag/drop, multiple files;
  - JPEG/PNG/WebP/AVIF, max 20 MB each;
  - thumbnail, original Blob, caption, cover, reorder, replace, delete with confirmation;
  - export/import JSON + base64 backup;
  - duplicate handling: skip/replace;
  - persistence after reload, quota checks, Object URL cleanup.

## Privacy / rights

- No personal photos are part of this repository or its build.
- The six gallery entries use generated neutral placeholders.
- The Pooh/leopard stand-ins are neutral “private image not included” plaques, not the private reference artwork.
- Landscape photos under `public/assets/sunset` are third-party stock images under their respective licenses; see `ASSET_CREDITS.md`.
- Uploaded photos remain in the visitor’s browser IndexedDB. The site has no photo server.

If you are the owner of the private edition and want to publish personal photos, do not push them to this public repository. Use a private repository or a separately access-controlled deployment after confirming portrait/IP rights.

## Development

```bash
npm ci
npm run dev
npm run build
npm run preview
```

For a GitHub Project Pages build, set the base path:

```bash
VITE_BASE=/shan-shui-memories/ npm run build
```

The included workflow builds with `VITE_BASE=/shan-shui-memories/` and deploys `dist` to GitHub Pages.

## Lighthouse / limits

This is a real-time Three.js scene, not a UE5/Nanite/Lumen render. The focused background uses a CSS backdrop-filter vignette, not optical depth of field. The waterfall, tributary, and stone pillars are procedural geometry. The public demo’s built-in photos are placeholders, so its galleries intentionally look sparse until a visitor uploads photos.

## Credits

See `ASSET_CREDITS.md` for DEM, Poly Haven CC0 textures/models, Pexels landscape photos, and the original project.
