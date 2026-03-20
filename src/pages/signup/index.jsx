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
    setError("");

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);

      // Step 1: Create Auth User
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (signUpError) throw signUpError;

      const user = data.user;

      if (!user) {
        throw new Error("User not created");
      }

      // Step 2: Insert into profiles table
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id, // MUST match auth.uid()
        email: formData.email,
        username: formData.username,
        full_name: formData.fullName
      });

      if (profileError) throw profileError;

      // Success
      navigate("/login");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

      <div className="w-full max-w-md p-6 relative z-20">
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 md:p-10">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-primary">
              <div className="scale-125"><AppIcon /></div>
            </div>
            <h2 className="text-3xl font-heading font-bold text-foreground text-center mb-2">
              Create Account
            </h2>
            <p className="text-muted-foreground text-center font-caption">
              Join the platform to start your journey
            </p>
          </div>

          <div className="space-y-4">
            <Input placeholder="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} className="h-11 bg-slate-50 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 placeholder:text-slate-400" />
            <Input placeholder="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} className="h-11 bg-slate-50 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 placeholder:text-slate-400" />
            <Input placeholder="Username" name="username" value={formData.username} onChange={handleChange} className="h-11 bg-slate-50 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 placeholder:text-slate-400" />
            <Input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} className="h-11 bg-slate-50 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 placeholder:text-slate-400" />
            <Input type="password" placeholder="Confirm Password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="h-11 bg-slate-50 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 placeholder:text-slate-400" />
            
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100 text-center font-medium">{error}</p>}
            
            <Button className="w-full h-12 text-lg mt-4 font-medium shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300" onClick={handleSignup} loading={loading}>
              Sign Up
            </Button>
          </div>

          <div className="text-center mt-8 pt-6 border-t border-slate-100">
            <p className="text-sm text-muted-foreground font-caption">
              Already have an account? 
              <button className="font-semibold text-primary hover:text-blue-700 hover:underline ml-2 transition-colors" onClick={() => navigate("/login")}>
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}