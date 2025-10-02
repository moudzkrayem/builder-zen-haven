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


          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
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
