import "server-only";

import { connection } from "next/server";
import { isLive } from "@/lib/config";
import { createPublicClient } from "@/lib/supabase/server";
import type { OrderConfirmation } from "./checkout";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface OrderRow {
  reference: string;
  status: OrderConfirmation["status"];
  created_at: string;
  customer_name: string;
  notes: string;
  total_cents: number;
  items: { name: string; quantity: number; unit_price_cents: number; line_total_cents: number }[];
}

/** A guest's own order, looked up by the unguessable token in their confirmation link. */
export async function getOrderByToken(token: string): Promise<OrderConfirmation | null> {
  await connection();
  if (!isLive || !UUID.test(token)) return null;
  const { data, error } = await createPublicClient().rpc("get_order", { p_token: token });
  if (error) throw new Error(`Could not load the order: ${error.message}`);
  const row = data as OrderRow | null;
  if (!row) return null;
  return {
    reference: row.reference,
    status: row.status,
    createdAt: row.created_at,
    customerName: row.customer_name,
    notes: row.notes,
    totalCents: row.total_cents,
    items: row.items.map((item) => ({ name: item.name, quantity: item.quantity, unitPriceCents: item.unit_price_cents, lineTotalCents: item.line_total_cents })),
  };
}
