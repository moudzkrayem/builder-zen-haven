import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { sendEmailVerification, reload } from "firebase/auth";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [message, setMessage] = useState(
    "We sent a verification link to your email. Please check your inbox."
  );
  const [sending, setSending] = useState(false);
  const email = auth.currentUser?.email || "your email";

  // 🔹 Poll for email verification
  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await reload(auth.currentUser); // refresh user info
        if (auth.currentUser.emailVerified) {
          setMessage("✅ Email verified successfully! Redirecting…");
          clearInterval(interval);
          // If the user already has a profile document, go to home, otherwise create-profile
          try {
            const uid = auth.currentUser.uid;
            const userDoc = await getDoc(doc(db, 'users', uid));
            setTimeout(() => {
              if (userDoc.exists()) navigate('/home');
              else navigate('/create-profile');
            }, 1500);
          } catch (err) {
            console.error('Error checking user profile after verification', err);
            setTimeout(() => navigate('/create-profile'), 1500);
          }
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  // 🔹 Resend verification email
  const handleResend = async () => {
    if (!auth.currentUser) {
      setMessage("⚠️ No user is signed in to resend verification.");
      return;
    }
    setSending(true);
    try {
      await sendEmailVerification(auth.currentUser, {
        url: "http://localhost:5173/verify-email", // change in prod
        handleCodeInApp: true,
      });
      setMessage(`✅ Verification link resent to ${auth.currentUser.email}`);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-6">
      <div className="w-full max-w-md bg-card rounded-2xl p-6 shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Verify your email</h2>

        <p className="text-sm text-muted-foreground mb-4">
          {message}
          <br />
          <strong>{email}</strong>
        </p>

        <div className="flex gap-3 justify-center">
          <Button onClick={handleResend} disabled={sending}>
            {sending ? "Resending…" : "Resend link"}
          </Button>
          <Button variant="outline" onClick={() => navigate("/login")}>
            Back to sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
