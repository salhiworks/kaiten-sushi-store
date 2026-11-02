"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dish } from "@/lib/menu";
import { useCart, useCartActions } from "./cart-provider";
import { QuantityStepper } from "./quantity-stepper";

/** "Add" button that turns into a quantity stepper once the dish is in the order. */
export function AddToOrder({ dish, className }: { dish: Dish; className?: string }) {
  const { quantityOf } = useCart();
  const { add, setQuantity } = useCartActions();
  const quantity = quantityOf(dish.id);
  const addRef = React.useRef<HTMLButtonElement>(null);
  const incrementRef = React.useRef<HTMLButtonElement>(null);
  // Keeps keyboard focus in place when the button and the stepper swap.
  const refocus = React.useRef<"add" | "stepper" | null>(null);

  React.useEffect(() => {
    const target = refocus.current === "add" ? addRef.current : refocus.current === "stepper" ? incrementRef.current : null;
    refocus.current = null;
    target?.focus();
  }, [quantity]);

  if (!dish.available) {
    return (
      <span data-sold-out className="inline-flex h-9 items-center rounded-full border border-dashed border-border px-4 text-sm text-muted-foreground">
        Sold out
      </span>
    );
  }

  if (quantity === 0) {
    return (
      <Button
        ref={addRef}
        variant="outline"
        aria-label={`Add ${dish.name} to order`}
        onClick={(event) => {
          if (event.currentTarget === document.activeElement) refocus.current = "stepper";
          add(dish.id);
        }}
        className={className ?? "h-9 bg-card px-4"}
      >
        <Plus aria-hidden="true" />
        Add
      </Button>
    );
  }

  return (
    <QuantityStepper
      name={dish.name}
      quantity={quantity}
      incrementRef={incrementRef}
      onChange={(next) => {
        if (next < 1) refocus.current = "add";
        setQuantity(dish.id, next);
      }}
      className={className}
    />
  );
}
