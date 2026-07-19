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
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) setSettings(data);
      } catch (err) {
        console.error('Error fetching user settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const updateSettings = async (updates) => {
    try {
      const updatePayload = { ...settings, ...updates, user_id: user.id };
      if (settings.id) updatePayload.id = settings.id; // Retain PK if exists

      const { data, error } = await supabase
        .from('user_settings')
        .upsert(updatePayload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      return { success: true };
    } catch (err) {
      console.error('Error updating user settings:', err);
      return { success: false, error: err };
    }
  };

  return { settings, loading, updateSettings };
};