import { createClient } from "@/lib/supabase/client";
import {
  toEntityItem,
  type EntityItem,
  type OptionStatus,
  type StaticOption,
  type StaticOptionType,
} from "@/lib/static-options";

function toFriendlyError(error: { message?: string; code?: string; hint?: string }) {
  const msg = error.message ?? "Supabase request failed";
  if (
    error.code === "42501" ||
    msg.toLowerCase().includes("permission") ||
    msg.toLowerCase().includes("policy")
  ) {
    return new Error(
      "Supabase permission denied on static_options. Run supabase/migrations/002_fix_static_options_grants.sql in the SQL Editor, then retry.",
    );
  }
  return new Error(error.hint ? `${msg} (${error.hint})` : msg);
}

export async function listStaticOptions(
  type: StaticOptionType,
): Promise<EntityItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("static_options")
    .select("id, type, value, status, created_at, updated_at")
    .eq("type", type)
    .order("value", { ascending: true });

  if (error) throw toFriendlyError(error);
  return ((data ?? []) as StaticOption[]).map(toEntityItem);
}

export async function createStaticOption(input: {
  type: StaticOptionType;
  value: string;
  status: OptionStatus;
}): Promise<EntityItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("static_options")
    .insert({
      type: input.type,
      value: input.value.trim(),
      status: input.status,
    })
    .select("id, type, value, status")
    .single();

  if (error) throw toFriendlyError(error);
  return toEntityItem(data as StaticOption);
}

export async function updateStaticOption(input: {
  id: string;
  value: string;
  status: OptionStatus;
}): Promise<EntityItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("static_options")
    .update({
      value: input.value.trim(),
      status: input.status,
    })
    .eq("id", input.id)
    .select("id, type, value, status")
    .single();

  if (error) throw toFriendlyError(error);
  return toEntityItem(data as StaticOption);
}

export async function deleteStaticOption(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("static_options")
    .delete()
    .eq("id", id);

  if (error) throw toFriendlyError(error);
}
