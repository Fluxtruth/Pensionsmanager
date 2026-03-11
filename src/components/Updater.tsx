"use client";

import { useEffect, useState, useCallback } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { UpdateDialog, type UpdateState, type UpdateInfo } from "./UpdateDialog";

export function Updater() {
    const [state, setState] = useState<UpdateState>("idle");
    const [isOpen, setIsOpen] = useState(false);
    const [info, setInfo] = useState<UpdateInfo | null>(null);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const checkForUpdates = useCallback(async (manual = false) => {
        if (!('__TAURI_INTERNALS__' in window)) return;
        
        setState("checking");
        if (manual) setIsOpen(true);

        try {
            const update = await check();
            if (update) {
                setInfo({
                    version: update.version,
                    body: update.body
                });
                setState("available");
                setIsOpen(true);
            } else {
                setState(manual ? "uptodate" : "idle");
            }
        } catch (err) {
            console.error("Update error:", err);
            setError(String(err));
            setState("error");
            if (manual) setIsOpen(true);
        }
    }, []);

    const handleInstall = async () => {
        if (!('__TAURI_INTERNALS__' in window)) return;
        
        try {
            const update = await check();
            if (!update) {
                 setState("idle");
                 return;
            }

            setState("downloading");
            setProgress(0);

            let lastProgress = 0;
            await update.downloadAndInstall((event) => {
                if (event.event === 'Started') {
                    setState("downloading");
                } else if (event.event === 'Progress') {
                    // Update progress (0-100)
                    if (event.data.chunkLength) {
                        // Sometimes chunkLength is missing or 0
                        lastProgress += (event.data.chunkLength / 1024 / 1024); // mock-ish progress or just use steps
                    }
                    // Since Tauri v2 event data might vary, we show a semi-determined progress if possible
                    // Realistically we often get a total and current.
                } else if (event.event === 'Finished') {
                    setState("installing");
                }
            });

            setState("ready");
        } catch (err) {
            console.error("Install error:", err);
            setError(String(err));
            setState("error");
        }
    };

    useEffect(() => {
        // Initial check on mount
        setTimeout(() => checkForUpdates(false), 2000);

        // Global listener for manual checks
        const handleManualCheck = () => checkForUpdates(true);
        window.addEventListener('check-for-updates', handleManualCheck);

        return () => window.removeEventListener('check-for-updates', handleManualCheck);
    }, [checkForUpdates]);

    return (
        <UpdateDialog
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            updateInfo={info}
            state={state}
            progress={progress}
            error={error}
            onInstall={handleInstall}
            onCheck={() => checkForUpdates(true)}
        />
    );
}
