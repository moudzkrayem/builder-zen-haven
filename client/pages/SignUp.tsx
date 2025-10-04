import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { auth } from "../firebase"; // ✅ firebase.ts file
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendEmailVerification,   // 🔹 added
} from "firebase/auth";

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 🔹 Handle Email/Password Sign Up + Verification
  const handleSignUp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please provide email and password");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // 🔹 Send verification email
      if (userCred.user) {
        await sendEmailVerification(userCred.user);
        alert("Verification email sent! Please check your inbox before logging in.");
      }

      // Instead of letting them in, redirect to verify-email page
      navigate("/verify-email"); 
    } catch (err: any) {
      setError(err.message || "Unexpected error");
    }
  };

  // 🔹 Handle Google Sign In (Google accounts are already verified)
  const handleGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/create-profile");
    } catch (err: any) {
      setError(err.message || "Google login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-6">
      <div className="w-full max-w-md bg-card rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Create an account</h2>
        
        {/* Email signup form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <Button type="submit" className="w-full">
            Sign Up
          </Button>
        </form>

        {/* Divider */}
        <div className="my-4 flex items-center">
          <div className="flex-1 h-px bg-border" />
          <div className="px-3 text-sm text-muted-foreground">Or continue with</div>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={handleGoogle}>
            Google
          </Button>
          <Button variant="outline" disabled>
            Apple
          </Button>
        </div>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
