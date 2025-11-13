import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Instagram, Facebook, ExternalLink } from "lucide-react";

interface SocialLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const socialLinks = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    url: "https://www.instagram.com/trybe.app",
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    handle: "@trybe.app",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: TikTokIcon,
    url: "https://www.tiktok.com/@trybe.app",
    color: "bg-black",
    handle: "@trybe.app",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    url: "https://www.facebook.com/trybe.app",
    color: "bg-blue-600",
    handle: "Trybe",
  },
];

export default function SocialLinksModal({ isOpen, onClose }: SocialLinksModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="fixed inset-x-0 top-0 bottom-20 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-7rem)] bg-card rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Follow Trybe</h2>
            <p className="text-sm text-muted-foreground mt-1">Connect with us on social media</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <button
                key={social.id}
                onClick={() => openLink(social.url)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-accent transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full ${social.color} flex items-center justify-center text-white flex-shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{social.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {social.handle}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            );
          })}

          <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground text-center">
              Stay updated with the latest events, features, and community news!
            </p>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 sm:p-6 border-t border-border bg-muted/20 flex-shrink-0">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
