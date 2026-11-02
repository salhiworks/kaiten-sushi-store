# Dish photos: provenance, rights and replacement

## Status

**Rights unverified. Replace these photos with ones you own or have licensed before selling real food.**

The eight photos are the ones the 21st.dev *Sushi Conveyor Belt Menu* demo loads from `cdn.21st.dev/assets/mirror/…`. The 21st.dev page labels the component MIT, but that label covers the code only. Nothing states who made the photos or under what terms they may be reused. This repository does not contain them: the store loads them from the 21st.dev demo CDN through its own address, and shows them only to present the component.

## How the photos are served

Dishes only ever point at paths on the store's own address. The original photos use these paths, both in the demo menu (`src/lib/menu/data.ts`) and in the database seed (`supabase/migrations/…_kaiten_seed.sql`):

```
/dishes/<dish-id>.webp
```

`next.config.ts` proxies these paths to the original CDN addresses listed in `src/lib/menu/photo-sources.ts`. They are "afterFiles" rewrites, so a real file in `public/dishes/` with the same name is always served instead. That means:
- The conveyor's shading keeps working. It uses each photo as a CSS mask, and masks only load from the same address (or with CORS headers the CDN doesn't promise).
- Replacing a photo needs no code change: add the file under `public/dishes/` and it takes over. (`.gitignore` keeps `public/dishes/*.webp` out of Git so the original photos are never committed by accident. Remove that rule to commit photos you own.)
- The proxy needs a Node.js server (`next start`) or Vercel.

## Replacing photos in the admin (live stores)

In **Admin → Menu → Edit dish → Replace photo**, upload your own. The admin stores it in the Supabase bucket `dish-images` and the dish points at it from then on. The previous upload is deleted when you save; the original photos above are never touched.

## What makes a good photo

The belt draws each plate from above, so photos look right when they are:
- **square**, at least 800 × 800 px;
- **top-down**, with the plate filling the frame;
- on a **transparent background** (PNG or WebP), so the belt shows around the plate.

JPEG and AVIF are accepted too, up to 5 MB, but without transparency the photo's background appears as a square on the belt.

## Provenance

| Dish | Original source |
| --- | --- |
| Salmon nigiri, Tuna nigiri, Ebi nigiri, California roll, Dragon roll, Tamago nigiri, Salted edamame, Mochi ice cream | The 21st.dev demo of the Sushi Conveyor Belt Menu by DHxWhy; exact addresses in `src/lib/menu/photo-sources.ts` |
