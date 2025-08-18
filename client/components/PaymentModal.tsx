import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  CreditCard,
  Lock,
  Check,
  Crown,
  Calendar,
  User,
} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  onPaymentSuccess 
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    email: "",
    billingAddress: "",
    city: "",
    zipCode: "",
  });

  if (!isOpen) return null;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess();
      onClose();
      // Reset form
      setPaymentData({
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardholderName: "",
        email: "",
        billingAddress: "",
        city: "",
        zipCode: "",
      });
    }, 3000);
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const cleanValue = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formattedValue = cleanValue.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formattedValue.slice(0, 19); // Limit to 16 digits + 3 spaces
  };

  const formatExpiryDate = (value: string) => {
    // Remove all non-digit characters
    const cleanValue = value.replace(/\D/g, '');
    // Add slash after 2 digits
    if (cleanValue.length >= 2) {
      return `${cleanValue.slice(0, 2)}/${cleanValue.slice(2, 4)}`;
    }
    return cleanValue;
  };

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
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Premium Subscription</h2>
            <p className="text-muted-foreground">
              Complete your payment to unlock exclusive features
            </p>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handlePayment} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Pricing Summary */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/10 rounded-2xl p-4 border border-primary/20 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Trybe Premium Monthly</span>
              <span className="text-2xl font-bold text-primary">$14.99</span>
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              7-day free trial • Cancel anytime
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Access to exclusive premium events</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Enhanced privacy and member screening</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Premium community features</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={paymentData.email}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                  required
                  disabled={isProcessing}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            {/* Card Information */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Information *</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="cardNumber"
                  value={paymentData.cardNumber}
                  onChange={(e) =>
                    setPaymentData({ 
                      ...paymentData, 
                      cardNumber: formatCardNumber(e.target.value)
                    })
                  }
                  placeholder="1234 1234 1234 1234"
                  required
                  disabled={isProcessing}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="expiryDate"
                    value={paymentData.expiryDate}
                    onChange={(e) =>
                      setPaymentData({ 
                        ...paymentData, 
                        expiryDate: formatExpiryDate(e.target.value)
                      })
                    }
                    placeholder="MM/YY"
                    required
                    disabled={isProcessing}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="cvv"
                    value={paymentData.cvv}
                    onChange={(e) =>
                      setPaymentData({ 
                        ...paymentData, 
                        cvv: e.target.value.replace(/\D/g, '').slice(0, 4)
                      })
                    }
                    placeholder="123"
                    required
                    disabled={isProcessing}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Cardholder Name */}
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name *</Label>
              <Input
                id="cardholderName"
                value={paymentData.cardholderName}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, cardholderName: e.target.value })
                }
                placeholder="John Doe"
                required
                disabled={isProcessing}
                className="rounded-xl"
              />
            </div>

            {/* Billing Address */}
            <div className="space-y-2">
              <Label htmlFor="billingAddress">Billing Address *</Label>
              <Input
                id="billingAddress"
                value={paymentData.billingAddress}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, billingAddress: e.target.value })
                }
                placeholder="123 Main Street"
                required
                disabled={isProcessing}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={paymentData.city}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, city: e.target.value })
                  }
                  placeholder="New York"
                  required
                  disabled={isProcessing}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={paymentData.zipCode}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, zipCode: e.target.value })
                  }
                  placeholder="10001"
                  required
                  disabled={isProcessing}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center space-x-2 mt-6 p-3 bg-accent/20 rounded-xl">
            <Lock className="w-4 h-4 text-green-600" />
            <span className="text-sm text-muted-foreground">
              Your payment information is encrypted and secure
            </span>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20">
          <div className="space-y-3">
            <Button 
              type="submit"
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5 mr-2" />
                  Start Free Trial - $0 Today
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isProcessing}
              className="w-full rounded-xl"
            >
              Cancel
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center mt-3">
            You'll be charged $14.99/month after your 7-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
