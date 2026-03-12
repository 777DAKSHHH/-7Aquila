import { supabaseAdmin } from "../config/supabaseAdmin.js"

export const getUserEmail = async(req,res)=>{

const { userId } = req.body

const { data, error } =
await supabaseAdmin.auth.admin.getUserById(userId)

if(error){
return res.status(500).json({error:error.message})
}

return res.json({
email:data.user.email
})

}