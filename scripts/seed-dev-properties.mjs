/**
 * Seed NeevSpaces-Dev with full property listings.
 *
 * Guarantees:
 *   - at least 15 properties per active area
 *   - at least 15 properties per active builder
 *   - mixed property types (apartments, penthouse, villa, plot, shop, office, mixed)
 *   - complete details: rate cards, media, floor plans, amenities, highlights, specs, FAQs
 *
 * Usage (from NeevSapces-Management-Portal):
 *   node scripts/seed-dev-properties.mjs
 *   node scripts/seed-dev-properties.mjs --replace
 *
 * --replace  deletes previous seed rows (slug starts with "devseed-") then re-inserts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PER = 15;
const SLUG_PREFIX = "devseed-";
const CHUNK = 80;
const REPLACE = process.argv.includes("--replace");

const REQUIRED_TYPES = [
  "2 BHK Apartment",
  "3 BHK Apartment",
  "4 BHK Penthouse",
  "Villa",
  "Villa & Bungalow",
  "Plot",
  "Shop",
  "Office",
  "Showroom",
  "Mixed Use",
];

const REQUIRED_CATEGORIES = [
  "Residential - Flats / Apartments",
  "Residential - Villa / Bungalow",
  "Residential - Plot",
  "Commercial - Shop",
  "Commercial - Office",
  "Mixed Use",
];

const IMAGES = [
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?w=1600&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&q=80",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1600&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=80",
];

const NAME_FIRST = [
  "Aarohi", "Veda", "Surya", "Aarav", "Ananta", "Ishaan", "Kiyan", "Myra",
  "Pristine", "Royal", "Atharv", "Aganwadi", "Orchid", "Maple", "Cedar",
  "Skyline", "Horizon", "Emerald", "Sapphire", "Ivory", "Nirman", "Saanvi",
  "Advika", "Kian", "Reva", "Tarang", "Utsav", "Vihang", "Yash", "Zoya",
];

const NAME_SECOND = [
  "Heights", "Residences", "Park", "Towers", "Enclave", "Greens", "Court",
  "Square", "Crest", "Vista", "Casa", "One", "Prime", "Garden", "Avenue",
  "Manor", "Plaza", "Grove", "House", "Living",
];

const POSSESSIONS = [
  "Ready to move",
  "Immediate",
  "Dec, 2026",
  "Mar, 2027",
  "Jun, 2027",
  "Sep, 2027",
  "Dec, 2027",
  "Jun, 2028",
  "Dec, 2028",
  "Q2 2029",
  "Q4 2029",
  "Dec, 2030",
];

const FACINGS = ["East", "North-East", "North", "West", "South-East"];
const POSITIONS = ["2 Side Open", "3 Side Open", "Corner Plot", "Park Facing", "Road Facing"];
const ROADS = ["40 feet", "60 feet", "80 feet", "100 feet", "120 feet"];
const BADGES = ["For Sale", "New Launch", "Ready to Move", "Under Construction", "Newly Launched"];
const CURRENT = ["Available", "Limited Availability", "Few Units Left", "Newly Launched"];
const CONSTRUCTION = ["Under Construction", "Ready Possession", "Ongoing", "Upcoming"];

const AREA_META = {
  "SG Highway": { city: "Ahmedabad", pincode: "380054" },
  "Science City": { city: "Ahmedabad", pincode: "380060" },
  "Sindhu Bhavan": { city: "Ahmedabad", pincode: "380059" },
  Bopal: { city: "Ahmedabad", pincode: "380058" },
  Shela: { city: "Ahmedabad", pincode: "380058" },
  South: { city: "Ahmedabad", pincode: "380058" },
  Motera: { city: "Ahmedabad", pincode: "380005" },
  Chandkheda: { city: "Ahmedabad", pincode: "382424" },
  Tragad: { city: "Ahmedabad", pincode: "382470" },
  "GIFT City": { city: "Gandhinagar", pincode: "382355" },
  Kudasan: { city: "Gandhinagar", pincode: "382421" },
  Raysan: { city: "Gandhinagar", pincode: "382007" },
  Sargasan: { city: "Gandhinagar", pincode: "382421" },
  Randesan: { city: "Gandhinagar", pincode: "382007" },
  Infocity: { city: "Gandhinagar", pincode: "382007" },
  Adalaj: { city: "Gandhinagar", pincode: "382421" },
  Koba: { city: "Gandhinagar", pincode: "382421" },
  Por: { city: "Gandhinagar", pincode: "382330" },
  Vavol: { city: "Gandhinagar", pincode: "382016" },
  "PDPU Road": { city: "Gandhinagar", pincode: "382007" },
  "Sector 26": { city: "Gandhinagar", pincode: "382026" },
};

const KINDS = [
  {
    key: "apt2",
    match: /2\s*bhk/i,
    typeLabel: "2 BHK Apartment",
    category: "Residential - Flats / Apartments",
    availability: ["2 BHK", "3 BHK"],
    badgeHint: "For Sale",
  },
  {
    key: "apt3",
    match: /3\s*bhk|flat|apartment/i,
    typeLabel: "3 BHK Apartment",
    category: "Residential - Flats / Apartments",
    availability: ["2 BHK", "3 BHK", "4 BHK"],
  },
  {
    key: "penthouse",
    match: /penthouse|4\s*bhk/i,
    typeLabel: "4 BHK Penthouse",
    category: "Residential - Flats / Apartments",
    availability: ["4 BHK", "Penthouse"],
  },
  {
    key: "villa",
    match: /villa/i,
    typeLabel: "Villa",
    category: "Residential - Villa / Bungalow",
    availability: ["Villa & Bungalow", "4 BHK", "5 BHK"],
  },
  {
    key: "bungalow",
    match: /bungalow/i,
    typeLabel: "Villa & Bungalow",
    category: "Residential - Villa / Bungalow",
    availability: ["Villa & Bungalow", "5 BHK"],
  },
  {
    key: "plot",
    match: /plot|land/i,
    typeLabel: "Plot",
    category: "Residential - Plot",
    availability: ["Villa & Bungalow"],
  },
  {
    key: "shop",
    match: /shop|retail/i,
    typeLabel: "Shop",
    category: "Commercial - Shop",
    availability: ["Shop"],
  },
  {
    key: "office",
    match: /office/i,
    typeLabel: "Office",
    category: "Commercial - Office",
    availability: ["Office"],
  },
  {
    key: "showroom",
    match: /showroom/i,
    typeLabel: "Showroom",
    category: "Commercial - Shop",
    availability: ["Showroom", "Shop"],
  },
  {
    key: "mixed",
    match: /mixed/i,
    typeLabel: "Mixed Use",
    category: "Mixed Use",
    availability: ["2 BHK", "3 BHK", "Shop"],
  },
];

function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  const raw = fs.readFileSync(envPath, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = val;
  }
  return env;
}

function slugify(input) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pick(list, i) {
  return list[i % list.length];
}

function areaCity(name) {
  return AREA_META[name] ?? { city: "Gandhinagar", pincode: "382007" };
}

function kindForType(typeLabel, i) {
  const hit = KINDS.find((k) => k.match.test(typeLabel));
  return hit ?? KINDS[i % KINDS.length];
}

function money(amount, unit) {
  const n = Number(amount);
  const label = unit === "cr" ? `${n} Cr.*` : `${n} Lac.*`;
  return {
    id: crypto.randomUUID(),
    title: "",
    amount: n,
    unit,
    price: label,
    notes: "Incl. all charges — onwards*",
  };
}

function plansFor(kind, i) {
  const scale = 1 + (i % 5) * 0.04;
  const sq = (n) => Math.round(n * scale);
  const lac = (n) => Math.round(n * scale * 10) / 10;
  const cr = (n) => Math.round(n * scale * 100) / 100;

  if (kind.key === "apt2") {
    return [
      { name: "2 BHK Type A", bhk_label: "2 BHK", rooms: 2, balcony: 1, bathroom: 2, servant_room: 0, area_sqft: sq(1180), price: lac(68), unit: "lac" },
      { name: "2 BHK Type B", bhk_label: "2 BHK", rooms: 2, balcony: 2, bathroom: 2, servant_room: 0, area_sqft: sq(1325), price: lac(76), unit: "lac" },
      { name: "3 BHK Compact", bhk_label: "3 BHK", rooms: 3, balcony: 2, bathroom: 3, servant_room: 0, area_sqft: sq(1580), price: lac(92), unit: "lac" },
    ];
  }
  if (kind.key === "apt3" || kind.key === "mixed") {
    return [
      { name: "2 BHK Type 1", bhk_label: "2 BHK", rooms: 2, balcony: 2, bathroom: 2, servant_room: 0, area_sqft: sq(1260), price: lac(78), unit: "lac" },
      { name: "3 BHK Type 1", bhk_label: "3 BHK", rooms: 3, balcony: 2, bathroom: 3, servant_room: 0, area_sqft: sq(1785), price: cr(1.15), unit: "cr" },
      { name: "3 BHK Type 2", bhk_label: "3 BHK", rooms: 3, balcony: 3, bathroom: 3, servant_room: 1, area_sqft: sq(2140), price: cr(1.38), unit: "cr" },
      { name: "4 BHK", bhk_label: "4 BHK", rooms: 4, balcony: 3, bathroom: 4, servant_room: 1, area_sqft: sq(2680), price: cr(1.72), unit: "cr" },
    ];
  }
  if (kind.key === "penthouse") {
    return [
      {
        name: "4 BHK Penthouse",
        bhk_label: "4 BHK",
        rooms: 4,
        balcony: 3,
        bathroom: 4,
        servant_room: 1,
        area_sqft: sq(3120),
        carpet_terrace_sqft: sq(480),
        price: cr(2.45),
        unit: "cr",
      },
      {
        name: "5 BHK Sky Villa",
        bhk_label: "5 BHK",
        rooms: 5,
        balcony: 4,
        bathroom: 5,
        servant_room: 1,
        area_sqft: sq(3860),
        carpet_terrace_sqft: sq(720),
        price: cr(3.15),
        unit: "cr",
      },
    ];
  }
  if (kind.key === "villa" || kind.key === "bungalow") {
    return [
      { name: "4 BHK Villa", bhk_label: "4 BHK", rooms: 4, balcony: 3, bathroom: 4, servant_room: 1, area_sqft: sq(3480), price: cr(2.85), unit: "cr" },
      { name: "5 BHK Villa", bhk_label: "5 BHK", rooms: 5, balcony: 4, bathroom: 5, servant_room: 1, area_sqft: sq(4210), price: cr(3.6), unit: "cr" },
    ];
  }
  if (kind.key === "plot") {
    return [
      { name: "Plot 150 Sq.Yd.", bhk_label: null, rooms: null, balcony: 0, bathroom: 0, servant_room: 0, area_sqft: 1350, area_sqyd: 150, price: cr(1.05), unit: "cr" },
      { name: "Plot 200 Sq.Yd.", bhk_label: null, rooms: null, balcony: 0, bathroom: 0, servant_room: 0, area_sqft: 1800, area_sqyd: 200, price: cr(1.38), unit: "cr" },
      { name: "Plot 300 Sq.Yd.", bhk_label: null, rooms: null, balcony: 0, bathroom: 0, servant_room: 0, area_sqft: 2700, area_sqyd: 300, price: cr(1.95), unit: "cr" },
    ];
  }
  if (kind.key === "shop" || kind.key === "showroom") {
    return [
      { name: "Shop Type A", bhk_label: "Shop", rooms: 1, balcony: 0, bathroom: 1, servant_room: 0, area_sqft: sq(420), price: lac(62), unit: "lac" },
      { name: "Shop Type B", bhk_label: "Shop", rooms: 1, balcony: 0, bathroom: 1, servant_room: 0, area_sqft: sq(680), price: lac(94), unit: "lac" },
      { name: "Showroom", bhk_label: "Showroom", rooms: 2, balcony: 0, bathroom: 2, servant_room: 0, area_sqft: sq(1250), price: cr(1.42), unit: "cr" },
    ];
  }
  return [
    { name: "Office Suite", bhk_label: "Office", rooms: 2, balcony: 0, bathroom: 1, servant_room: 0, area_sqft: sq(780), price: lac(88), unit: "lac" },
    { name: "Full Floor", bhk_label: "Office", rooms: 6, balcony: 0, bathroom: 3, servant_room: 0, area_sqft: sq(4200), price: cr(4.1), unit: "cr" },
  ];
}

function toFloorRow(propertyId, plan, sort) {
  const area_sqft = plan.area_sqft ?? null;
  const area_sqyd =
    plan.area_sqyd ?? (area_sqft != null ? Math.round((area_sqft / 9) * 100) / 100 : null);
  const area_sqmt =
    area_sqft != null ? Math.round(area_sqft * 0.092903 * 100) / 100 : null;
  const carpet = area_sqft != null ? Math.round(area_sqft * 0.72) : null;
  const card = money(plan.price, plan.unit);
  return {
    property_id: propertyId,
    name: plan.name,
    bhk_label: plan.bhk_label,
    rooms: plan.rooms,
    balcony: plan.balcony,
    bathroom: plan.bathroom,
    servant_room: plan.servant_room,
    area_sqft,
    area_sqyd,
    area_sqmt,
    carpet_area_sqft: carpet,
    carpet_area_sqyd: carpet != null ? Math.round((carpet / 9) * 100) / 100 : null,
    carpet_terrace_sqft: plan.carpet_terrace_sqft ?? null,
    carpet_terrace_sqyd:
      plan.carpet_terrace_sqft != null
        ? Math.round((plan.carpet_terrace_sqft / 9) * 100) / 100
        : null,
    price_label: card.price,
    image_url: null,
    sort_order: sort,
  };
}

function buildAbout({ title, area, builder, kind, city, possession }) {
  return [
    `${title} by ${builder.name} is a ${kind.typeLabel.toLowerCase()} address in ${area.value}, ${city}. The project is planned for everyday living with generous open space, club-class amenities and strong road connectivity across Ahmedabad & Gandhinagar.`,
    `Possession is listed as ${possession}. Homes are designed with practical room sizes, abundant light and a quiet internal landscape. The development is suited to families who want a finished neighbourhood with schools, hospitals and daily retail close by.`,
    `Neev Spaces is sharing this listing for discovery only — visit the project, verify RERA details and confirm current availability before you decide.`,
  ].join("\n\n");
}

async function must(label, promise) {
  const { data, error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

async function insertChunked(sb, table, rows, select = "id") {
  const out = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const data = await must(
      `${table} ${i + 1}-${i + chunk.length}`,
      sb.from(table).insert(chunk).select(select),
    );
    out.push(...(data ?? []));
  }
  return out;
}

async function ensureOptions(sb, type, values) {
  const existing = await must(
    `load ${type}`,
    sb.from("static_options").select("id, value, status").eq("type", type),
  );
  const have = new Set((existing ?? []).map((r) => r.value.toLowerCase()));
  const missing = values.filter((v) => !have.has(v.toLowerCase()));
  if (missing.length) {
    await must(
      `insert ${type}`,
      sb.from("static_options").insert(
        missing.map((value) => ({ type, value, status: "active" })),
      ),
    );
  }
  const all = await must(
    `reload ${type}`,
    sb
      .from("static_options")
      .select("id, value, status")
      .eq("type", type)
      .eq("status", "active")
      .order("value"),
  );
  return all ?? [];
}

function pausedHint(err) {
  const msg = err?.message || String(err);
  if (
    /fetch failed|ENOTFOUND|paused|NXDOMAIN|not be resolved|Could not find the table/i.test(
      msg,
    )
  ) {
    return (
      "\nNeevSpaces-Dev looks paused or unreachable.\n" +
      "Restore the project in the dashboard (AWS ap-south-1), wait about a minute, then run:\n" +
      "  npm run seed:dev-properties\n"
    );
  }
  return "";
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Seeding ${url}`);
  console.log(REPLACE ? "Mode: replace previous seed rows" : "Mode: insert missing seed rows");

  const areas = await ensureOptions(sb, "area", []);
  const types = await ensureOptions(sb, "property_type", REQUIRED_TYPES);
  await ensureOptions(sb, "category", REQUIRED_CATEGORIES);

  const builders = (
    (await must(
      "builders",
      sb
        .from("builders")
        .select("id, name, status")
        .eq("status", "active")
        .order("sort_order")
        .order("name"),
    )) ?? []
  ).filter((b) => b.name);

  const amenities =
    (await must(
      "amenities",
      sb
        .from("amenities")
        .select("id, title")
        .eq("status", "active")
        .order("sort_order"),
    )) ?? [];

  if (!areas.length) throw new Error("No active areas in static_options. Add areas first.");
  if (!builders.length) throw new Error("No active builders. Add builders first.");
  if (!types.length) throw new Error("No active property types.");

  console.log(
    `Catalog: ${areas.length} areas, ${builders.length} builders, ${types.length} types, ${amenities.length} amenities`,
  );

  if (REPLACE) {
    const doomed =
      (await must(
        "list seed properties",
        sb.from("properties").select("id").like("slug", `${SLUG_PREFIX}%`),
      )) ?? [];
    if (doomed.length) {
      await must(
        "delete seed properties",
        sb.from("properties").delete().like("slug", `${SLUG_PREFIX}%`),
      );
      console.log(`Removed ${doomed.length} previous seed properties`);
    }
  }

  const existing =
    (await must(
      "existing seed slugs",
      sb.from("properties").select("slug").like("slug", `${SLUG_PREFIX}%`),
    )) ?? [];
  const existingSlugs = new Set(existing.map((r) => r.slug));

  const { data: maxRow } = await sb
    .from("properties")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  let sortBase = (maxRow?.sort_order ?? 0) + 1;

  const total = Math.max(areas.length, builders.length) * PER;
  const usedTitles = new Set();
  const jobs = [];

  for (let i = 0; i < total; i++) {
    const area = areas[i % areas.length];
    const builder = builders[i % builders.length];
    const typeRow = types[i % types.length];
    const kind = kindForType(typeRow.value, i);
    const meta = areaCity(area.value);

    let title = `${pick(NAME_FIRST, i)} ${pick(NAME_SECOND, Math.floor(i / NAME_FIRST.length))}`;
    if (usedTitles.has(title.toLowerCase())) title = `${title} ${area.value}`;
    if (usedTitles.has(title.toLowerCase())) title = `${title} ${i + 1}`;
    usedTitles.add(title.toLowerCase());

    const slug = `${SLUG_PREFIX}${slugify(title)}-at-${slugify(area.value)}`;
    if (existingSlugs.has(slug)) continue;

    const plans = plansFor(kind, i);
    const cards = plans.map((plan, idx) => {
      const card = money(plan.price, plan.unit);
      card.title = plan.name;
      if (idx === 0) card.notes = "Starting price — onwards*";
      return card;
    });
    const minCard = cards[0];
    const possession = pick(POSSESSIONS, i);
    const towers = kind.key.startsWith("apt") || kind.key === "penthouse" || kind.key === "mixed"
      ? 2 + (i % 4)
      : kind.key === "villa" || kind.key === "bungalow"
        ? 1
        : 1 + (i % 2);
    const units =
      kind.key === "plot"
        ? 24 + (i % 18)
        : kind.key === "villa" || kind.key === "bungalow"
          ? 18 + (i % 24)
          : 48 + (i % 12) * 12;
    const floors =
      kind.key === "plot" ? null : kind.key === "villa" || kind.key === "bungalow" ? 3 : 12 + (i % 16);
    const cover = pick(IMAGES, i);
    const hero = pick(IMAGES, i + 3);

    jobs.push({
      i,
      area,
      builder,
      kind,
      typeLabel: typeRow.value,
      row: {
        title,
        slug,
        status: "active",
        is_featured: i % 11 === 0,
        is_hero_banner: i < 6,
        listing_badge: kind.key === "plot" ? "For Sale" : pick(BADGES, i),
        area_id: area.id,
        area_name: area.value,
        locality: area.value,
        city: meta.city,
        pincode: meta.pincode,
        full_address: `${title}, ${area.value}, ${meta.city} ${meta.pincode}`,
        cover_image_url: cover,
        hero_banner_url: hero,
        package_price_label: minCard.price,
        package_price_notes: "Incl. all charges — onwards*",
        price_per_sqft_label: `${4200 + (i % 18) * 150}/ Sq.Ft.*`,
        rate_cards: cards,
        availability: kind.availability,
        possession_by: possession,
        property_type_label: typeRow.value,
        tower_count: towers,
        unit_count: units,
        rera_no: `PR/GJ/${meta.city === "Ahmedabad" ? "AHMEDABAD" : "GANDHINAGAR"}/RAA${String(10000 + i).slice(-5)}/${String(260101 + i).slice(-6)}`,
        rera_url: "https://gujrera.gujarat.gov.in/",
        builder_id: builder.id,
        builder_ids: [builder.id],
        developer_name: builder.name,
        category_label: kind.category,
        construction_status: /ready|immediate/i.test(possession)
          ? "Ready Possession"
          : pick(CONSTRUCTION, i),
        project_size_label: `${towers} ${towers === 1 ? "Tower" : "Towers"} — ${units} Units`,
        floor_count: floors,
        total_plot_area: `${6500 + (i % 20) * 400} Sq.Mt.`,
        open_area_percent: 42 + (i % 28),
        parking_types:
          kind.key === "plot"
            ? ["Open Parking"]
            : ["Covered Parking", "Basement", "4 Wheeler Parking"],
        facing: pick(FACINGS, i),
        project_position: pick(POSITIONS, i),
        road_connectivity: pick(ROADS, i),
        current_status: pick(CURRENT, i),
        about: buildAbout({
          title,
          area,
          builder,
          kind,
          city: meta.city,
          possession,
        }),
        sort_order: sortBase++,
      },
      plans,
      cover,
    });
  }

  console.log(`Will insert ${jobs.length} properties (skipped ${total - jobs.length} already seeded)`);
  if (!jobs.length) {
    console.log("Nothing to insert. Use --replace to rebuild seed data.");
    return;
  }

  const inserted = await insertChunked(
    sb,
    "properties",
    jobs.map((j) => j.row),
    "id, slug",
  );
  const idBySlug = new Map(inserted.map((r) => [r.slug, r.id]));

  const media = [];
  const floorPlans = [];
  const highlights = [];
  const specs = [];
  const faqs = [];
  const amenityLinks = [];

  for (const job of jobs) {
    const id = idBySlug.get(job.row.slug);
    if (!id) continue;

    for (let m = 0; m < 5; m++) {
      media.push({
        property_id: id,
        image_url: pick(IMAGES, job.i + m),
        caption: m === 0 ? "Cover elevation" : `Gallery ${m}`,
        sort_order: m,
      });
    }

    job.plans.forEach((plan, idx) => {
      floorPlans.push(toFloorRow(id, plan, idx + 1));
    });

    [
      "Club-class amenities",
      `Prime ${job.area.value} location`,
      `${job.row.open_area_percent}% open area`,
      job.row.road_connectivity + " frontage",
      "Designed for everyday family living",
    ].forEach((content, idx) => {
      highlights.push({ property_id: id, content, sort_order: idx + 1 });
    });

    [
      { label: "Structure", content: "RCC framed structure with earthquake-resistant design" },
      { label: "Flooring", content: "Vitrified tiles in living areas; anti-skid in wet areas" },
      { label: "Kitchen", content: "Granite platform with stainless-steel sink" },
      { label: "Doors & windows", content: "Hardwood frames with powder-coated aluminium windows" },
      { label: "Electrical", content: "Concealed copper wiring with MCB distribution" },
      { label: "Security", content: "Gated entry, CCTV and 24×7 security cabin" },
    ].forEach((item, idx) => {
      specs.push({
        property_id: id,
        label: item.label,
        content: item.content,
        sort_order: idx + 1,
      });
    });

    [
      {
        question: "Where is this project located?",
        answer: `${job.row.title} is in ${job.area.value}, ${job.row.city} ${job.row.pincode}.`,
      },
      {
        question: "Who is the developer?",
        answer: `${job.builder.name} is the developer for this listing.`,
      },
      {
        question: "What configurations are available?",
        answer: job.kind.availability.join(", "),
      },
      {
        question: "When is possession?",
        answer: job.row.possession_by,
      },
      {
        question: "Is the project RERA registered?",
        answer: `Yes. RERA no. ${job.row.rera_no}. Always verify on the Gujarat RERA portal before booking.`,
      },
    ].forEach((item, idx) => {
      faqs.push({
        property_id: id,
        question: item.question,
        answer: item.answer,
        sort_order: idx + 1,
      });
    });

    if (amenities.length) {
      const count = Math.min(amenities.length, 8 + (job.i % 5));
      for (let a = 0; a < count; a++) {
        amenityLinks.push({
          property_id: id,
          amenity_id: amenities[(job.i + a) % amenities.length].id,
          sort_order: a + 1,
        });
      }
    }
  }

  await insertChunked(sb, "property_media", media, "id");
  await insertChunked(sb, "property_floor_plans", floorPlans, "id");
  await insertChunked(sb, "property_highlights", highlights, "id");
  await insertChunked(sb, "property_specs", specs, "id");
  await insertChunked(sb, "property_faqs", faqs, "id");
  if (amenityLinks.length) {
    const unique = [];
    const seen = new Set();
    for (const row of amenityLinks) {
      const key = `${row.property_id}:${row.amenity_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(row);
    }
    await insertChunked(sb, "property_amenities", unique, "property_id");
  }

  const areaCounts = {};
  const builderCounts = {};
  const typeCounts = {};
  for (const job of jobs) {
    areaCounts[job.area.value] = (areaCounts[job.area.value] ?? 0) + 1;
    builderCounts[job.builder.name] = (builderCounts[job.builder.name] ?? 0) + 1;
    typeCounts[job.typeLabel] = (typeCounts[job.typeLabel] ?? 0) + 1;
  }

  console.log(`\nInserted ${inserted.length} properties`);
  console.log("Per area:", areaCounts);
  console.log("Per builder:", builderCounts);
  console.log("Per type:", typeCounts);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nSEED FAILED:", err.message);
  const hint = pausedHint(err);
  if (hint) console.error(hint);
  process.exit(1);
});
