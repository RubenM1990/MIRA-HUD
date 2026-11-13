"use client";

// WebGL + three.js must never render on the server.
import dynamic from "next/dynamic";

const MiraWorld = dynamic(() => import("./MiraWorld"), { ssr: false });

export default function MiraHud() {
  return <MiraWorld />;
}
