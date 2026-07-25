import { supabaseAdmin } from "../config/supabaseAdmin.js";
import multer from "multer";

// Multer memory storage configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  }
}).single("avatar");

export const uploadAvatar = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    
    try {
      const { userId } = req.body;
      const file = req.file;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required." });
      }
      
      if (!file) {
        return res.status(400).json({ success: false, message: "No avatar image file provided." });
      }
      
      const fileExt = file.originalname.split(".").pop();
      const filePath = `${userId}.${fileExt}`;
      
      // Upload buffer directly to Supabase Storage bypassing storage policies via admin client
      const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
        .from("avatars")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: "3600",
          upsert: true
        });
        
      if (uploadErr) throw uploadErr;
      
      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from("avatars")
        .getPublicUrl(filePath);
        
      const profilePictureUrl = `${publicUrl}?t=${new Date().getTime()}`;
      
      // Update in user_settings table
      const { data: settingsData, error: settingsErr } = await supabaseAdmin
        .from("user_settings")
        .update({ profile_picture_url: profilePictureUrl })
        .eq("user_id", userId)
        .select()
        .single();
        
      if (settingsErr) throw settingsErr;
      
      return res.status(200).json({
        success: true,
        message: "Avatar uploaded successfully.",
        profilePictureUrl
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  });
};
