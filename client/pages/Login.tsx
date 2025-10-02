import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    try {
      const usersRaw = localStorage.getItem("users");
      const users = usersRaw ? JSON.parse(usersRaw) : [];
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (!user) {
        setError("Invalid email or password");
        return;
      }
      localStorage.setItem("currentUser", JSON.stringify(user));
      navigate("/create-profile");
    } catch (err) {
      setError("Unexpected error");
    }
  };

  const handleSocial = (provider: "google" | "apple") => {
    // Simulate social auth: create or find a user
    const usersRaw = localStorage.getItem("users");
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    let user = users.find((u: any) => u.email && u.provider === provider);
    if (!user) {
      user = { id: `social-${provider}-${Date.now()}`, email: `${provider}@example.com`, provider };
      users.push(user);
      localStorage.setItem("users", JSON.stringify(users));
    }
    localStorage.setItem("currentUser", JSON.stringify(user));
    navigate("/create-profile");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-6">
      <div className="w-full max-w-md bg-card rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Sign in to your account</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
          <Button variant="outline" onClick={() => handleSocial("google")}>Google</Button>
          <Button variant="outline" onClick={() => handleSocial("apple")}>Apple</Button>
        </div>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          Don't have an account? <button onClick={() => navigate("/signup")} className="text-primary font-medium hover:underline">Sign up now</button>
        </div>
      </div>
    </div>
  );
}
