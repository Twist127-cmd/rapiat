// Generates Rapiat's app icons (favicon / PWA / iOS) from the official logo
// (public/logo.png — the malicious piggy-bank with a vault-door snout).
// Run: node scripts/gen-icons.mjs  (or: pnpm icons)
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SOURCE = "public/logo.png";

mkdirSync("public", { recursive: true });
mkdirSync("src/app", { recursive: true });

const targets = [
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
  ["public/apple-touch-icon.png", 180],
  ["src/app/icon.png", 512],
  ["src/app/apple-icon.png", 180],
];

for (const [file, size] of targets) {
  await sharp(SOURCE).resize(size, size, { fit: "cover" }).png().toFile(file);
  console.log("écrit", file, `${size}x${size}`);
}

// Favicon (32×32 PNG saved as .ico — browsers accept PNG data in .ico).
await sharp(SOURCE).resize(32, 32, { fit: "cover" }).png().toFile("public/favicon.ico");
console.log("écrit public/favicon.ico 32x32");
