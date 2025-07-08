import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get `__dirname` equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isGithubActor = process.env.NEXT_PUBLIC_GITHUB_ACTOR === "upsidedownlabs" || process.env.NEXT_PUBLIC_GITHUB_ACTOR === undefined;

// Get the BASE_PATH dynamically
const basePath = isGithubActor ? "" : "/m2w";


// Define the manifest object
const manifest = {
  name: "m2w",
  short_name: "m2w",
  start_url: `${basePath}/`,
  display: "standalone",
  icons: [
    { src: `${basePath}/Muscle-logo-192x192.png`, sizes: "192x192", type: "image/png" },
    { src: `${basePath}/Muscle-logo-512x512.png`, sizes: "512x512", type: "image/png" },
  ],
  screenshots: [
    { src: `${basePath}/image.png`, sizes: "1280x720", type: "image/png", form_factor: "wide" },
  ],
};

// Generate `manifest.json` in the `public/` directory
const outputPath = path.join(__dirname, "../public/manifest.json");
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));


