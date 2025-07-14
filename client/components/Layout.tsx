import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import BottomNavigation from "./BottomNavigation";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  // Hide bottom nav on welcome/onboarding screens
  const hideBottomNav =
    location.pathname === "/" || location.pathname.startsWith("/onboarding");

  return (
    <div className="relative min-h-screen-safe bg-background">
      {/* Main content */}
      <main
        className={`${hideBottomNav ? "h-screen-safe" : "h-screen-safe-no-nav"} overflow-hidden`}
      >
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideBottomNav && <BottomNavigation />}
    </div>
  );
}
