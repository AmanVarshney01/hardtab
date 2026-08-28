import { Toaster } from "@find-space/ui/components/sonner";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { useEffect } from "react";

import { useThemeId } from "@/lib/theme-store";
import { getTheme, isDarkTheme, uiVars } from "@/lib/themes";

import "../index.css";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      { title: "find-space — one tab in 100,000 lines of Java" },
      {
        name: "description",
        content: "Somewhere in 100,000 lines of enterprise Java, someone used a tab. Find it.",
      },
    ],
    links: [{ rel: "icon", href: "/favicon.svg" }],
  }),
});

function RootComponent() {
  const themeId = useThemeId();
  useEffect(() => {
    const theme = getTheme(themeId);
    const style = document.documentElement.style;
    for (const [k, v] of Object.entries(uiVars(theme))) style.setProperty(k, v);
    document.documentElement.classList.toggle("dark", isDarkTheme(theme));
    document.documentElement.style.colorScheme = isDarkTheme(theme) ? "dark" : "light";
  }, [themeId]);

  return (
    <>
      <HeadContent />
      <div className="min-h-svh">
        <Outlet />
      </div>
      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          className: "font-mono! text-xs! rounded-none! border-border! bg-ink-2! text-foreground!",
        }}
      />
    </>
  );
}
