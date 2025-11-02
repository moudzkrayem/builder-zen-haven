import React, { useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import BottomNavigation from "./BottomNavigation";
import { initAnalytics, recordPageEnter, recordPageLeave, log } from "../lib/analytics";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  // Hide bottom nav on welcome/onboarding screens and some auth routes
  const hideBottomNav =
    location.pathname === "/" ||
    location.pathname.startsWith("/onboarding") ||
    location.pathname === "/create-profile" ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/verify-email";

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

  // Ensure page starts at top when navigating between routes. Some pages
  // render inside a scrollable <main> (create-profile uses overflow-y-auto),
  // so reset both the main container and window scroll to avoid pages showing
  // scrolled in the middle on navigation.
  useEffect(() => {
    try {
      const m = document.querySelector('main');
      if (m && typeof (m as HTMLElement).scrollTo === 'function') {
        (m as HTMLElement).scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
      try { window.scrollTo(0, 0); } catch (e) {}
    } catch (err) {
      // ignore
    }
  }, [location.pathname, location.search]);

  // Per-page bottom padding map (adjust per route to provide exact fit above the bottom nav)
  const pagePaddingMap: Record<string, string> = {
    "/profile": "pb-28",
    "/settings": "pb-28",
    "/home": "pb-24",
    "/swipe": "pb-24",
    "/chats": "pb-24",
    // Add overrides here as needed
  };

  const paddingClass = hideBottomNav ? "" : (pagePaddingMap[location.pathname] ?? "pb-24");
  const overflowClass = location.pathname === "/create-profile" ? "overflow-y-auto" : "overflow-hidden";

  return (
    <div className="relative min-h-screen-safe bg-background">
      <main className={`${hideBottomNav ? "min-h-screen-safe" : "min-h-screen-safe-no-nav"} ${paddingClass} ${overflowClass}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideBottomNav && <BottomNavigation />}
    </div>
  );
}
