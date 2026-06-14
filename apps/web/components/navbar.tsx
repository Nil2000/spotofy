"use client";

import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";
import ThemeToggle from "./theme-toggle";
import Logo from "./logo";

export type NavbarProps = {
  children?: React.ReactNode;
  leftContent?: React.ReactNode;
  logoSize?: "sm" | "md";
  className?: string;
  containerClassName?: string;
};

export default function Navbar({
  children,
  leftContent,
  logoSize = "md",
  className = "fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50",
  containerClassName = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
}: NavbarProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  return (
    <nav className={className}>
      <div className={containerClassName}>
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 sm:gap-4">
            <Logo size={logoSize} />
            {leftContent && (
              <>
                <div className="h-6 w-px bg-border hidden sm:block" />
                {leftContent}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {children}
            {session && (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
