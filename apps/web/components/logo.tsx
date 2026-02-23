import Link from "next/link";
import { Music } from "lucide-react";

export default function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const iconSize = size === "sm" ? "w-8 h-8 sm:w-9 sm:h-9" : "w-10 h-10";
  const iconInner = size === "sm" ? "w-4 h-4 sm:w-5 sm:h-5" : "w-5 h-5";
  const textSize = size === "sm" ? "text-lg hidden sm:block" : "text-xl";

  return (
    <Link href="/" className="flex items-center gap-2 group shrink-0">
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
