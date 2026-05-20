import React, { useState } from 'react';
import TopNav from '../../components/ui/TopNav';
import Icon from '../../components/AppIcon';
import { useUserSettings } from '../../hooks/useUserSettings';
import { useAuth } from '../../contexts/AuthContext';
import {
  ProfileSettings,
  IeltsPreferences,
  TestExperienceSettings,
  AudioSettings,
  AccountSettings
} from './components/SettingsSections';

const TABS = [
  { id: 'profile', label: 'Profile', icon: 'User' },
  { id: 'ielts', label: 'IELTS Preferences', icon: 'Target' },
  { id: 'test', label: 'Test Experience', icon: 'Monitor' },
  { id: 'audio', label: 'Audio & Mic', icon: 'Mic' },
  { id: 'account', label: 'Account', icon: 'Shield' },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();
  const { settings, loading, updateSettings } = useUserSettings();

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Icon name="Loader" className="animate-spin text-primary" size={32} />
        </div>
      );
    }

    switch(activeTab) {
      case 'profile': return <ProfileSettings user={user} settings={settings} updateSettings={updateSettings} />;
      case 'ielts': return <IeltsPreferences settings={settings} updateSettings={updateSettings} />;
      case 'test': return <TestExperienceSettings settings={settings} updateSettings={updateSettings} />;
      case 'audio': return <AudioSettings settings={settings} updateSettings={updateSettings} />;
      case 'account': return <AccountSettings />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-slate-900 transition-colors duration-300">
      <TopNav userRole="student" />
      
      <main className="container-safe py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground dark:text-slate-100">Settings</h1>
            <p className="text-muted-foreground dark:text-slate-400 mt-2 font-caption">Manage your account, preferences, and test experience.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-64 flex-shrink-0">
              <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground' 
                      : 'text-muted-foreground dark:text-slate-400 hover:bg-muted/50 dark:hover:bg-slate-800 hover:text-foreground dark:hover:text-slate-100'
                  }`}>
                    <Icon name={tab.icon} size={18} /> {tab.label}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Content Area */}
            <div className="flex-1 bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-2xl shadow-sm p-6 md:p-8 min-h-[500px] transition-colors duration-300">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default Settings;