import React, { useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import BottomNavigation from "./BottomNavigation";
import { initAnalytics, recordPageEnter, recordPageLeave, log } from "../lib/analytics";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  // Hide bottom nav on welcome/onboarding screens
  const hideBottomNav =
    location.pathname === "/" ||
    location.pathname.startsWith("/onboarding") ||
    location.pathname === "/create-profile";

  useEffect(() => {
    initAnalytics();
    // record initial page enter
    recordPageEnter(location.pathname + location.search);
    log(`Entered ${location.pathname}`);
    return () => {
      recordPageLeave(location.pathname + location.search);
      log(`Left ${location.pathname}`);
    };
    // we intentionally run this once on mount; additional page changes handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // on every location change, mark leave for previous and enter for new
    recordPageEnter(location.pathname + location.search);
    log(`Navigated to ${location.pathname}`);
    return () => {
      recordPageLeave(location.pathname + location.search);
      log(`Leaving ${location.pathname}`);
    };
  }, [location.pathname, location.search]);

  return (
    <div className="relative min-h-screen-safe bg-background">
      {/* Main content */}
      <main
        className={`${hideBottomNav ? "min-h-screen-safe" : "min-h-screen-safe-no-nav"} ${
          location.pathname === "/create-profile" ? "overflow-y-auto" : "overflow-hidden"
        }`}
      >
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideBottomNav && <BottomNavigation />}
    </div>
  );
}
