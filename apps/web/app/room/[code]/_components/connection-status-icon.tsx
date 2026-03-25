import { Wifi, WifiOff } from "lucide-react";

import type { ConnectionState } from "@/types/websocket";

type ConnectionStatusIconProps = {
  connectionState: ConnectionState;
};

export default function ConnectionStatusIcon({
  connectionState,
}: ConnectionStatusIconProps) {
  switch (connectionState) {
    case "connected":
      return <Wifi className="w-4 h-4 text-green-500" />;
    case "connecting":
      return (
        <div className="w-4 h-4 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
      );
    case "disconnected":
    case "error":
      return <WifiOff className="w-4 h-4 text-red-500" />;
  }
}
