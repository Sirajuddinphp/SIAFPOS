import { spawn } from "node:child_process";
import path from "node:path";

const systemRoot = process.env.SystemRoot ?? "C:\\Windows";
const system32Path = path.join(systemRoot, "System32");
const cmdPath = path.join(system32Path, "cmd.exe");
const currentPath = process.env.PATH ?? "";

const env = {
  ...process.env,
  ComSpec: cmdPath,
  PATH: currentPath.toLowerCase().includes(system32Path.toLowerCase())
    ? currentPath
    : `${currentPath};${system32Path}`,
  VITE_DEV_SERVER_URL: "http://127.0.0.1:5173"
};

delete env.ELECTRON_RUN_AS_NODE;

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env,
      shell: false
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} exited with signal ${signal}`));
        return;
      }

      if ((code ?? 0) !== 0) {
        reject(new Error(`${command} exited with code ${code ?? 0}`));
        return;
      }

      resolve();
    });

    child.on("error", reject);
  });
}

async function main() {
  const waitOnBin = path.resolve("node_modules", "wait-on", "bin", "wait-on");
  const tscBin = path.resolve("node_modules", "typescript", "bin", "tsc");
  const npmCli = process.env.npm_execpath;
  const electronBin =
    process.platform === "win32"
      ? path.resolve("node_modules", "electron", "dist", "electron.exe")
      : path.resolve("node_modules", "electron", "dist", "electron");

  await run(process.execPath, [waitOnBin, "tcp:5173"]);
  await run(process.execPath, [tscBin, "-p", "tsconfig.electron.json"]);
  if (!npmCli) {
    throw new Error("npm_execpath is not available");
  }
  await run(process.execPath, [npmCli, "run", "rebuild:electron"]);

  const electron = spawn(electronBin, ["."], {
    stdio: "inherit",
    env,
    shell: false
  });

  electron.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  electron.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
