import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, FileText, Scale, AlertCircle, UserCheck, Shield, Ban } from "lucide-react";

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsOfServiceModal({ isOpen, onClose }: TermsOfServiceModalProps) {
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

  return (
    <div 
      className="fixed inset-x-0 top-0 bottom-20 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-7rem)] bg-card rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold">Terms of Service</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
          {/* Last Updated */}
          <div className="text-sm text-muted-foreground">
            Last Updated: November 13, 2025
          </div>

          {/* Introduction */}
          <section>
            <p className="text-muted-foreground">
              Welcome to Trybe! These Terms of Service ("Terms") govern your access to and use of the Trybe mobile application, website, and services (collectively, the "Service"). By accessing or using Trybe, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <UserCheck className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">1. Acceptance of Terms</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground space-y-2">
              <p>
                By creating an account or using Trybe, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. These Terms apply to all users, including visitors, registered users, and premium subscribers.
              </p>
              <p>
                You must be at least 18 years old to use Trybe. By using our Service, you represent and warrant that you meet this age requirement.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <UserCheck className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">2. Account Registration and Responsibilities</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground space-y-3">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Account Creation</h4>
                <p>To use certain features of Trybe, you must register for an account. You agree to:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your information to keep it accurate</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Account Security</h4>
                <p>
                  You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account. Trybe will not be liable for any loss or damage arising from your failure to protect your account credentials.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">3. User Conduct and Prohibited Activities</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground space-y-3">
              <p>When using Trybe, you agree NOT to:</p>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">Prohibited Content</h4>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Post false, misleading, or deceptive information</li>
                  <li>Share content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable</li>
                  <li>Upload or share sexually explicit content</li>
                  <li>Post content that promotes violence, discrimination, or hatred</li>
                  <li>Share content that infringes on intellectual property rights</li>
                  <li>Impersonate any person or entity</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Prohibited Actions</h4>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Harass, bully, stalk, or threaten other users</li>
                  <li>Use the Service for any commercial or promotional purpose without permission</li>
                  <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Use automated systems (bots, scrapers) without permission</li>
                  <li>Collect or harvest user information without consent</li>
                  <li>Reverse engineer or attempt to extract source code</li>
                  <li>Create multiple accounts to abuse features or evade bans</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">4. Content and Intellectual Property</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground space-y-3">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Your Content</h4>
                <p>
                  You retain ownership of any content you post on Trybe. By posting content, you grant Trybe a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, publish, and distribute your content in connection with operating and improving the Service.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Trybe's Intellectual Property</h4>
                <p>
                  The Trybe Service, including its design, features, graphics, text, and code, is owned by Trybe and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our Service without express written permission.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Content Moderation</h4>
                <p>
                  Trybe reserves the right to review, remove, or modify any content that violates these Terms or is otherwise objectionable. We may also suspend or terminate accounts that repeatedly violate our policies.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Scale className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">5. Events and Community Guidelines</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground space-y-3">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Event Creation</h4>
                <p>When creating events on Trybe, you agree to:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Provide accurate event information</li>
                  <li>Host events in safe, legal, and appropriate locations</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Respect participants and maintain a welcoming environment</li>
                  <li>Cancel events responsibly with adequate notice</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Event Participation</h4>
                <p>
                  Trybe is a platform that connects users for events and activities. We do not organize, sponsor, or supervise events. Users participate at their own risk. Trybe is not responsible for the conduct of event organizers or participants, or for any damage, injury, or loss resulting from event participation.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Safety</h4>
                <p>
                  We encourage all users to exercise caution and good judgment when attending events or meeting other users. Always meet in public places, inform friends or family of your plans, and trust your instincts.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">6. Premium Subscriptions and Payments</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground space-y-3">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Subscription Terms</h4>
                <p>
                  Trybe offers premium subscription plans with additional features. By subscribing, you agree to pay the applicable fees and any applicable taxes.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Billing</h4>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Subscriptions automatically renew unless cancelled</li>
                  <li>You will be charged at the start of each billing period</li>
                  <li>Fees are non-refundable except as required by law</li>
                  <li>We may change subscription fees with advance notice</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Cancellation</h4>
                <p>
                  You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period. You will continue to have access to premium features until the subscription expires.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Ban className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">7. Termination and Suspension</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground space-y-2">
              <p>
                Trybe reserves the right to suspend or terminate your account at any time, with or without notice, for any reason, including:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Behavior that harms other users or Trybe</li>
                <li>Non-payment of subscription fees</li>
                <li>Extended inactivity</li>
              </ul>
              <p className="mt-3">
                You may delete your account at any time through the app settings. Upon termination, your access to the Service will cease, and we may delete your data in accordance with our Privacy Policy.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">8. Disclaimers and Limitation of Liability</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground space-y-3">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Service "As Is"</h4>
                <p>
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">No Guarantee</h4>
                <p>
                  Trybe does not guarantee that the Service will be uninterrupted, secure, or error-free. We do not warrant the accuracy or reliability of any content or information obtained through the Service.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Limitation of Liability</h4>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRYBE AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Your access to or use of (or inability to access or use) the Service</li>
                  <li>Any conduct or content of any third party on the Service</li>
                  <li>Any content obtained from the Service</li>
                  <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">9. Indemnification</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground">
              <p>
                You agree to indemnify, defend, and hold harmless Trybe and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses, including reasonable attorney's fees, arising out of or in any way connected with:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Your access to or use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Your content posted on the Service</li>
              </ul>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Scale className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">10. Dispute Resolution</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground space-y-3">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Governing Law</h4>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Arbitration</h4>
                <p>
                  Any dispute arising out of or relating to these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except that either party may seek injunctive or equitable relief in court to prevent infringement of intellectual property rights.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Class Action Waiver</h4>
                <p>
                  You agree to resolve disputes with Trybe on an individual basis and waive your right to participate in class action lawsuits or class-wide arbitration.
                </p>
              </div>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">11. Changes to Terms</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground">
              <p>
                Trybe reserves the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website or through the app. Your continued use of the Service after such changes constitutes acceptance of the revised Terms.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">12. Miscellaneous</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground space-y-3">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Severability</h4>
                <p>
                  If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Waiver</h4>
                <p>
                  No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or any other term.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Entire Agreement</h4>
                <p>
                  These Terms, together with our Privacy Policy, constitute the entire agreement between you and Trybe regarding the Service.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Assignment</h4>
                <p>
                  You may not assign or transfer these Terms without our prior written consent. Trybe may assign these Terms without restriction.
                </p>
              </div>
            </div>
          </section>

          {/* Section 13 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">13. Contact Information</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground">
              <p>If you have any questions about these Terms, please contact us:</p>
              <ul className="list-none mt-3 space-y-1">
                <li><strong>Email:</strong> <a href="mailto:legal@trybe.app" className="text-primary hover:underline">legal@trybe.app</a></li>
                <li><strong>Support:</strong> <a href="mailto:support@trybe.app" className="text-primary hover:underline">support@trybe.app</a></li>
                <li><strong>Website:</strong> <a href="https://trybe.app" className="text-primary hover:underline">trybe.app</a></li>
              </ul>
            </div>
          </section>

          {/* Acknowledgment */}
          <section className="bg-muted/30 p-4 rounded-xl">
            <h3 className="text-lg font-semibold mb-3">Acknowledgment</h3>
            <p className="text-sm text-muted-foreground">
              By using Trybe, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these Terms, you must discontinue use of the Service immediately.
            </p>
          </section>
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 sm:p-6 border-t border-border bg-muted/20 flex-shrink-0">
          <Button onClick={onClose} className="w-full">
            I Accept the Terms
          </Button>
        </div>
      </div>
    </div>
  );
}
