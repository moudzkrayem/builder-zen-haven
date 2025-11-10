import "./global.css";

import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { EventsProvider } from "./contexts/EventsContext";
import Layout from "./components/Layout";
import Welcome from "./pages/Welcome";
import ProfileCreation from "./pages/ProfileCreation";
import VerifyEmail from "./pages/VerifyEmail";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Swipe from "./pages/Swipe";
import Chats from "./pages/Chats";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AdminPage from "./pages/Admin";
import RequireAuth from "@/components/RequireAuth";

// Startup splash removed to let `Welcome` render its original splash reliably.

const queryClient = new QueryClient();

const App = () => {
  // Protect against pages restored from the browser back/forward cache (bfcache)
  // which can show stale, authenticated content after sign-out. When a page is
  // restored from bfcache the `pageshow` event has `persisted === true`.
  // Reloading in that case forces a fresh auth check.
  React.useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      try {
        if ((e as any).persisted) {
          window.location.reload();
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('pageshow', handler as EventListener);
    return () => window.removeEventListener('pageshow', handler as EventListener);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="trybe-ui-theme">
        <EventsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Layout>
                <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/create-profile" element={<ProfileCreation />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
                <Route path="/swipe" element={<RequireAuth><Swipe /></RequireAuth>} />
                <Route path="/chats" element={<RequireAuth><Chats /></RequireAuth>} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </EventsProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

const rootEl = document.getElementById('root')!;
const root = createRoot(rootEl);

// Delay mounting until Firebase Auth state is known to avoid races where
// parts of the app try to read/write Firestore before the user is identified.
// This prevents issues where `auth.currentUser` is undefined during
// subscribe/create chat flows.
import { auth as _auth, onUserChanged } from './auth';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

// Try to enable persistent auth so refresh keeps the user signed in.
try {
  void setPersistence(_auth, browserLocalPersistence).catch((e) => {
    // Non-blocking; log for debugging
    console.warn('[auth] setPersistence failed', e);
  });
} catch (e) {
  // ignore in environments where persistence cannot be set
}

let mounted = false;
function mountApp() {
  if (mounted) return;
  mounted = true;
  root.render(<App />);
}

// Use our auth helper to wait until auth state is known before mounting.
// This avoids races where components call Firestore writes/reads expecting
// a signed-in user immediately.
onUserChanged((user) => {
  // expose for quick debugging in development
  try { (window as any)._currentUser = user || null; } catch (e) {}
  console.log('[auth] state changed ->', user ? user.uid : 'not-signed-in');
  mountApp();
});

// Fallback: if onUserChanged doesn't fire for some reason, mount after a short timeout
setTimeout(() => {
  mountApp();
}, 2000);
