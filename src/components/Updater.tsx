"use client";

import { useEffect, useRef } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";

export function Updater() {
    const checked = useRef(false);

    useEffect(() => {
        // Only run this once on mount
        if (checked.current) return;
        checked.current = true;

        async function checkForUpdates() {
            // Check if we are running the app in Tauri
            if (!('__TAURI_INTERNALS__' in window)) return;

            try {
                const update = await check();
                if (update) {
                    const yes = await ask(
                        `Ein Update auf Version ${update.version} ist verfügbar!\n\nRelease Notes: ${update.body || "Keine Beschreibung verfügbar."}\n\nMöchtest du das Update jetzt installieren?`,
                        {
                            title: "Update Verfügbar",
                            kind: "info",
                            okLabel: "Aktualisieren",
                            cancelLabel: "Später",
                        }
                    );

                    if (yes) {
                        await update.downloadAndInstall((event) => {
                            // We could implement a progress bar here in the future
                            console.log("Update progress", event);
                        });
                        await message("Das Update wurde installiert. Die App wird nun neu gestartet.", { title: "Update erfolgreich" });
                        await relaunch();
                    }
                }
            } catch (error) {
                const isExpected = String(error).includes("Could not fetch a valid release JSON");
                if (isExpected) {
                    console.info("Kein Update verfügbar (oder release.json noch nicht erstellt).");
                } else {
                    console.error("Fehler bei der Update-Prüfung:", error);
                }
            }
        }

        checkForUpdates();
    }, []);

    return null;
}
