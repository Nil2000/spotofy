"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Music, Sun, Moon, LogOut, Home } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { FaSpotify } from "react-icons/fa";

/* ------------------------------------------------------------------ */
/*  Variant-specific prop shapes                                        */
/* ------------------------------------------------------------------ */

type NavVariantHome = {
  variant: "home";
};

type NavVariantSimple = {
  variant: "simple";
};

type NavVariantAdmin = {
  variant: "admin";
  spotifyStatus: "loading" | "connected" | "disconnected";
};

type NavVariantRoom = {
  variant: "room";
  roomCode: string;
  connectionIcon: React.ReactNode;
  error?: string | null;
};

export type NavbarProps =
  | NavVariantHome
  | NavVariantSimple
  | NavVariantAdmin
  | NavVariantRoom;

/* ------------------------------------------------------------------ */
/*  Theme toggle button                                                 */
/* ------------------------------------------------------------------ */

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="rounded-xl" disabled>
        <Sun className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        variant="outline"
        size="icon"
        className="rounded-xl"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </Button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Logo                                                                */
/* ------------------------------------------------------------------ */

function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const iconSize = size === "sm" ? "w-8 h-8 sm:w-9 sm:h-9" : "w-10 h-10";
  const iconInner = size === "sm" ? "w-4 h-4 sm:w-5 sm:h-5" : "w-5 h-5";
  const textSize = size === "sm" ? "text-lg hidden sm:block" : "text-xl";

  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div
        className={`${iconSize} rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow`}
      >
        <Music className={`${iconInner} text-primary-foreground`} />
      </div>
      <span
        className={`${textSize} font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent`}
      >
        PulseQ
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                              */
/* ------------------------------------------------------------------ */

export default function Navbar(props: NavbarProps) {
  /* ---- HOME variant: fixed, blurred, with Join + Create Room ---- */
  if (props.variant === "home") {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Link
                href="/join"
                className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Join Room
              </Link>
              <Link href="/admin">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button className="px-4 py-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                    Create Room
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  /* ---- SIMPLE variant: non-fixed, logo only + theme toggle ---- */
  if (props.variant === "simple") {
    return (
      <nav className="p-4 sm:p-6 flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </nav>
    );
  }

  /* ---- ADMIN variant: logo + Home + Spotify status + theme toggle ---- */
  if (props.variant === "admin") {
    const { spotifyStatus } = props;
    return (
      <nav className="p-4 sm:p-6 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/">
            <Button variant="outline">Home</Button>
          </Link>
          {spotifyStatus === "connected" ? (
            <Button
              className="border-green-500/40 bg-green-500/15 text-green-600 hover:bg-green-500/25"
              variant="outline"
              disabled
            >
              <FaSpotify className="h-4 w-4" />
              Spotify Connected
            </Button>
          ) : spotifyStatus === "loading" ? (
            <Button variant="outline" disabled>
              <FaSpotify className="h-4 w-4" />
              Checking Spotify...
            </Button>
          ) : (
            <Link href="/api/spotify/connect">
              <Button
                className="bg-green-500 text-white hover:bg-green-700/90"
                variant="outline"
              >
                <FaSpotify className="h-4 w-4" />
                Connect Spotify
              </Button>
            </Link>
          )}
        </div>
      </nav>
    );
  }

  /* ---- ROOM variant: sticky, blurred, room code + Leave + Home + theme ---- */
  const { roomCode, connectionIcon, error } = props;
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3 sm:gap-4">
            <Logo size="sm" />
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              {connectionIcon}
              <span className="font-mono text-sm font-semibold tracking-wider">
                {roomCode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {error && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
                {error}
              </div>
            )}
            <ThemeToggle />
            <Link
              href="/join"
              className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-border bg-card/80 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium hover:bg-muted hover:border-primary/30 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Leave</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-primary/10 border border-primary/20 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-primary hover:bg-primary/20 transition-all"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
