import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // 1. Fetch user settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (settingsError) throw settingsError;

        // 2. Fetch profile details
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, username')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        setSettings({
          ...(settingsData || {}),
          full_name: profileData?.full_name || user?.user_metadata?.full_name || '',
          username: profileData?.username || '',
        });
      } catch (err) {
        console.error('Error fetching user settings and profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const updateSettings = async (updates) => {
    try {
      const merged = { ...settings, ...updates };
      // Strip profile fields so they aren't sent to user_settings table
      const { full_name, username, ...settingsPayload } = merged;
      settingsPayload.user_id = user.id;
      if (settings.id) settingsPayload.id = settings.id; // Retain PK if exists

      const { data, error } = await supabase
        .from('user_settings')
        .upsert(settingsPayload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      
      setSettings({
        ...data,
        full_name: merged.full_name,
        username: merged.username
      });
      return { success: true };
    } catch (err) {
      console.error('Error updating user settings:', err);
      return { success: false, error: err };
    }
  };

  return { settings, loading, updateSettings };
};