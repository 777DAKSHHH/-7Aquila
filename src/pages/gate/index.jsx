import { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AppIcon from "../../components/AppIcon";

const MASTER_PASSWORD = import.meta.env.VITE_GATE_PASSWORD;

export default function GatePage({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnter = () => {
    setLoading(true);
    setError("");

    // Small delay to simulate a password check.
    setTimeout(() => {
      if (password === MASTER_PASSWORD) {
        onSuccess();
      } else {
        setError("Incorrect password.");
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden text-foreground">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>

      {/* Main Card */}
      <div className="w-full max-w-md p-6 relative z-10">
        <div className="backdrop-blur-xl bg-card/80 border border-white/10 shadow-2xl rounded-2xl p-8 md:p-10 transform transition-all hover:scale-[1.01] duration-500">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 ring-4 ring-primary/5 shadow-lg shadow-primary/20">
              <div className="scale-150"><AppIcon /></div>
            </div>
            <h2 className="text-3xl font-heading font-bold text-foreground text-center mb-2">
              Welcome
            </h2>
            <p className="text-muted-foreground text-center font-caption">
              Enter the master password to access the platform.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter Access Password"
                value={password}
                autoFocus
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                onKeyPress={(e) => e.key === "Enter" && handleEnter()}
                className="h-12 text-center text-lg tracking-widest bg-background/50 border-white/10 focus:border-primary/50 transition-all"
              />
            </div>
            {error && <p className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center font-medium animate-pulse">{error}</p>}
            <Button className="w-full h-12 text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300" onClick={handleEnter} loading={loading}>
              Enter Platform
            </Button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground/60 font-caption uppercase tracking-wider">
              Protected Secure Environment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
