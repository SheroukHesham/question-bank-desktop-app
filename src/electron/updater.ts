import log from "electron-log";
import { BrowserWindow } from "electron";
import electronUpdater from "electron-updater";
const { autoUpdater } = electronUpdater;

export function initAutoUpdater(mainWindow: BrowserWindow) {
  autoUpdater.logger = log;
  (autoUpdater.logger as typeof log).transports.file.level = "info";

  autoUpdater.on("checking-for-update", () => {
    log.info("Checking for update...");
  });

  autoUpdater.on("update-available", (info) => {
    mainWindow.webContents.send("update:available", info.version);
  });

  autoUpdater.on("update-not-available", () => {
    log.info("No update available.");
  });

  autoUpdater.on("error", (err) => {
    log.error("Update error:", err);
  });

  autoUpdater.on("download-progress", (progress) => {
    mainWindow.webContents.send(
      "update:progress",
      Math.round(progress.percent),
    );
  });

  autoUpdater.on("update-downloaded", (info) => {
    mainWindow.webContents.send("update:downloaded", info.version);
  });

  // Check on launch, and again every 4 hours while the app stays open.
  autoUpdater.checkForUpdatesAndNotify();
  setInterval(() => autoUpdater.checkForUpdatesAndNotify(), 4 * 60 * 60 * 1000);
}
