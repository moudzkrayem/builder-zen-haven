import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, CreditCard, Check, Star, Zap, Crown, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const plans = [
  {
    id: "free",
    name: "Trybe Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Browse unlimited events",
      "Join up to 5 events per month",
      "Basic chat features",
      "Standard profile",
    ],
    current: false,
  },
  {
    id: "plus",
    name: "Trybe Plus",
    price: "$9.99",
    period: "month",
    description: "Enhanced experience for active users",
    features: [
      "Everything in Free",
      "Unlimited event joining",
      "Priority in event queues",
      "Advanced filters",
      "Read receipts in chat",
      "See who viewed your profile",
      "Boost your profile visibility",
    ],
    current: true,
    popular: true,
  },
  {
    id: "premium",
    name: "Trybe Premium",
    price: "$9.99",
    period: "month",
    description: "Ultimate social experience",
    features: [
      "Everything in Plus",
      "Exclusive premium events",
      "Early access to new features",
      "Priority customer support",
      "Custom profile themes",
      "Advanced analytics",
      "Verified badge",
    ],
    current: false,
  },
];

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState("plus");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-x-4 top-8 bottom-8 bg-card rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Subscription</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Current Plan */}
          <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-primary">Current Plan</h3>
              <Badge className="bg-primary text-primary-foreground">Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              You're currently subscribed to Trybe Plus. Your next billing date is March 15, 2024.
            </p>
            <div className="flex items-center justify-between">
              <span className="font-medium">Trybe Plus - $9.99/month</span>
              <Button variant="outline" size="sm">
                Manage Billing
              </Button>
            </div>
          </div>

          {/* Plans */}
          <h3 className="text-lg font-semibold mb-4">Choose Your Plan</h3>
          <div className="space-y-4">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const Icon = plan.id === "free" ? Heart : plan.id === "plus" ? Zap : Crown;
              
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-accent",
                    plan.popular && "ring-2 ring-primary/20"
                  )}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold">{plan.name}</h4>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{plan.price}</div>
                      <div className="text-sm text-muted-foreground">/{plan.period}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {plan.current && (
                    <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center space-x-2 text-green-600">
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Current Plan</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Usage Stats */}
          <div className="mt-6 p-4 rounded-2xl bg-muted/50">
            <h4 className="font-semibold mb-3">This Month's Usage</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">12</div>
                <div className="text-xs text-muted-foreground">Events Joined</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">47</div>
                <div className="text-xs text-muted-foreground">Profile Views</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">23</div>
                <div className="text-xs text-muted-foreground">New Connections</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20">
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={onClose} 
              className="flex-1"
              disabled={plans.find(p => p.id === selectedPlan)?.current}
            >
              {plans.find(p => p.id === selectedPlan)?.current ? "Current Plan" : "Upgrade Plan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
