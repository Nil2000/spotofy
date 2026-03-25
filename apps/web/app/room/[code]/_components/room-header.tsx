import Link from "next/link";
import { LogOut } from "lucide-react";

import Navbar from "@/components/navbar";
import type { ConnectionState } from "@/types/websocket";
import ConnectionStatusIcon from "./connection-status-icon";

type RoomHeaderProps = {
  code: string;
  connectionState: ConnectionState;
};

export default function RoomHeader({
  code,
  connectionState,
}: RoomHeaderProps) {
  return (
    <Navbar
      className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50"
      leftContent={
        <div className="flex items-center gap-2">
          <ConnectionStatusIcon connectionState={connectionState} />
          <span className="font-mono text-sm font-semibold tracking-wider">
            {code}
          </span>
        </div>
      }
    >
      <Link
        href="/join"
        className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-border bg-card/80 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium hover:bg-muted hover:border-primary/30 transition-all"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Leave</span>
      </Link>
    </Navbar>
  );
}
