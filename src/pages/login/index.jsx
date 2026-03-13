import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import Input from "../../components/ui/Input"
import Button from "../../components/ui/Button"
import AppIcon from "../../components/AppIcon"

export default function LoginPage(){
const [username,setUsername] = useState("")
const [password,setPassword] = useState("")
const [loading,setLoading] = useState(false)
const navigate = useNavigate()

const handleLogin = async () => {

setLoading(true)

const { data:profile, error } = await supabase
.from("profiles")
.select("*")
.eq("username",username)
.single()

if(error || !profile){
alert("User not found")
setLoading(false)
return
}

if(profile.is_blocked){
alert("Your account is blocked")
setLoading(false)
return
}

const res = await fetch("http://localhost:5000/api/get-email",{
method:"POST",
headers:{ "Content-Type":"application/json"},
body:JSON.stringify({ userId:profile.id })
})

const { email } = await res.json()

const { error:loginError } =
await supabase.auth.signInWithPassword({
email,
password
})

if(loginError){
alert("Invalid password")
setLoading(false)
return
}

await supabase
.from("lobby")
.delete()
.eq("user_id", profile.id)

await supabase.from("lobby").insert({
  user_id: profile.id,
  username: profile.username,
  status: "waiting"
});

navigate("/lobby");
}

return(
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
            Welcome Back
          </h2>
          <p className="text-muted-foreground text-center font-caption">
            Sign in to continue your speaking practice
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-4">
            <Input
              placeholder="Username"
              value={username}
              onChange={(e)=>setUsername(e.target.value)}
              className="bg-background/50 border-white/10 focus:border-primary/50"
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              className="bg-background/50 border-white/10 focus:border-primary/50"
            />
          </div>

          <Button
            className="w-full h-12 text-lg mt-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
            onClick={handleLogin}
            loading={loading}
          >
            Sign In
          </Button>
        </div>

        <div className="text-center mt-8 pt-6 border-t border-white/5">
          <p className="text-sm text-muted-foreground font-caption">
            New student? 
            <button
              className="font-semibold text-primary hover:text-primary/80 hover:underline ml-2 transition-colors"
              onClick={() => navigate("/signup")}
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
)
}