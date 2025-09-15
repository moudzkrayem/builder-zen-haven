import React from "react";
import AdminDashboard from "../components/AdminDashboard";
import NotFound from "./NotFound";
import { ADMIN_USER_ID } from "../config/admin";

export default function AdminPage() {
  // Determine current user id. If the app had real auth this would come from context.
  const currentUserId = localStorage.getItem("currentUserId") || "user-current";

  if (currentUserId !== ADMIN_USER_ID) {
    return <NotFound />;
  }

  return <AdminDashboard />;
}
