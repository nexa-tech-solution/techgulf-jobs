"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Dict, Locale } from "@/lib/i18n";

const UserMap = dynamic(() => import("./user-map").then((m) => m.UserMap), { ssr: false });

/** The map's outlines are about 65 KB, so they load only when the visitor scrolls near it. */
export function UserMapLazy({ d, lang }: { d: Dict; lang: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setNear(true);
    }, { rootMargin: "600px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className="min-h-[620px] lg:min-h-[440px]">{near && <UserMap d={d} lang={lang} />}</div>;
}
