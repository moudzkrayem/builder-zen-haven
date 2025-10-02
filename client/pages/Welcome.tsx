import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { Heart, Sparkles, Users, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button as UiButton } from "@/components/ui/button";

export default function Welcome() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setShowSplash(false), 6000);
    return () => clearTimeout(timeout);
  }, []);

  if (showSplash) {
    return (
      <div className="h-screen-safe flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 animate-fade-in">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F2ddd6c77a8df4501aa9e8730dda91175?format=webp&width=800"
              alt="Trybe Logo"
              className="w-36 h-20 object-contain"
            />
          </div>
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen-safe bg-gradient-to-br from-primary/10 via-background to-accent/20 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-16 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
        <div className="absolute bottom-1/4 right-10 w-24 h-24 bg-primary/15 rounded-full blur-xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-between h-full px-6 py-12">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="mb-8 animate-bounce-in">
            <div className="relative">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F5c6becf7cef04a3db5d3620ce9b103bd%2F2ddd6c77a8df4501aa9e8730dda91175?format=webp&width=800"
                alt="Trybe Logo"
                className="w-32 h-16 object-contain"
              />
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>
          </div>

          <p className="text-xl text-muted-foreground mb-12 max-w-sm leading-relaxed">
            <span className="text-primary font-medium">Try new. Belong more.</span>
          </p>

          <div className="flex flex-col space-y-4 mb-16">
            <div className="flex items-center space-x-3 text-foreground/80">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm">Meet like-minded people</span>
            </div>
            <div className="flex items-center space-x-3 text-foreground/80">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-sm">Discover local events</span>
            </div>
            <div className="flex items-center space-x-3 text-foreground/80">
              <Heart className="w-5 h-5 text-primary" />
              <span className="text-sm">Share meaningful moments</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <UiButton
            onClick={() => navigate("/login")}
            className="w-full h-14 text-lg font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Get Started
          </UiButton>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-medium">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <UiButton
              variant="outline"
              className="h-12 rounded-xl border-2 hover:border-primary/50 transition-all duration-200"
              onClick={() => navigate("/home")}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </UiButton>

            <UiButton
              variant="outline"
              className="h-12 rounded-xl border-2 hover:border-primary/50 transition-all duration-200"
              onClick={() => navigate("/home")}
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Apple
            </UiButton>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/home")}
                className="text-primary font-medium hover:underline transition-all duration-200"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
