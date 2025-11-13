"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useCurrentUser, useCurrentUserConfigs } from "@/hooks/useCurrentUser";

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [themeInitialized, setThemeInitialized] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user } = useCurrentUser();
  const { configs, loading: configsLoading } = useCurrentUserConfigs();
  const themeNameToId: Record<string, number> = { light: 1, dark: 2, system: 3 };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only set theme from DB once, on initial load
  useEffect(() => {
    const themeIdToName: Record<number, string> = { 1: "light", 2: "dark", 3: "system" };
    if (mounted && configs?.theme_id && !themeInitialized) {
      const dbTheme = themeIdToName[configs.theme_id] || "system";
      if (theme !== dbTheme) {
        setTheme(dbTheme);
      }
      setThemeInitialized(true);
    }
  }, [mounted, configs?.theme_id, setTheme, theme, themeInitialized]);

  // Function to update theme in DB using the API route
  async function updateThemePreference(newTheme: string) {
    if (!user) return;
    try {
      const res = await fetch("/api/user-configs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme_id: themeNameToId[newTheme] }),
      });
      if (!res.ok) {
        // Optionally handle error
        console.error("Failed to update theme", await res.json());
      }
    } catch (err) {
      console.error("Error updating theme", err);
    }
  }

  // Handler for theme change
  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    await updateThemePreference(newTheme);
  };

  // Extract icon logic for readability
  let ThemeIcon = <Laptop key="system" size={16} className="text-muted-foreground" />;
  if (theme === "light") ThemeIcon = <Sun key="light" size={16} className="text-muted-foreground" />;
  else if (theme === "dark") ThemeIcon = <Moon key="dark" size={16} className="text-muted-foreground" />;

  if (!mounted || configsLoading) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={"sm"}>
          {ThemeIcon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-content" align="start">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={handleThemeChange}
        >
          <DropdownMenuRadioItem className="flex gap-2" value="light">
            <Sun size={16} className="text-muted-foreground" />{" "}
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex gap-2" value="dark">
            <Moon size={16} className="text-muted-foreground" />{" "}
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex gap-2" value="system">
            <Laptop size={16} className="text-muted-foreground" />{" "}
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
