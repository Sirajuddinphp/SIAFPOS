import path from "node:path";
import { BrowserWindow, Menu, app, session } from "electron";
import { logger } from "../logger/logger";

let mainWindow: BrowserWindow | null = null;

export function createMainWindow(): BrowserWindow {
  installContentSecurityPolicy();
  Menu.setApplicationMenu(null);

  const preloadPath = path.join(__dirname, "../preload/index.js");
  const webPreferences: Electron.WebPreferences & { enableRemoteModule: boolean } = {
    preload: preloadPath,
    contextIsolation: true,
    nodeIntegration: false,
    enableRemoteModule: false,
    webSecurity: true,
    sandbox: true
  };

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1180,
    minHeight: 700,
    show: false,
    title: "MealHi5 POS",
    backgroundColor: "#F5F7FA",
    webPreferences
  });

  mainWindow.once("ready-to-show", () => {
    logger.info("application", "Main window ready to show");
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    logger.info("application", "Main window closed");
    mainWindow = null;
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl) => {
    logger.error("application", "Renderer failed to load", { errorCode, errorDescription, validatedUrl });
  });

  void loadRenderer(mainWindow);
  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

async function loadRenderer(window: BrowserWindow): Promise<void> {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl) {
    logger.info("application", "Loading renderer from Vite dev server", { devServerUrl });
    await window.loadURL(devServerUrl);
    window.webContents.openDevTools({ mode: "detach" });
    return;
  }

  const rendererIndex = path.join(app.getAppPath(), "dist-renderer", "index.html");
  logger.info("application", "Loading packaged renderer", { rendererIndex });
  await window.loadFile(rendererIndex);
}

function installContentSecurityPolicy(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
    const connectSrc = isDev ? "connect-src 'self' http://127.0.0.1:5173 ws://127.0.0.1:5173;" : "connect-src 'self';";
    const scriptSrc = isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval';" : "script-src 'self';";
    const csp = [
      "default-src 'self';",
      scriptSrc,
      "style-src 'self' 'unsafe-inline';",
      "img-src 'self' data:;",
      connectSrc
    ].join(" ");

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [csp]
      }
    });
  });
}
