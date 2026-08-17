/**
 * Copy production public tables + auth users + brochure storage
 * into NeevSpaces-Dev.
 *
 * Usage (from admin-panel):
 *   node scripts/copy-prod-to-dev.mjs
 *
 * Requires:
 *   .env.local          (production URL + service_role)
 *   .env.neev-dev       (DEST_SUPABASE_URL + DEST_SUPABASE_SERVICE_ROLE_KEY)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PAGE = 1000;
const UPSERT_CHUNK = 200;
const BUCKET = "property-brochures";

const WIPE_ORDER = [
  "property_amenities",
  "user_likes",
  "contact_enquiry_notes",
  "property_faqs",
  "property_specs",
  "property_highlights",
  "property_floor_plans",
  "property_media",
  "properties",
  "browse_unlocks",
  "contact_enquiries",
  "site_users",
  "digital_cards",
  "site_banners",
  "amenities",
  "builders",
  "static_options",
  "admin_profiles",
];

const PARENT_TABLES = [
  "static_options",
  "site_banners",
  "amenities",
  "builders",
  "admin_profiles",
  "digital_cards",
  "properties",
  "property_media",
  "property_floor_plans",
  "property_highlights",
  "property_specs",
  "property_faqs",
  "site_users",
  "contact_enquiries",
  "browse_unlocks",
];

const CHILD_TABLES = [
  "property_amenities",
  "user_likes",
  "contact_enquiry_notes",
];

function loadEnvFile(file) {
  const out = {};
  const raw = readFileSync(resolve(ROOT, file), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function client(url, key) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchAll(sb, table) {
  const rows = [];
  let from = 0;
  for (;;) {
    const { data, error } = await sb
      .from(table)
      .select("*")
      .range(from, from + PAGE - 1);
    if (error) {
      if (/schema cache|does not exist|permission denied/i.test(error.message)) {
        console.warn(`  ${table.padEnd(28)} skipped (${error.message})`);
        return null;
      }
      throw new Error(`${table} read: ${error.message}`);
    }
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

async function upsertAll(sb, table, rows) {
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error } = await sb.from(table).upsert(chunk);
    if (error) throw new Error(`${table} write: ${error.message}`);
  }
}

async function wipeTable(sb, table) {
  const { error } = await sb.from(table).delete().not("created_at", "is", null);
  if (error) {
    const fallback = await sb.from(table).delete().gte("sort_order", -999999);
    if (fallback.error) {
      console.warn(`  wipe skip ${table}: ${error.message}`);
    }
  }
}

async function copyTable(src, dest, table) {
  const rows = await fetchAll(src, table);
  if (rows == null) return 0;
  if (rows.length) await upsertAll(dest, table, rows);
  console.log(`  ${table.padEnd(28)} ${rows.length} rows`);
  return rows.length;
}

function readerFor(table, srcService, srcAnon) {
  const privateTables = new Set([
    "site_users",
    "user_likes",
    "contact_enquiries",
    "contact_enquiry_notes",
    "browse_unlocks",
  ]);
  return privateTables.has(table) ? srcService : srcAnon;
}

async function copyAuthUsers(src, dest, tempPassword) {
  const copied = [];
  let page = 1;
  for (;;) {
    const { data, error } = await src.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(`auth list: ${error.message}`);
    const users = data?.users ?? [];
    if (!users.length) break;

    for (const u of users) {
      const { error: createError } = await dest.auth.admin.createUser({
        id: u.id,
        email: u.email,
        phone: u.phone || undefined,
        email_confirm: true,
        phone_confirm: Boolean(u.phone),
        user_metadata: u.user_metadata ?? {},
        app_metadata: u.app_metadata ?? {},
        password: tempPassword,
      });
      if (createError && !/already been registered|already exists/i.test(createError.message)) {
        console.warn(`  skip auth user ${u.email || u.id}: ${createError.message}`);
        continue;
      }
      copied.push(u.email || u.id);
    }

    if (users.length < 200) break;
    page += 1;
  }
  console.log(`  auth.users                  ${copied.length} users`);
  return copied.length;
}

async function ensureBucket(dest) {
  const { data: buckets, error } = await dest.storage.listBuckets();
  if (error) throw new Error(`list buckets: ${error.message}`);
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error: createError } = await dest.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 20 * 1024 * 1024,
      allowedMimeTypes: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ],
    });
    if (createError && !/already exists/i.test(createError.message)) {
      throw new Error(`create bucket: ${createError.message}`);
    }
  }
}

async function listAllFiles(sb, prefix = "") {
  const { data, error } = await sb.storage.from(BUCKET).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) throw new Error(`list ${prefix || "/"}: ${error.message}`);
  const files = [];
  for (const item of data ?? []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) files.push(path);
    else files.push(...(await listAllFiles(sb, path)));
  }
  return files;
}

async function copyStorage(src, dest) {
  await ensureBucket(dest);
  const files = await listAllFiles(src);
  let copied = 0;
  for (const path of files) {
    const { data, error } = await src.storage.from(BUCKET).download(path);
    if (error) {
      console.warn(`  skip file ${path}: ${error.message}`);
      continue;
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    const { error: upError } = await dest.storage.from(BUCKET).upload(path, buffer, {
      upsert: true,
      contentType: data.type || undefined,
    });
    if (upError) {
      console.warn(`  skip upload ${path}: ${upError.message}`);
      continue;
    }
    copied += 1;
  }
  console.log(`  storage:${BUCKET.padEnd(16)} ${copied}/${files.length} files`);
}

async function main() {
  const prod = loadEnvFile(".env.local");
  const destEnv = loadEnvFile(".env.neev-dev");

  const srcUrl = prod.NEXT_PUBLIC_SUPABASE_URL;
  const srcKey = prod.SUPABASE_SERVICE_ROLE_KEY;
  const srcAnon = prod.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const destUrl = destEnv.DEST_SUPABASE_URL;
  const destKey = destEnv.DEST_SUPABASE_SERVICE_ROLE_KEY;
  const tempPassword = destEnv.DEST_ADMIN_TEMP_PASSWORD || "NeevDevReset!2026";

  if (!srcUrl || !srcKey || !srcAnon) {
    throw new Error("Missing production URL, anon key, or service_role in .env.local");
  }
  if (!destUrl || !destKey || destKey.includes("PASTE_")) {
    throw new Error(
      "Paste DEST_SUPABASE_SERVICE_ROLE_KEY in admin-panel/.env.neev-dev first",
    );
  }
  if (srcUrl.includes("tmllhtnfkntcpltmiwua")) {
    throw new Error("Source .env.local already points at the DEV project — aborting");
  }
  if (!destUrl.includes("tmllhtnfkntcpltmiwua")) {
    throw new Error("DEST_SUPABASE_URL is not the NeevSpaces-Dev project — aborting");
  }

  const src = client(srcUrl, srcKey);
  const srcPublic = client(srcUrl, srcAnon);
  const dest = client(destUrl, destKey);

  console.log("Copying production → NeevSpaces-Dev\n");
  console.log("0) Clearing DEV tables");
  for (const table of WIPE_ORDER) {
    await wipeTable(dest, table);
    console.log(`  wiped ${table}`);
  }

  console.log("\n1) Auth users");
  await copyAuthUsers(src, dest, tempPassword);

  console.log("\n2) Parent tables");
  for (const table of PARENT_TABLES) {
    await copyTable(readerFor(table, src, srcPublic), dest, table);
  }

  console.log("\n3) Child tables");
  for (const table of CHILD_TABLES) {
    await copyTable(readerFor(table, src, srcPublic), dest, table);
  }

  console.log("\n4) Storage");
  await copyStorage(src, dest);

  console.log("\nDone. Admin users on DEV can sign in with their email and temp password:");
  console.log(`  ${tempPassword}`);
  console.log("Change that password after first login.");
}

main().catch((err) => {
  console.error("\nCopy failed:", err.message);
  process.exit(1);
});
