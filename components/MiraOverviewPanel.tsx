"use client";

/**
 * OVERVIEW lamp panel (top-left HUD): glowing violet filament + sliding node +
 * "OVERVIEW" label, live clock/date, the visitor's own weather, a greeting and
 * "On this day". Clicking the lamp opens the social tiles; they leave the site
 * (marked with an arrow) and open in a new tab.
 */

import { useEffect, useState } from "react";
import { Instagram, Facebook, Linkedin, ArrowUpRight } from "lucide-react";

const ACCENT = "#a78bfa";
const FILAMENT = "#ddd6fe";
const WCODE: Record<number, string> = { 0: "Clear", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Fog", 51: "Drizzle", 53: "Drizzle", 55: "Drizzle", 61: "Rain", 63: "Rain", 65: "Heavy rain", 71: "Snow", 73: "Snow", 75: "Snow", 80: "Showers", 81: "Showers", 82: "Showers", 95: "Storm", 96: "Storm", 99: "Storm" };

type Tile = { key: string; icon: typeof Instagram; label: string; href: string };

// Social links point to public profiles. Swap them for your own.
const TILES: Tile[] = [
  { key: "instagram", icon: Instagram, label: "Follow us on Instagram", href: "https://www.instagram.com/reznikov_engineering/" },
  { key: "facebook",  icon: Facebook,  label: "Follow us on Facebook",  href: "https://www.facebook.com/profile.php?id=61590746065386" },
  { key: "linkedin",  icon: Linkedin,  label: "Follow us on LinkedIn",  href: "https://www.linkedin.com/in/ruben-mouradian-150698173" },
];

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  const [wx, setWx] = useState<{ temp: number | null; code: number | null; city: string } | null>(null);
  const [otd, setOtd] = useState("");

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let ok = true;
    // Via our own API route, so open-meteo never sees visitor IPs.
    const load = () =>
      fetch("/api/weather")
        .then((r) => r.json())
        .then((d) => { if (ok) setWx({ temp: d.current?.temperature_2m ?? null, code: d.current?.weather_code ?? null, city: d.city || "your town" }); })
        .catch(() => {});
    load();
    const id = setInterval(load, 1200000);
    return () => { ok = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    let ok = true;
    fetch("/api/onthisday")
      .then((r) => r.json())
      .then((d) => { if (ok && d?.text) setOtd(d.text); })
      .catch(() => {});
    return () => { ok = false; };
  }, []);

  if (!now) return <div style={{ height: 48 }} />;
  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const hr = now.getHours();
  const greet = hr < 5 ? "Good night" : hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 26, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: 34, fontWeight: 300, letterSpacing: "0.04em", color: "#f0ede8", lineHeight: 1, textShadow: `0 0 22px ${ACCENT}33` }}>{time}</div>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: 10.5, letterSpacing: "0.2em", color: "rgba(240,237,232,0.5)", marginTop: 4, textTransform: "uppercase" }}>{date}</div>
        </div>
        {wx && (
          <div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: 22, fontWeight: 300, color: `${ACCENT}e6` }}>{wx.temp != null ? Math.round(wx.temp) + "°C" : "-"}</div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: 9.5, letterSpacing: "0.12em", color: "rgba(240,237,232,0.45)", marginTop: 2, textTransform: "uppercase" }}>
              {(wx.city || "").toUpperCase()}{wx.city && wx.code != null ? " · " : ""}{wx.code != null ? (WCODE[wx.code] || "").toUpperCase() : ""}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 26, flexWrap: "wrap" }}>
        <div style={{ minWidth: 112, fontFamily: "var(--font-ui)", fontSize: 11, letterSpacing: "0.12em", color: "rgba(240,237,232,0.5)", paddingTop: 2 }}>{greet.toUpperCase()}</div>
        {otd && (
          <div style={{ maxWidth: 380, minWidth: 180, flex: "1 1 220px" }}>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: 9, letterSpacing: "0.2em", color: ACCENT, marginBottom: 3 }}>ON THIS DAY</div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: 11.5, lineHeight: 1.4, color: "rgba(240,237,232,0.62)" }}>{otd}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MiraOverviewPanel() {
  const [open, setOpen] = useState(false);
  const FIL = open ? 480 : 380;
  const FIL_CAP = "calc(100vw - 184px)";

  const tileStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 11, padding: "11px 14px",
    background: "rgba(14,8,26,0.72)", border: `1px solid ${ACCENT}2a`,
    borderRadius: 10, cursor: "pointer", textAlign: "left",
    backdropFilter: "blur(8px)", transition: "all .2s",
    color: "rgba(240,237,232,0.9)", textDecoration: "none", width: "100%",
  };

  return (
    <div className="mira-overview" style={{ pointerEvents: "none" }}>
      <div style={{
        position: "absolute", top: 14, left: 8, width: "min(520px, 94vw)", height: 240, pointerEvents: "none",
        background: `radial-gradient(ellipse 48% 70% at 46% 0%, ${ACCENT}${open ? "44" : "22"}, ${ACCENT}0a 46%, transparent 72%)`,
        filter: "blur(10px)", transition: "all .5s ease",
      }} />

      <div
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((o) => !o); } }}
        role="button" tabIndex={0} aria-label="Toggle overview panel" aria-expanded={open}
        style={{ position: "relative", height: 40, cursor: "pointer", pointerEvents: "auto", userSelect: "none" }}
      >
        <div style={{
          position: "absolute", top: 14, left: 8, width: `min(${FIL}px, ${FIL_CAP})`, height: 2, borderRadius: 2,
          background: FILAMENT,
          boxShadow: `0 0 10px ${ACCENT}, 0 0 26px ${ACCENT}${open ? ", 0 0 54px " + ACCENT : ""}`,
          transition: "all .5s ease",
        }} />
        <div style={{
          position: "absolute", top: 11, left: open ? `min(${FIL}px, ${FIL_CAP})` : 6, width: 8, height: 8, borderRadius: "50%",
          background: "#f5f3ff", boxShadow: `0 0 10px ${ACCENT}, 0 0 18px ${ACCENT}`,
          transition: "left .5s ease", pointerEvents: "none",
        }} />
        <span style={{
          position: "absolute", top: 20, left: 10, fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.34em",
          color: `rgba(221,214,254,${open ? 0.9 : 0.55})`, transition: "color .4s",
        }}>OVERVIEW</span>
      </div>

      <div style={{ paddingLeft: 14, paddingTop: 6, width: "fit-content", maxWidth: "calc(100vw - 28px)", pointerEvents: "auto" }}>
        <Clock />
        {open && (
          <div style={{ marginTop: 16, width: 250, display: "flex", flexDirection: "column", gap: 8 }}>
            {TILES.map(({ key, icon: Icon, label, href }) => (
              <a key={key} href={href} target="_blank" rel="noopener noreferrer" style={tileStyle}>
                <span style={{ display: "flex", color: ACCENT }}><Icon size={16} /></span>
                <span style={{ flex: 1, fontSize: 11.5, letterSpacing: "0.05em", lineHeight: 1.2 }}>{label}</span>
                <ArrowUpRight size={12} style={{ color: `${ACCENT}88`, flex: "none" }} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
