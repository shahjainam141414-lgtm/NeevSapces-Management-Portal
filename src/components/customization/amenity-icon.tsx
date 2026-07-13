"use client";

import Image from "next/image";
import {
  Accessibility,
  Archive,
  Armchair,
  Baby,
  BatteryCharging,
  Blocks,
  Building2,
  Camera,
  Church,
  CircleParking,
  CloudSun,
  Dice5,
  DoorOpen,
  Droplets,
  Dumbbell,
  FerrisWheel,
  Flower2,
  Gauge,
  Landmark,
  LayoutGrid,
  LibraryBig,
  LifeBuoy,
  MonitorPlay,
  Route,
  Shrub,
  ShowerHead,
  Sparkles,
  Spotlight,
  Tent,
  TreePine,
  Umbrella,
  UserRoundCog,
  Volleyball,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Default icons when no custom image is uploaded.
 * Mapped to amenity names for clear, recognizable fallbacks.
 */
const TITLE_MAP: Record<string, LucideIcon> = {
  "Security Cabin": Camera,
  "Swimming Pool": Waves,
  "Children's Play Area": Blocks,
  "Common Toilet": ShowerHead,
  "Indoor Game": Dice5,
  Library: LibraryBig,
  "Multi-Purpose Court": Volleyball,
  "Power Backup": BatteryCharging,
  "Multipurpose Hall": Building2,
  "Walking Track": Route,
  Waterbody: Droplets,
  WATERBODY: Droplets,
  "Home Theater": MonitorPlay,
  "Lily Pond": Flower2,
  "Elegant Entrance": DoorOpen,
  "Sitting Gazebo": Tent,
  "Open Yoga Area": Accessibility,
  "Dense Landscape": TreePine,
  "Lawn Area With Sit-out": Shrub,
  "Sunken Seating": Armchair,
  "Attractive Sculpture": Landmark,
  "Swing Area": FerrisWheel,
  "Pool Side Seating Deck": Umbrella,
  "Potted Plants": Flower2,
  "Roof Top Seating": CloudSun,
  "Baby Pool": LifeBuoy,
  "Indoor Gym": Dumbbell,
  "Toddler Room": Baby,
  "Net Seating": LayoutGrid,
  "Manager Cabin": UserRoundCog,
  "Attractive Street Light": Spotlight,
  "Store Room": Archive,
  "Meter Room": Gauge,
  "Two Level Parking": CircleParking,
  Temple: Church,
};

const KEYWORD_MAP: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /security|cctv|guard|camera/i, icon: Camera },
  { match: /baby\s*pool/i, icon: LifeBuoy },
  { match: /swim|pool/i, icon: Waves },
  { match: /play|kids|children|toddler|blocks/i, icon: Blocks },
  { match: /toilet|bath|wash|restroom|shower/i, icon: ShowerHead },
  { match: /game|indoor|dice|carrom/i, icon: Dice5 },
  { match: /library|book/i, icon: LibraryBig },
  { match: /court|volley|sport|tennis/i, icon: Volleyball },
  { match: /power|backup|battery|generator/i, icon: BatteryCharging },
  { match: /hall|multipurpose|community/i, icon: Building2 },
  { match: /walk|jog|track|route|path/i, icon: Route },
  { match: /water|pond|lake|body/i, icon: Droplets },
  { match: /theater|theatre|cinema|tv|monitor/i, icon: MonitorPlay },
  { match: /lily|flower|plant|pot/i, icon: Flower2 },
  { match: /entrance|gate|door|lobby/i, icon: DoorOpen },
  { match: /gazebo|pavilion|tent/i, icon: Tent },
  { match: /yoga|meditation|wellness/i, icon: Accessibility },
  { match: /landscape|forest|tree|dense/i, icon: TreePine },
  { match: /lawn|grass|shrub|sit-out|sit out/i, icon: Shrub },
  { match: /sunken|seating|armchair|sofa/i, icon: Armchair },
  { match: /sculpt|statue|art|landmark/i, icon: Landmark },
  { match: /swing/i, icon: FerrisWheel },
  { match: /umbrella|pool side|poolside|deck/i, icon: Umbrella },
  { match: /roof|terrace|rooftop|sun/i, icon: CloudSun },
  { match: /gym|fitness|workout|dumbbell/i, icon: Dumbbell },
  { match: /net seating|lounge|grid/i, icon: LayoutGrid },
  { match: /manager|office|admin|cabin/i, icon: UserRoundCog },
  { match: /street light|lamp|light|spotlight/i, icon: Spotlight },
  { match: /store|storage|warehouse|archive/i, icon: Archive },
  { match: /meter|utility|gauge/i, icon: Gauge },
  { match: /park|parking|car/i, icon: CircleParking },
  { match: /temple|mandir|church|worship/i, icon: Church },
  { match: /baby/i, icon: Baby },
];

type AmenityIconProps = {
  title: string;
  iconUrl?: string | null;
  iconKey?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const shellSize = {
  sm: "h-10 w-10 rounded-[0.85rem]",
  md: "h-12 w-12 rounded-xl",
  lg: "h-14 w-14 rounded-2xl",
  xl: "h-16 w-16 rounded-2xl",
};

const glyphSize = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-7 w-7",
};

function resolveDefaultIcon(title: string): LucideIcon {
  if (TITLE_MAP[title]) return TITLE_MAP[title];

  const exact = Object.entries(TITLE_MAP).find(
    ([key]) => key.toLowerCase() === title.trim().toLowerCase(),
  );
  if (exact) return exact[1];

  for (const rule of KEYWORD_MAP) {
    if (rule.match.test(title)) return rule.icon;
  }

  return Sparkles;
}

export function AmenityIcon({
  title,
  iconUrl,
  iconKey: _iconKey,
  className,
  size = "md",
}: AmenityIconProps) {
  const Icon = resolveDefaultIcon(title);
  const hasCustom = Boolean(iconUrl);

  return (
    <div
      className={cn(
        "amenity-icon-shell relative flex shrink-0 items-center justify-center overflow-hidden",
        !hasCustom && "amenity-icon-default",
        shellSize[size],
        className,
      )}
      aria-hidden
    >
      {hasCustom ? (
        <Image
          src={iconUrl!}
          alt=""
          fill
          className="object-contain p-2"
          sizes="64px"
        />
      ) : (
        <Icon
          className={cn("relative z-[1] text-[#1a2744]", glyphSize[size])}
          strokeWidth={1.75}
        />
      )}
    </div>
  );
}
