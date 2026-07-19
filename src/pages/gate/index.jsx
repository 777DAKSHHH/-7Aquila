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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Light Blue Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 z-0"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl"></div>

      {/* Main Card */}
      <div className="w-full max-w-md p-6 relative z-20">
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 md:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-primary">
              <div className="scale-125"><AppIcon /></div>
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
                className="h-12 text-center text-lg tracking-widest bg-slate-50 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
            {error && <p className="p-3 rounded-lg bg-red-50 text-red-600 border border-red-100 text-sm text-center font-medium">{error}</p>}
            <Button className="w-full h-12 text-lg font-medium shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300" onClick={handleEnter} loading={loading}>
              Enter Platform
            </Button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-caption uppercase tracking-wider font-semibold">
              Protected Secure Environment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
