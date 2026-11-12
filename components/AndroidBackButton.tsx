"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export default function AndroidBackButton() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") {
      return;
    }

    let listener: { remove: () => Promise<void> } | undefined;
    let mounted = true;

    const setupListener = async () => {
      const handle = await App.addListener(
        "backButton",
        ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            void App.minimizeApp();
          }
        }
      );

      if (mounted) {
        listener = handle;
      } else {
        await handle.remove();
      }
    };

    void setupListener();

    return () => {
      mounted = false;
      void listener?.remove();
    };
  }, []);

  return null;
}