"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { MAX_QUANTITY } from "@/lib/cart/store";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  name: string;
  quantity: number;
  onChange: (quantity: number) => void;
  className?: string;
  incrementRef?: React.Ref<HTMLButtonElement>;
}

export function QuantityStepper({ name, quantity, onChange, className, incrementRef }: QuantityStepperProps) {
  const step = "grid size-9 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 [&_svg]:size-3.5";
  return (
    <div role="group" aria-label={`Quantity of ${name}`} className={cn("inline-flex h-9 items-center rounded-full border border-border bg-card", className)}>
      <button type="button" aria-label={quantity === 1 ? `Remove ${name}` : `One fewer ${name}`} onClick={() => onChange(quantity - 1)} className={step}>
        <Minus aria-hidden="true" />
      </button>
      <span data-quantity className="min-w-6 text-center text-sm font-medium tabular-nums">{quantity}</span>
      <button ref={incrementRef} type="button" aria-label={`One more ${name}`} disabled={quantity >= MAX_QUANTITY} onClick={() => onChange(quantity + 1)} className={step}>
        <Plus aria-hidden="true" />
      </button>
    </div>
  );
}
