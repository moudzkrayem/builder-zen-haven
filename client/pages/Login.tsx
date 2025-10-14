import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { auth, db } from "../firebase"; // ✅ your firebase.ts
import { doc, getDoc } from "firebase/firestore";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 🔹 Handle Email/Password Login
  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      if (!userCred.user.emailVerified) {
        setError("Please verify your email before signing in.");
        return;
      }

      // Check if user already has a profile in Firestore
      try {
        const uid = userCred.user.uid;
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          navigate("/home");
        } else {
          navigate("/create-profile");
        }
      } catch (err) {
        // if anything goes wrong, fall back to create-profile
        console.error('Error checking user profile:', err);
        navigate('/create-profile');
      }
    } catch (err: any) {
      setError(err.message || "Unexpected error");
    }
  };

  // 🔹 Handle Google Login
  const handleGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Use Firebase additionalUserInfo to detect newly created accounts.
  const isNew = (result as any).additionalUserInfo?.isNewUser;
      const uid = result.user.uid;

      if (isNew) {
        // Truly new user — send to profile creation
        navigate('/create-profile');
        return;
      }

      // Returning user: ensure they have a users/{uid} doc, otherwise fall back to create-profile
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) navigate('/home');
        else navigate('/create-profile');
      } catch (err) {
        console.error('Error checking user profile after Google sign-in', err);
        // fallback conservative behavior
        navigate('/create-profile');
      }
    } catch (err: any) {
      setError(err.message || "Google login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-6">
      <div className="w-full max-w-md bg-card rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Sign in to your account</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
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
          {error && <div className="text-sm text-destructive">{error}</div>}
          <Button type="submit" className="w-full">Sign In</Button>
        </form>

        <div className="my-4 flex items-center">
          <div className="flex-1 h-px bg-border" />
          <div className="px-3 text-sm text-muted-foreground">Or continue with</div>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={handleGoogle}>Google</Button>
          <Button variant="outline" disabled>Apple</Button>
        </div>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          Don’t have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-primary font-medium hover:underline"
          >
            Sign up now
          </button>
        </div>
      </div>
    </div>
  );
}
