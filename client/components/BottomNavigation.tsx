import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  MessageCircle,
  User,
  Search,
  Settings,
  Heart,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvents } from "@/contexts/EventsContext";

const navItems = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/swipe", icon: ArrowLeftRight, label: "Swipe" },
  { path: "/chats", icon: MessageCircle, label: "Chats" },
  { path: "/profile", icon: User, label: "Profile" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { chats } = useEvents();
  
  // Calculate total unread count
  const totalUnreadCount = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="grid grid-cols-5 h-20">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-all duration-200",
                "hover:bg-accent/50 active:scale-95",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "relative p-2 rounded-xl transition-all duration-200",
                  isActive && "bg-primary/10",
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    "transition-all duration-200",
                    isActive && "scale-110",
                  )}
                />
                {/* Show unread badge on chats icon */}
                {item.path === "/chats" && totalUnreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </div>
                )}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
