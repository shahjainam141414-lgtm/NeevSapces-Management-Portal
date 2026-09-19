import { createClient } from "@/lib/supabase/client";
import type { Testimonial, TestimonialStatus } from "@/lib/testimonials";

const COLUMNS =
  "id, name, role, quote, sort_order, status, created_at, updated_at";

function toFriendlyError(error: { message?: string; code?: string }) {
  const msg = error.message ?? "Supabase request failed";
  if (
    error.code === "42P01" ||
    msg.toLowerCase().includes("does not exist") ||
    msg.toLowerCase().includes("could not find the table")
  ) {
    return new Error(
      "Testimonials table is missing. Run supabase/migrations/036_testimonials.sql in the Supabase SQL Editor, then retry.",
    );
  }
  if (
    error.code === "42501" ||
    msg.toLowerCase().includes("permission") ||
    msg.toLowerCase().includes("policy")
  ) {
    return new Error(
      "Supabase permission denied on testimonials. Re-run supabase/migrations/036_testimonials.sql, then retry.",
    );
  }
  return new Error(msg);
}

export async function listTestimonials(): Promise<Testimonial[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select(COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw toFriendlyError(error);
  return (data ?? []) as Testimonial[];
}

export async function createTestimonial(input: {
  name: string;
  role: string;
  quote: string;
  status: TestimonialStatus;
  sort_order?: number;
}): Promise<Testimonial> {
  const supabase = createClient();
  const { data: maxRow } = await supabase
    .from("testimonials")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("testimonials")
    .insert({
      name: input.name.trim(),
      role: input.role.trim(),
      quote: input.quote.trim(),
      status: input.status,
      sort_order: input.sort_order ?? (maxRow?.sort_order ?? 0) + 1,
    })
    .select(COLUMNS)
    .single();

  if (error) throw toFriendlyError(error);
  return data as Testimonial;
}

export async function updateTestimonial(input: {
  id: string;
  name: string;
  role: string;
  quote: string;
  status: TestimonialStatus;
  sort_order?: number;
}): Promise<Testimonial> {
  const supabase = createClient();
  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    role: input.role.trim(),
    quote: input.quote.trim(),
    status: input.status,
  };
  if (input.sort_order !== undefined) {
    payload.sort_order = input.sort_order;
  }

  const { data, error } = await supabase
    .from("testimonials")
    .update(payload)
    .eq("id", input.id)
    .select(COLUMNS)
    .single();

  if (error) throw toFriendlyError(error);
  return data as Testimonial;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw toFriendlyError(error);
}
