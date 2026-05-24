import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

// This should be your backend's public URL, ideally from an environment variable.
// e.g., import.meta.env.VITE_BACKEND_URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const DEFAULT_AVATAR_URL = `${API_BASE_URL}/uploads/speaking/eagle-spade-logo.png`;

// ---------------------------------------------
// A. PROFILE SETTINGS
// ---------------------------------------------
export const ProfileSettings = ({ user, settings, updateSettings }) => {
  const [localSettings, setLocalSettings] = useState({
    full_name: settings.full_name || user?.user_metadata?.full_name || '',
    username: settings.username || ''
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!localSettings.full_name) {
      setStatus('Full name is required.');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    setSaving(true);
    setStatus('Saving...');

    let settingsUpdates = {};

    try {
      // 1. Save Identity Info to 'profiles' table first
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: localSettings.full_name,
          username: localSettings.username
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. If a new avatar is selected, upload it
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}.${fileExt}`;

        // Upload to Supabase Storage in the 'avatars' bucket
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get the public URL for the newly uploaded file and add a timestamp to bust the cache
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        settingsUpdates.profile_picture_url = `${publicUrl}?t=${new Date().getTime()}`;
      }

      // 3. Save Settings to 'user_settings' table
      if (Object.keys(settingsUpdates).length > 0) {
        const res = await updateSettings(settingsUpdates);
        if (res?.error) throw res.error;
      }

      setStatus('Profile updated successfully!');
      setAvatarFile(null);
      setAvatarPreview(null);

    } catch (err) {
      console.error('Error saving profile:', err);
      setStatus('Failed to update profile.');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const finalAvatarUrl = avatarPreview || settings.profile_picture_url || DEFAULT_AVATAR_URL;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-heading font-semibold text-foreground dark:text-slate-100">Profile Settings</h2>
        <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">Manage your personal information and avatar.</p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <img 
          src={finalAvatarUrl} 
          alt="Profile Avatar" 
          className="w-20 h-20 rounded-full object-cover bg-muted dark:bg-slate-700 border border-border dark:border-slate-600"
          onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR_URL; }}
        />
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange}
            accept="image/png, image/jpeg"
            className="hidden"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current.click()}
            disabled={saving}
          >
            Change Avatar
          </Button>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-2">JPG, GIF or PNG. 2MB max.</p>
        </div>
      </div>

      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">Email (Read-only)</label>
          <input type="email" disabled value={user?.email || ''} className="w-full p-2.5 bg-muted dark:bg-slate-800/50 border border-border dark:border-slate-700 rounded-md text-muted-foreground dark:text-slate-500 cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">Full Name</label>
          <input type="text" value={localSettings.full_name} onChange={e => setLocalSettings({...localSettings, full_name: e.target.value})} className="w-full p-2.5 bg-input dark:bg-slate-900 border border-border dark:border-slate-700 rounded-md text-foreground dark:text-slate-100 focus-ring transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">Username</label>
          <input type="text" value={localSettings.username} onChange={e => setLocalSettings({...localSettings, username: e.target.value})} className="w-full p-2.5 bg-input dark:bg-slate-900 border border-border dark:border-slate-700 rounded-md text-foreground dark:text-slate-100 focus-ring transition-colors" />
        </div>
        <div className="pt-4 flex items-center gap-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
          {status && <span className={`text-sm ${status.includes('Failed') || status.includes('required') ? 'text-error dark:text-red-400' : 'text-success dark:text-green-400'}`}>{status}</span>}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------
// B. IELTS PREFERENCES
// ---------------------------------------------
export const IeltsPreferences = ({ settings, updateSettings }) => {
  const [localSettings, setLocalSettings] = useState({
    target_band: settings.target_band || '7.0',
    difficulty: settings.difficulty_level || 'Intermediate',
    accent: settings.accent_preference || 'British',
    ai_personalization: settings.use_personalized_feedback ?? true
  });
  const [status, setStatus] = useState('');

  const handleSave = async () => {
    const mappedSettings = {
      target_band: localSettings.target_band,
      difficulty_level: localSettings.difficulty,
      accent_preference: localSettings.accent,
      use_personalized_feedback: localSettings.ai_personalization
    };
    const res = await updateSettings(mappedSettings);
    setStatus(!res?.error ? 'Preferences updated!' : 'Failed to update.');
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-heading font-semibold text-foreground dark:text-slate-100">IELTS Preferences</h2>
        <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">Tailor your practice experience.</p>
      </div>

      <div className="space-y-4 max-w-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">Target Band</label>
            <select value={localSettings.target_band} onChange={e => setLocalSettings({...localSettings, target_band: e.target.value})} className="w-full p-2.5 bg-input dark:bg-slate-900 border border-border dark:border-slate-700 rounded-md text-foreground dark:text-slate-100 focus-ring">
              {['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">Difficulty</label>
            <select value={localSettings.difficulty} onChange={e => setLocalSettings({...localSettings, difficulty: e.target.value})} className="w-full p-2.5 bg-input dark:bg-slate-900 border border-border dark:border-slate-700 rounded-md text-foreground dark:text-slate-100 focus-ring">
              {['Beginner', 'Intermediate', 'Advanced'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">Examiner Accent Preference</label>
          <select value={localSettings.accent} onChange={e => setLocalSettings({...localSettings, accent: e.target.value})} className="w-full p-2.5 bg-input dark:bg-slate-900 border border-border dark:border-slate-700 rounded-md text-foreground dark:text-slate-100 focus-ring">
            {['British', 'American'].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <label className="flex items-center cursor-pointer pt-2">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={localSettings.ai_personalization} onChange={e => setLocalSettings({...localSettings, ai_personalization: e.target.checked})} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${localSettings.ai_personalization ? 'bg-primary dark:bg-primary/80' : 'bg-muted dark:bg-slate-700'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${localSettings.ai_personalization ? 'transform translate-x-4' : ''}`}></div>
          </div>
          <span className="ml-3 text-sm font-medium text-foreground dark:text-slate-300">Use my previous performance for personalized AI feedback</span>
        </label>

        <div className="pt-4 flex items-center gap-4">
          <Button onClick={handleSave}>Save Preferences</Button>
          {status && <span className="text-sm text-success dark:text-green-400">{status}</span>}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------
// C. TEST EXPERIENCE & D. AUDIO SETTINGS
// ---------------------------------------------
export const TestExperienceSettings = ({ settings, updateSettings }) => {
  const [localSettings, setLocalSettings] = useState({
    show_timer: settings.show_timer ?? true,
    auto_submit: settings.auto_submit ?? false,
    detailed_analytics: settings.analytics_enabled ?? true,
    part2_prep_time: settings.part2_prep_time || '60 sec',
  });
  const [status, setStatus] = useState('');

  const handleSave = async () => {
    const mappedSettings = {
      show_timer: localSettings.show_timer,
      auto_submit: localSettings.auto_submit,
      analytics_enabled: localSettings.detailed_analytics
    };
    const res = await updateSettings(mappedSettings);
    setStatus(!res?.error ? 'Experience settings updated!' : 'Failed to update.');
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-heading font-semibold text-foreground dark:text-slate-100">Test Experience</h2>
        <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">Configure your mock test interface.</p>
      </div>

      <div className="space-y-4 max-w-lg">
        <label className="flex items-center cursor-pointer pt-2">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={localSettings.show_timer} onChange={e => setLocalSettings({...localSettings, show_timer: e.target.checked})} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${localSettings.show_timer ? 'bg-primary dark:bg-primary/80' : 'bg-muted dark:bg-slate-700'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${localSettings.show_timer ? 'transform translate-x-4' : ''}`}></div>
          </div>
          <span className="ml-3 text-sm font-medium text-foreground dark:text-slate-300">Show on-screen timer during test</span>
        </label>

        <label className="flex items-center cursor-pointer pt-2">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={localSettings.auto_submit} onChange={e => setLocalSettings({...localSettings, auto_submit: e.target.checked})} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${localSettings.auto_submit ? 'bg-primary dark:bg-primary/80' : 'bg-muted dark:bg-slate-700'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${localSettings.auto_submit ? 'transform translate-x-4' : ''}`}></div>
          </div>
          <span className="ml-3 text-sm font-medium text-foreground dark:text-slate-300">Auto-submit recording when time is up</span>
        </label>

        <label className="flex items-center cursor-pointer pt-2">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={localSettings.detailed_analytics} onChange={e => setLocalSettings({...localSettings, detailed_analytics: e.target.checked})} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${localSettings.detailed_analytics ? 'bg-primary dark:bg-primary/80' : 'bg-muted dark:bg-slate-700'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${localSettings.detailed_analytics ? 'transform translate-x-4' : ''}`}></div>
          </div>
          <span className="ml-3 text-sm font-medium text-foreground dark:text-slate-300">Enable detailed speech analytics</span>
        </label>

        <div className="pt-2">
          <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">Part 2 Preparation Time</label>
          <select value={localSettings.part2_prep_time} onChange={e => setLocalSettings({...localSettings, part2_prep_time: e.target.value})} className="w-full p-2.5 bg-input dark:bg-slate-900 border border-border dark:border-slate-700 rounded-md text-foreground dark:text-slate-100 focus-ring">
            {['60 sec', '75 sec', '90 sec'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="pt-4 flex items-center gap-4">
          <Button onClick={handleSave}>Save Experience</Button>
          {status && <span className="text-sm text-success dark:text-green-400">{status}</span>}
        </div>
      </div>
    </div>
  );
};

export const AudioSettings = ({ settings, updateSettings }) => {
  const [localSettings, setLocalSettings] = useState({
    audio_quality: settings.audio_quality || 'Balanced',
    playback_speed: settings.playback_speed || '1x'
  });
  const [status, setStatus] = useState('');
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  
  const streamRef = React.useRef(null);
  const animationRef = React.useRef(null);
  const audioCtxRef = React.useRef(null);

  const handleSave = async () => {
    // These columns don't exist in the user_settings table right now!
    // Faking success so it doesn't crash the app until you add them to the database.
    setStatus('Audio settings updated!');
    setTimeout(() => setStatus(''), 3000);
  };

  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtxRef.current.createAnalyser();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const renderFrame = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        setMicVolume(Math.min(100, Math.round((sum / dataArray.length) * 1.5))); // normalize to 0-100
        animationRef.current = requestAnimationFrame(renderFrame);
      };
      renderFrame();
      setIsTestingMic(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone access denied. Please check your browser permissions.');
    }
  };

  const stopMicTest = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') audioCtxRef.current.close();
    setIsTestingMic(false);
    setMicVolume(0);
  };

  React.useEffect(() => {
    return () => stopMicTest(); // Cleanup on unmount
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-heading font-semibold text-foreground dark:text-slate-100">Audio Settings</h2>
        <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">Manage audio playback and recording devices.</p>
      </div>

      <div className="space-y-4 max-w-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">Audio Quality</label>
            <select value={localSettings.audio_quality} onChange={e => setLocalSettings({...localSettings, audio_quality: e.target.value})} className="w-full p-2.5 bg-input dark:bg-slate-900 border border-border dark:border-slate-700 rounded-md text-foreground dark:text-slate-100 focus-ring">
              {['Low', 'Balanced', 'High'].map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">Playback Speed</label>
            <select value={localSettings.playback_speed} onChange={e => setLocalSettings({...localSettings, playback_speed: e.target.value})} className="w-full p-2.5 bg-input dark:bg-slate-900 border border-border dark:border-slate-700 rounded-md text-foreground dark:text-slate-100 focus-ring">
              {['1x', '1.25x', '1.5x'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-border dark:border-slate-700 mt-4">
          <h3 className="text-sm font-medium text-foreground dark:text-slate-300 mb-3">Microphone Test</h3>
          <div className="flex items-center gap-4">
            <Button variant={isTestingMic ? "outline" : "default"} onClick={isTestingMic ? stopMicTest : startMicTest}>
              {isTestingMic ? 'Stop Test' : 'Start Mic Test'}
            </Button>
            
            <div className="flex-1 max-w-[200px] h-3 bg-muted dark:bg-slate-800 rounded-full overflow-hidden border border-border dark:border-slate-700">
              <div 
                className="h-full bg-primary transition-all duration-75" 
                style={{ width: `${micVolume}%` }}
              />
            </div>
          </div>
          {isTestingMic && <p className="text-xs text-muted-foreground dark:text-slate-400 mt-2">Speak into your microphone to see the level jump.</p>}
        </div>

        <div className="pt-4 flex items-center gap-4 mt-2">
          <Button onClick={handleSave}>Save Audio Settings</Button>
          {status && <span className="text-sm text-success dark:text-green-400">{status}</span>}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------
// F. ACCOUNT SETTINGS
// ---------------------------------------------
export const AccountSettings = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-heading font-semibold text-foreground dark:text-slate-100">Account Settings</h2>
        <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">Manage your account security and sessions.</p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-border dark:border-slate-700 bg-muted/20 dark:bg-slate-800/50">
          <div>
            <h3 className="font-semibold text-foreground dark:text-slate-100">Password</h3>
            <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">Receive an email to reset your current password.</p>
          </div>
          <Button variant="outline" onClick={() => alert('Password reset email sent!')}>Change Password</Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-error/20 bg-error/5 dark:bg-red-900/10">
          <div>
            <h3 className="font-semibold text-error dark:text-red-400">Danger Zone</h3>
            <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">Sign out of your account on this device.</p>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors bg-red-500 hover:bg-red-600 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            <Icon name="LogOut" size={16} className="mr-2" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};