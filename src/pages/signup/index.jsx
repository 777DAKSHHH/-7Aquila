import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AppIcon from "../../components/AppIcon";
import { supabase } from "../../supabaseClient";

export default function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    // Implementation for signup logic would go here
    // For now, just simulating a delay
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // navigate("/login");
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden text-foreground">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>

      <div className="w-full max-w-md p-6 relative z-10">
        <div className="backdrop-blur-xl bg-card/80 border border-white/10 shadow-2xl rounded-2xl p-8 md:p-10 transform transition-all hover:scale-[1.01] duration-500">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 ring-4 ring-primary/5 shadow-lg shadow-primary/20">
              <div className="scale-150"><AppIcon /></div>
            </div>
            <h2 className="text-3xl font-heading font-bold text-foreground text-center mb-2">
              Create Account
            </h2>
            <p className="text-muted-foreground text-center font-caption">
              Join the platform to start your journey
            </p>
          </div>

          <div className="space-y-4">
            <Input placeholder="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} className="bg-background/50 border-white/10 focus:border-primary/50" />
            <Input placeholder="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} className="bg-background/50 border-white/10 focus:border-primary/50" />
            <Input placeholder="Username" name="username" value={formData.username} onChange={handleChange} className="bg-background/50 border-white/10 focus:border-primary/50" />
            <Input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} className="bg-background/50 border-white/10 focus:border-primary/50" />
            <Input type="password" placeholder="Confirm Password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="bg-background/50 border-white/10 focus:border-primary/50" />
            
            {error && <p className="text-sm text-error text-center font-medium animate-pulse">{error}</p>}
            
            <Button className="w-full h-12 text-lg mt-4 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300" onClick={handleSignup} loading={loading}>
              Sign Up
            </Button>
          </div>

          <div className="text-center mt-8 pt-6 border-t border-white/5">
            <p className="text-sm text-muted-foreground font-caption">
              Already have an account? 
              <button className="font-semibold text-primary hover:text-primary/80 hover:underline ml-2 transition-colors" onClick={() => navigate("/login")}>
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}