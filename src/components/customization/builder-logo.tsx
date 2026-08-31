"use client";

import { useEffect, useState } from "react";
import { resolveBuilderLogo } from "@/lib/builder-logos";
import { getBuilderInitials } from "@/lib/builders";
import { cn } from "@/lib/utils";

type BuilderLogoProps = {
  name: string;
  logoUrl?: string | null;
  className?: string;
};

export function BuilderLogo({ name, logoUrl, className }: BuilderLogoProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveBuilderLogo(name, logoUrl);
  const showImage = Boolean(resolved) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [resolved, name]);

  return (
    <div
      className={cn(
        "builder-logo relative flex h-[68px] w-full max-w-[200px] items-center justify-center overflow-hidden rounded-xl sm:h-[76px]",
        className,
      )}
      title={name}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={resolved}
          src={resolved!}
          alt={`${name} logo`}
          className="relative z-[1] h-[85%] w-[94%] object-contain object-center"
          loading="eager"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex flex-col items-center gap-0.5 px-2">
          <span className="text-base font-extrabold tracking-wide text-[#141414] sm:text-lg">
            {getBuilderInitials(name)}
          </span>
          <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
            Upload logo
          </span>
        </div>
      )}
    </div>
  );
}
