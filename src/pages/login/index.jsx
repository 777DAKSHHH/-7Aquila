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

<div className="min-h-screen flex items-center justify-center bg-background text-foreground">

<div className="w-full max-w-md p-8 bg-card rounded-xl border border-border">

<div className="flex justify-center mb-6">
<AppIcon />
</div>

<h2 className="text-xl text-center text-white mb-6">
Rocket Speaking Platform
</h2>

<Input
placeholder="Username"
value={username}
onChange={(e)=>setUsername(e.target.value)}
/>

<div className="mt-4">

<Input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
/>

</div>

<Button
className="mt-6 w-full"
onClick={handleLogin}
loading={loading}
>

Sign In

</Button>

<div className="text-center mt-6 text-sm text-muted-foreground">
  New student?
  <button
    className="font-semibold text-primary hover:underline ml-1"
    onClick={() => navigate("/signup")}
  >
    Create Account
  </button>
</div>

</div>

</div>

)
}