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

const res = await fetch("https://l-hit-aged7aquila.onrender.com/api/get-email",{
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
              className="h-11 bg-slate-50 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 placeholder:text-slate-400"
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              className="h-11 bg-slate-50 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <Button
            className="w-full h-12 text-lg mt-2 font-medium shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300"
            onClick={handleLogin}
            loading={loading}
          >
            Sign In
          </Button>
        </div>

        <div className="text-center mt-8 pt-6 border-t border-slate-100">
          <p className="text-sm text-muted-foreground font-caption">
            New student? 
            <button
              className="font-semibold text-primary hover:text-blue-700 hover:underline ml-2 transition-colors"
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