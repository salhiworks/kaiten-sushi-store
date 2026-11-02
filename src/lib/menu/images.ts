export const DISH_IMAGE_BUCKET = "dish-images";
export const PLACEHOLDER_IMAGE = "/dishes/placeholder.svg";

/**
 * Dish photos are either bundled ("/dishes/…", used by the seed menu) or objects in the
 * dish-images Storage bucket (uploaded from the admin).
 */
export function dishImageUrl(path: string | null | undefined) {
  if (!path) return PLACEHOLDER_IMAGE;
  if (path.startsWith("/")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${DISH_IMAGE_BUCKET}/${path}`;
}

/** The Storage object path of an uploaded photo, or null for bundled images. */
export function storageObjectPath(path: string | null | undefined) {
  return path && !path.startsWith("/") ? path : null;
}
