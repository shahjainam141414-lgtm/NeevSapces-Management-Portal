"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentAdminProfile } from "@/app/actions/auth";
import {
  isEnquiryStatus,
  type EnquiryStatus,
} from "@/lib/enquiry-status";

export type EnquiryNote = {
  id: string;
  enquiry_id: string;
  note: string;
  created_by_name: string | null;
  created_at: string;
};

export type ContactEnquiryRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  source: string;
  status: string;
  created_at: string;
  notes: EnquiryNote[];
};

export type SavedHomeLead = {
  phone: string;
  name: string | null;
  email: string | null;
  slug: string;
  liked_at: string;
  last_login_at: string | null;
};

export type BrowseUnlockRow = {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  intent_path: string | null;
  viewed_slugs: string[];
  created_at: string;
};

export type LeadInboxCounts = {
  contact: number;
  saved: number;
  unlocks: number;
};

async function requireAdmin() {
  const me = await getCurrentAdminProfile();
  if (!me) throw new Error("Unauthorized");
  return me;
}

function migrationHint(message: string, table: string) {
  if (message.includes(table) || message.includes("42P01")) {
    return "Run migration 019_contact_desk_notes_status.sql in the Supabase SQL Editor, then retry.";
  }
  return message;
}

export async function getLeadInboxCounts(): Promise<
  { ok: true; counts: LeadInboxCounts } | { ok: false; error: string }
> {
  try {
    await requireAdmin();
    const admin = createServiceClient();

    const [contact, saved, unlocks] = await Promise.all([
      admin
        .from("contact_enquiries")
        .select("id", { count: "exact", head: true }),
      admin.from("user_likes").select("phone", { count: "exact", head: true }),
      admin
        .from("browse_unlocks")
        .select("id", { count: "exact", head: true }),
    ]);

    return {
      ok: true,
      counts: {
        contact: contact.count ?? 0,
        saved: saved.count ?? 0,
        unlocks: unlocks.count ?? 0,
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to load counts",
    };
  }
}

export async function listContactEnquiries(): Promise<
  { ok: true; rows: ContactEnquiryRow[] } | { ok: false; error: string }
> {
  try {
    await requireAdmin();
    const admin = createServiceClient();
    const { data, error } = await admin
      .from("contact_enquiries")
      .select("id, name, phone, email, message, source, status, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      return {
        ok: false,
        error: migrationHint(error.message, "contact_enquiries"),
      };
    }

    const enquiries = (data ?? []) as Omit<ContactEnquiryRow, "notes">[];
    const ids = enquiries.map((e) => e.id);
    const notesByEnquiry = new Map<string, EnquiryNote[]>();

    if (ids.length) {
      const { data: noteRows, error: notesError } = await admin
        .from("contact_enquiry_notes")
        .select("id, enquiry_id, note, created_by_name, created_at")
        .in("enquiry_id", ids)
        .order("created_at", { ascending: true });

      if (notesError) {
        return {
          ok: false,
          error: migrationHint(notesError.message, "contact_enquiry_notes"),
        };
      }

      for (const n of noteRows ?? []) {
        const note: EnquiryNote = {
          id: n.id as string,
          enquiry_id: n.enquiry_id as string,
          note: n.note as string,
          created_by_name: (n.created_by_name as string | null) ?? null,
          created_at: n.created_at as string,
        };
        const list = notesByEnquiry.get(note.enquiry_id) ?? [];
        list.push(note);
        notesByEnquiry.set(note.enquiry_id, list);
      }
    }

    return {
      ok: true,
      rows: enquiries.map((e) => ({
        ...e,
        notes: notesByEnquiry.get(e.id) ?? [],
      })),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to load enquiries",
    };
  }
}

export async function updateEnquiryStatus(
  id: string,
  status: EnquiryStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    if (!isEnquiryStatus(status)) {
      return { ok: false, error: "Invalid status" };
    }
    const admin = createServiceClient();
    const { error } = await admin
      .from("contact_enquiries")
      .update({ status })
      .eq("id", id);
    if (error) {
      return {
        ok: false,
        error: migrationHint(error.message, "contact_enquiries"),
      };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Update failed",
    };
  }
}

export async function addEnquiryNote(
  enquiryId: string,
  note: string,
): Promise<
  { ok: true; note: EnquiryNote } | { ok: false; error: string }
> {
  try {
    const me = await requireAdmin();
    const text = note.trim();
    if (text.length < 2) {
      return { ok: false, error: "Note is too short" };
    }
  if (text.length > 4000) {
    return { ok: false, error: "Note is too long" };
  }

    const admin = createServiceClient();
    const { data, error } = await admin
      .from("contact_enquiry_notes")
      .insert({
        enquiry_id: enquiryId,
        note: text,
        created_by_name: me.name || me.email || "Admin",
        created_by_id: me.id,
      })
      .select("id, enquiry_id, note, created_by_name, created_at")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: migrationHint(
          error?.message ?? "Could not save note",
          "contact_enquiry_notes",
        ),
      };
    }

    return {
      ok: true,
      note: {
        id: data.id as string,
        enquiry_id: data.enquiry_id as string,
        note: data.note as string,
        created_by_name: (data.created_by_name as string | null) ?? null,
        created_at: data.created_at as string,
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not save note",
    };
  }
}

export async function listSavedHomeLeads(): Promise<
  { ok: true; rows: SavedHomeLead[] } | { ok: false; error: string }
> {
  try {
    await requireAdmin();
    const admin = createServiceClient();
    const { data: likes, error } = await admin
      .from("user_likes")
      .select("phone, slug, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      return {
        ok: false,
        error:
          error.message.includes("user_likes") || error.code === "42P01"
            ? "Run migration 017_site_users_and_likes.sql in Supabase SQL Editor, then retry."
            : error.message,
      };
    }

    const phones = [
      ...new Set((likes ?? []).map((row) => row.phone as string)),
    ];
    const userByPhone = new Map<
      string,
      { name: string | null; email: string | null; last_login_at: string | null }
    >();

    if (phones.length) {
      const { data: users } = await admin
        .from("site_users")
        .select("phone, name, email, last_login_at")
        .in("phone", phones);
      for (const u of users ?? []) {
        userByPhone.set(u.phone as string, {
          name: (u.name as string | null) ?? null,
          email: (u.email as string | null) ?? null,
          last_login_at: (u.last_login_at as string | null) ?? null,
        });
      }
    }

    const rows: SavedHomeLead[] = (likes ?? []).map((row) => {
      const user = userByPhone.get(row.phone as string);
      return {
        phone: row.phone as string,
        slug: row.slug as string,
        liked_at: row.created_at as string,
        name: user?.name ?? null,
        email: user?.email ?? null,
        last_login_at: user?.last_login_at ?? null,
      };
    });

    return { ok: true, rows };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to load saved homes",
    };
  }
}

export async function listBrowseUnlocks(): Promise<
  { ok: true; rows: BrowseUnlockRow[] } | { ok: false; error: string }
> {
  try {
    await requireAdmin();
    const admin = createServiceClient();
    const { data, error } = await admin
      .from("browse_unlocks")
      .select("id, phone, name, email, intent_path, viewed_slugs, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      return {
        ok: false,
        error: migrationHint(error.message, "browse_unlocks"),
      };
    }

    return {
      ok: true,
      rows: ((data ?? []) as BrowseUnlockRow[]).map((r) => ({
        ...r,
        viewed_slugs: Array.isArray(r.viewed_slugs) ? r.viewed_slugs : [],
      })),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to load browse unlocks",
    };
  }
}
