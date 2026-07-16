/**
 * Smoke-test property create/edit/delete against Supabase.
 * Usage: node scripts/test-property-flow.mjs
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  const raw = fs.readFileSync(envPath, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function assert(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) throw new Error(`${name}: ${detail}`);
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const sb = createClient(url, key);

async function main() {
  const { data: areas, error: aErr } = await sb
    .from("static_options")
    .select("id, value, status")
    .eq("type", "area")
    .eq("status", "active")
    .limit(5);
  assert(
    "load areas",
    !aErr && areas && areas.length > 0,
    aErr?.message || `count=${areas?.length ?? 0}`,
  );
  const area = areas[0];

  const { error: pErr } = await sb.from("properties").select("id").limit(1);
  assert("properties table exists", !pErr, pErr?.message);

  const stamp = Date.now().toString(36);
  const title = `Flow Test Privilon ${stamp}`;
  const areaSlug = area.value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `flow-test-privilon-${stamp}-at-${areaSlug}`;

  const { data: created, error: cErr } = await sb
    .from("properties")
    .insert({
      title,
      slug,
      status: "draft",
      area_id: area.id,
      area_name: area.value,
      locality: area.value,
      city: "Gandhinagar",
      listing_badge: "For Sale",
      availability: ["3 BHK", "Penthouse"],
      possession_by: "Dec, 2027",
      property_type_label: "Flats / Apartments",
      tower_count: 2,
      unit_count: 144,
      rera_no: "RN137AA10037/270722",
      package_price_label: "1.55 Cr.*",
      package_price_notes: "Incl All Charges - Onwards*",
      price_per_sqft_label: "Price on Request/ Sq.Ft.*",
      construction_status: "Under Construction",
      category_label: "Residential - Flats / Apartments",
      floor_count: 21,
      total_plot_area: "5200 Sq Mt",
      open_area_percent: 65,
      parking_types: ["Covered Parking", "Basement"],
      facing: "East",
      project_position: "2 Side Open",
      road_connectivity: "100 feet",
      current_status: "Available",
      about: "Flow test about text.",
      project_size_label: "2 Tower - 144 Units",
    })
    .select("id, title, slug, area_name, status")
    .single();
  assert("create property (area first)", !cErr && !!created, cErr?.message);
  const id = created.id;

  const { error: hErr } = await sb.from("property_highlights").insert([
    { property_id: id, content: "Club-Class Amenities", sort_order: 1 },
    { property_id: id, content: "Prime Location", sort_order: 2 },
  ]);
  assert("insert highlights", !hErr, hErr?.message);

  const { error: sErr } = await sb.from("property_specs").insert([
    { property_id: id, content: "21 Storey", sort_order: 1 },
    { property_id: id, content: "Podium Living", sort_order: 2 },
  ]);
  assert("insert specs", !sErr, sErr?.message);

  const { error: fErr } = await sb.from("property_faqs").insert([
    {
      property_id: id,
      question: "What is the location?",
      answer: `${area.value}, Gandhinagar`,
      sort_order: 1,
    },
  ]);
  assert("insert faqs", !fErr, fErr?.message);

  const { error: fpErr } = await sb.from("property_floor_plans").insert({
    property_id: id,
    name: "3 BHK Type 1",
    bhk_label: "3 BHK",
    rooms: 3,
    balcony: 1,
    bathroom: 3,
    servant_room: 1,
    area_sqft: 3060,
    area_sqyd: 340,
    area_sqmt: 284.3,
    price_label: "1.45 Cr.*",
    sort_order: 1,
  });
  assert("insert floor plan", !fpErr, fpErr?.message);

  const { data: amenities } = await sb
    .from("amenities")
    .select("id")
    .eq("status", "active")
    .limit(3);
  if (amenities?.length) {
    const { error: amErr } = await sb.from("property_amenities").insert(
      amenities.map((a, i) => ({
        property_id: id,
        amenity_id: a.id,
        sort_order: i + 1,
      })),
    );
    assert("link amenities", !amErr, amErr?.message);
  } else {
    assert("link amenities", true, "skipped (none in DB)");
  }

  const { data: builders } = await sb
    .from("builders")
    .select("id, name")
    .eq("status", "active")
    .limit(1);
  if (builders?.[0]) {
    const { error: uErr } = await sb
      .from("properties")
      .update({
        builder_id: builders[0].id,
        developer_name: builders[0].name,
        status: "active",
        is_featured: true,
      })
      .eq("id", id);
    assert("update builder + activate", !uErr, uErr?.message);
  } else {
    const { error: uErr } = await sb
      .from("properties")
      .update({ status: "active" })
      .eq("id", id);
    assert("activate property", !uErr, uErr?.message);
  }

  const { data: row, error: rErr } = await sb
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();
  assert(
    "read active property",
    !rErr && row?.status === "active",
    rErr?.message || row?.status,
  );

  const { count: hCount } = await sb
    .from("property_highlights")
    .select("*", { count: "exact", head: true })
    .eq("property_id", id);
  const { count: fpCount } = await sb
    .from("property_floor_plans")
    .select("*", { count: "exact", head: true })
    .eq("property_id", id);
  assert(
    "children present",
    (hCount ?? 0) >= 2 && (fpCount ?? 0) >= 1,
    `highlights=${hCount} plans=${fpCount}`,
  );

  const { error: dErr } = await sb.from("properties").delete().eq("id", id);
  assert("delete property", !dErr, dErr?.message);

  const { count: left } = await sb
    .from("property_highlights")
    .select("*", { count: "exact", head: true })
    .eq("property_id", id);
  assert("cascade deletes children", left === 0, `left=${left}`);

  console.log(`\nALL FLOW TESTS PASSED (area=${area.value})`);
}

main().catch((err) => {
  console.error("\nFLOW FAILED:", err.message);
  process.exit(1);
});
