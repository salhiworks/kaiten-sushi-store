import type { ConveyorDish } from "@/components/ui/sushi-conveyor-menu";
import { formatPrice } from "@/lib/money";
import { ALLERGEN_LABELS, TAG_LABELS } from "./data";
import type { Dish } from "./types";

/** Maps a catalog dish onto the shape the conveyor component expects. */
export function toConveyorDish(dish: Dish): ConveyorDish {
  return {
    id: dish.id,
    name: dish.name,
    description: dish.description,
    price: formatPrice(dish.priceCents),
    tier: dish.tier,
    image: dish.image,
    details: [dish.portion, ...dish.allergens.map((a) => ALLERGEN_LABELS[a]), ...dish.tags.map((t) => TAG_LABELS[t])],
  };
}
