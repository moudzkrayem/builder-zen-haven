import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Shield, Lock, Eye, Database, Bell, Globe } from "lucide-react";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
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
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold">Privacy Policy</h2>
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
              At Trybe, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Database className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">1. Information We Collect</h3>
            </div>
            
            <div className="space-y-4 ml-7 text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Personal Information</h4>
                <p>We collect information that you provide directly to us, including:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Name, age, and profile information</li>
                  <li>Email address and phone number</li>
                  <li>Profile photos and additional images</li>
                  <li>Location data (city, state)</li>
                  <li>Interests, hobbies, and preferences</li>
                  <li>Professional information (occupation, education)</li>
                  <li>Bio and personal descriptions</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Usage Information</h4>
                <p>We automatically collect certain information when you use Trybe:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Device information (model, operating system, unique identifiers)</li>
                  <li>Log data (IP address, browser type, pages visited)</li>
                  <li>Event participation and creation history</li>
                  <li>Chat messages and communications</li>
                  <li>App usage patterns and preferences</li>
                  <li>Geolocation data (with your permission)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Social Media Information</h4>
                <p>If you connect your social media accounts, we may collect:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Public profile information</li>
                  <li>Profile pictures</li>
                  <li>Social media handles</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Eye className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">2. How We Use Your Information</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground space-y-2">
              <p>We use the information we collect to:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Create and manage your account</li>
                <li>Facilitate event creation and participation</li>
                <li>Connect you with other users and communities</li>
                <li>Enable messaging and communication features</li>
                <li>Personalize your experience and recommendations</li>
                <li>Send notifications about events and activities</li>
                <li>Improve and optimize our services</li>
                <li>Detect and prevent fraud and abuse</li>
                <li>Comply with legal obligations</li>
                <li>Communicate with you about updates and features</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">3. Information Sharing and Disclosure</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground space-y-3">
              <div>
                <h4 className="font-semibold text-foreground mb-2">With Other Users</h4>
                <p>Your profile information, photos, and event participation may be visible to other Trybe users based on your privacy settings.</p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Service Providers</h4>
                <p>We may share information with third-party service providers who perform services on our behalf, including:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Cloud hosting providers (Firebase, Google Cloud)</li>
                  <li>Analytics services</li>
                  <li>Payment processors</li>
                  <li>Customer support tools</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Legal Requirements</h4>
                <p>We may disclose your information if required by law or in response to valid legal requests, such as:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Subpoenas or court orders</li>
                  <li>Government or regulatory investigations</li>
                  <li>Protection of our rights and safety</li>
                  <li>Prevention of fraud or illegal activities</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Business Transfers</h4>
                <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Lock className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">4. Data Security</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground space-y-2">
              <p>We implement appropriate technical and organizational measures to protect your information, including:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and monitoring</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
              <p className="mt-3">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">5. Your Privacy Rights</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground space-y-2">
              <p>You have the right to:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Restriction:</strong> Limit how we process your information</li>
                <li><strong>Object:</strong> Object to certain data processing activities</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, please contact us at <a href="mailto:privacy@trybe.app" className="text-primary hover:underline">privacy@trybe.app</a>.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Database className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">6. Data Retention</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground">
              <p>
                We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. When you delete your account, we will delete or anonymize your information within 90 days, except where we need to retain it for legal or regulatory purposes.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">7. Children's Privacy</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground">
              <p>
                Trybe is not intended for users under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child under 18, we will take steps to delete such information promptly.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">8. Changes to This Policy</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of Trybe after any changes indicates your acceptance of the updated policy.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">9. Contact Us</h3>
            </div>
            
            <div className="ml-7 text-muted-foreground">
              <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
              <ul className="list-none mt-3 space-y-1">
                <li><strong>Email:</strong> <a href="mailto:privacy@trybe.app" className="text-primary hover:underline">privacy@trybe.app</a></li>
                <li><strong>Support:</strong> <a href="mailto:support@trybe.app" className="text-primary hover:underline">support@trybe.app</a></li>
                <li><strong>Website:</strong> <a href="https://trybe.app" className="text-primary hover:underline">trybe.app</a></li>
              </ul>
            </div>
          </section>

          {/* California Privacy Rights */}
          <section className="bg-muted/30 p-4 rounded-xl">
            <h3 className="text-lg font-semibold mb-3">California Privacy Rights</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Right to know what personal information is collected</li>
                <li>Right to know whether personal information is sold or disclosed</li>
                <li>Right to opt-out of the sale of personal information</li>
                <li>Right to deletion of personal information</li>
                <li>Right to non-discrimination for exercising CCPA rights</li>
              </ul>
              <p className="mt-3">
                We do not sell your personal information. To exercise your CCPA rights, please contact us at <a href="mailto:privacy@trybe.app" className="text-primary hover:underline">privacy@trybe.app</a>.
              </p>
            </div>
          </section>

          {/* GDPR Notice */}
          <section className="bg-muted/30 p-4 rounded-xl">
            <h3 className="text-lg font-semibold mb-3">European Users (GDPR)</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have additional rights under the General Data Protection Regulation (GDPR):
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Right to access your personal data</li>
                <li>Right to rectification of inaccurate data</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
                <li>Right to withdraw consent</li>
              </ul>
              <p className="mt-3">
                Our legal basis for processing your information includes consent, contract performance, legitimate interests, and legal obligations.
              </p>
            </div>
          </section>
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 sm:p-6 border-t border-border bg-muted/20 flex-shrink-0">
          <Button onClick={onClose} className="w-full">
            I Understand
          </Button>
        </div>
      </div>
    </div>
  );
}
