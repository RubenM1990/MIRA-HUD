import MiraHud from "@/components/MiraHud";
import MiraOverviewPanel from "@/components/MiraOverviewPanel";

export default function Home() {
  return (
    <main id="main" style={{ position: "relative", height: "100vh", minHeight: 620, overflow: "hidden" }}>
      {/* Top-left overview HUD: clock, weather, on this day, social links */}
      <MiraOverviewPanel />

      {/* The world: field, ring, particle core, centre lines, status bar. Tap the orb. */}
      <MiraHud />

      {/* Repo link - remove or replace for your own use */}
      <a
        href="https://github.com/RubenM1990/MIRA-HUD"
        target="_blank"
        rel="noopener noreferrer"
        className="repo-pill"
      >
        View on GitHub ↗
      </a>
    </main>
  );
}
