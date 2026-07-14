import { spawn } from "node:child_process";
import path from "node:path";

const systemRoot = process.env.SystemRoot ?? "C:\\Windows";
const system32Path = path.join(systemRoot, "System32");
const cmdPath = path.join(system32Path, "cmd.exe");
const currentPath = process.env.PATH ?? "";

const env = {
  ...process.env,
  ComSpec: cmdPath,
  ELECTRON_RUN_AS_NODE: "",
  PATH: currentPath.toLowerCase().includes(system32Path.toLowerCase())
    ? currentPath
    : `${currentPath};${system32Path}`
};

const concurrentlyBin = path.resolve("node_modules", "concurrently", "dist", "bin", "concurrently.js");

const child = spawn(process.execPath, [concurrentlyBin, "-k", "npm:dev:renderer", "npm:dev:electron"], {
  stdio: "inherit",
  env,
  shell: false
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
