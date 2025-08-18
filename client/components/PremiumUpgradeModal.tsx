import { useState } from "react";
import { Button } from "@/components/ui/button";
import PaymentModal from "./PaymentModal";
import {
  X,
  Crown,
  Star,
  Zap,
  Check,
  Sparkles,
  TrendingUp,
  Users,
  Calendar,
  Eye,
} from "lucide-react";

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName?: string;
}

export default function PremiumUpgradeModal({
  isOpen,
  onClose,
  eventName
}: PremiumUpgradeModalProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    alert("Welcome to Trybe Premium! You now have access to all exclusive features.");
    onClose();
  };

  const premiumFeatures = [
    {
      icon: <Star className="w-5 h-5 text-yellow-500" />,
      title: "Access Premium Events",
      description: "Join exclusive high-quality events curated for premium members"
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
      title: "Priority Event Placement",
      description: "Your events get featured placement and higher visibility"
    },
    {
      icon: <Users className="w-5 h-5 text-green-500" />,
      title: "Advanced Networking",
      description: "Connect with verified premium members and expand your network"
    },
    {
      icon: <Eye className="w-5 h-5 text-purple-500" />,
      title: "Enhanced Analytics",
      description: "Detailed insights about your events and profile engagement"
    },
    {
      icon: <Calendar className="w-5 h-5 text-orange-500" />,
      title: "Unlimited Event Creation",
      description: "Create as many events as you want without restrictions"
    },
    {
      icon: <Sparkles className="w-5 h-5 text-pink-500" />,
      title: "Custom Badges & Status",
      description: "Stand out with premium badges and exclusive profile features"
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary/20 to-accent/20 p-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="absolute top-4 right-4 text-white bg-black/20 hover:bg-black/30"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upgrade to Premium</h2>
            <p className="text-muted-foreground">
              {eventName 
                ? `Unlock "${eventName}" and other premium events`
                : "Access exclusive premium events and features"
              }
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          <div className="space-y-4 mb-6">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="p-2 bg-accent/20 rounded-lg flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/10 rounded-2xl p-6 border border-primary/20 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold">$14.99</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Cancel anytime • 7-day free trial
              </p>
              
              <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>No hidden fees</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>

          {/* Special Offer */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800/50 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-yellow-600" />
              <span className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm">
                Limited Time Offer
              </span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Get your first month for just $7.99 when you upgrade today!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20">
          <div className="space-y-3">
            <Button 
              onClick={handleUpgrade}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold"
            >
              <Crown className="w-5 h-5 mr-2" />
              Start Free Trial
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full rounded-xl"
            >
              Maybe Later
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center mt-3">
            By upgrading, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
