import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const builtStaticDir = path.join(root, ".next", "static");
const publicDir = path.join(root, "public");

function findStandaloneServer(startDir) {
  const entries = fs.readdirSync(startDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(startDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules") {
        continue;
      }
      const nested = findStandaloneServer(fullPath);
      if (nested) {
        return nested;
      }
      continue;
    }

    if (entry.isFile() && entry.name === "server.js") {
      return fullPath;
    }
  }

  return null;
}

const serverPath = findStandaloneServer(standaloneDir);

if (!serverPath) {
  console.error("Missing standalone server.js. Run `npm run build` first.");
  process.exit(1);
}

const appRoot = path.dirname(serverPath);
const standaloneStaticDir = path.join(appRoot, ".next", "static");
const standalonePublicDir = path.join(appRoot, "public");

fs.mkdirSync(path.dirname(standaloneStaticDir), { recursive: true });
fs.cpSync(builtStaticDir, standaloneStaticDir, { recursive: true, force: true });

if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, standalonePublicDir, { recursive: true, force: true });
}

const child = spawn(process.execPath, [serverPath], {
  cwd: appRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    HOSTNAME: process.env.HOSTNAME ?? "0.0.0.0",
    PORT: process.env.PORT ?? "3000",
    REPRO_ORIGIN:
      process.env.REPRO_ORIGIN ?? `http://127.0.0.1:${process.env.PORT ?? "3000"}`,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
