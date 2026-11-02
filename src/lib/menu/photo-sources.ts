/*
 * Where each original dish photo comes from, until photos you own replace it (see docs/ASSETS.md).
 *
 * The menu always points at the store's own paths, /dishes/<id>.webp. next.config.ts proxies those paths to the original
 * 21st.dev demo photos below, unless a file with the same name exists in public/dishes/: public files are served first, so a
 * replacement takes over as soon as it is added, one dish at a time.
 *
 * Serving the photos from the store's own address also keeps the conveyor's shading working: it uses each photo as a CSS
 * mask, and masks only load from the same origin or with CORS.
 *
 * The rights to these photos are unverified: the 21st.dev page labels the component MIT, which does not cover the photos.
 */
export const DISH_PHOTO_SOURCES: Record<string, string> = {
  "salmon-nigiri": "https://cdn.21st.dev/assets/mirror/e2/e2e31360457e8c31fe830c89bb3e618ef982a6a04ba3f988b074abefad47ab4d.webp",
  "tuna-nigiri": "https://cdn.21st.dev/assets/mirror/dc/dc231956590214c669df43d2a95134c610bc01c4c8d5d245393fd48febc7b85d.webp",
  "ebi-nigiri": "https://cdn.21st.dev/assets/mirror/ed/ed19038aa3d0ffb2b16e8daa4b21968e16038e1638446a55c90551e1e16b6b9f.webp",
  "california-roll": "https://cdn.21st.dev/assets/mirror/7a/7a57f85603a9a61497066e45bf6fbfb10dbf7b9369f83469221eb0e9ee9fd899.webp",
  "dragon-roll": "https://cdn.21st.dev/assets/mirror/81/816eddcbedeb62d59f7102783e13afd81ce1207e8180a9a83cde396a2d95f5f7.webp",
  tamago: "https://cdn.21st.dev/assets/mirror/2f/2fb834a44e170a6b2919da6441a7d8239b68a5f96782a3d032a031f78b96adb4.webp",
  edamame: "https://cdn.21st.dev/assets/mirror/12/1251847fad8f7d9288ff7f91954c54db0ef314f53dde2245bfc39497ee16fb42.webp",
  mochi: "https://cdn.21st.dev/assets/mirror/5c/5cbcce544cf25127b238252e69d6ea879115e85ae61b9a47231ebeb0719c51b5.webp",
};
