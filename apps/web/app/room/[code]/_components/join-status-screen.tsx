import Link from "next/link";
import { motion } from "motion/react";
import { Clock, LogOut } from "lucide-react";

import type { ConnectionState, JoinState } from "@/types/websocket";
import ConnectionStatusIcon from "./connection-status-icon";

type JoinStatusScreenProps = {
  connectionState: ConnectionState;
  joinState: JoinState;
  joinError: string | null;
};

export default function JoinStatusScreen({
  connectionState,
  joinState,
  joinError,
}: JoinStatusScreenProps) {
  const joinStatusTitle =
    joinState === "blocked" ? "Admin has not joined yet" : "Joining room";

  const joinStatusDescription =
    joinState === "blocked"
      ? "Please wait for the admin to join this room first. You’ll be able to access the room once the admin is online."
      : connectionState === "error"
        ? "There was a problem connecting to the room server."
        : connectionState === "disconnected"
          ? "Connecting you back to the room server."
          : "We’re connecting you to the room. This screen will update once your join succeeds.";

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-2xl rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden shadow-2xl shadow-primary/5"
    >
      <div className="relative p-6 sm:p-8">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col items-center text-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-accent/20">
            {joinState === "blocked" ? (
              <Clock className="w-8 h-8 text-primary" />
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {joinStatusTitle}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
              {joinError ?? joinStatusDescription}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-2">
            <ConnectionStatusIcon connectionState={connectionState} />
            <span className="text-sm font-medium capitalize">
              {connectionState}
            </span>
          </div>

          <Link
            href="/join"
            className="flex items-center gap-2 rounded-lg border border-border bg-card/80 px-4 py-2 text-sm font-medium hover:bg-muted hover:border-primary/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Leave room
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
