"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { AnalogClock } from "@/components/AnalogClock";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
});

const REDIRECT_DELAY_MS = 2000;

export default function WelcomePage() {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const tick = setInterval(() => setNow(new Date()), 100);
    const redirect = setTimeout(() => router.replace("/"), REDIRECT_DELAY_MS);

    return () => {
      clearInterval(tick);
      clearTimeout(redirect);
    };
  }, [router]);

  if (!now) return <div className="min-h-screen bg-[#0c1310]" />;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0c1310] text-[#f2ede3]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 30%, #16261f 0%, #0c1310 70%)" }}
      />

      <div className="relative w-full bg-gradient-to-r from-[#1a2a22] via-[#233b2e] to-[#1a2a22] py-6 text-center shadow-[0_1px_0_rgba(242,237,227,0.08)]">
        <p
          className={`${playfair.className} text-2xl font-semibold uppercase tracking-[0.3em] text-[#f2ede3] sm:text-3xl`}
        >
          Honest International
        </p>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-7 px-6">
        <div className="pointer-events-none absolute h-72 w-72 rounded-full border border-[#c9a24b]/20" />
        <div className="pointer-events-none absolute h-60 w-60 rounded-full border border-[#c9a24b]/30" />

        <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#c9a24b]">
          Welcome back
        </p>

        <h1 className={`${playfair.className} text-center text-2xl font-semibold text-[#f2ede3] sm:text-3xl`}>
          Mr Ahmed Khadim
        </h1>

        <AnalogClock
          now={now}
          className="relative h-36 w-36 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
          faceColor="#0f1c16"
          rimColor="#c9a24b"
          tickColor="rgba(242,237,227,0.55)"
          hourHandColor="#f2ede3"
          minuteHandColor="#f2ede3"
          secondHandColor="#c9a24b"
          centerColor="#c9a24b"
        />

        <p className="text-sm tracking-wide text-[#cfc7b8]">
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          &middot;{" "}
          {now.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
