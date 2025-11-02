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

const App = () => (
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

createRoot(document.getElementById("root")!).render(<App />);
