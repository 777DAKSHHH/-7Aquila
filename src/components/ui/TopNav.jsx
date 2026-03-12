import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const TopNav = ({ userRole = 'student' }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location?.pathname]);

  const studentNavItems = [
    { label: 'Dashboard', path: '/test-selection-dashboard', icon: 'LayoutDashboard' },
    { label: 'Practice', path: '/speaking-test-interface', icon: 'Mic' },
    { label: 'History', path: '/practice-history', icon: 'History' },
  ];

  const facultyNavItems = [
    { label: 'Dashboard', path: '/test-selection-dashboard', icon: 'LayoutDashboard' },
    { label: 'Practice', path: '/speaking-test-interface', icon: 'Mic' },
    { label: 'History', path: '/practice-history', icon: 'History' },
    { label: 'Faculty Dashboard', path: '/faculty-dashboard', icon: 'Users' },
    { label: 'Student Review', path: '/student-audio-review', icon: 'FileAudio' },
  ];

  const navItems = userRole === 'faculty' ? facultyNavItems : studentNavItems;

  const isActive = (path) => location?.pathname === path;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] bg-card transition-all duration-base ${
          isScrolled ? 'shadow-md' : 'shadow-sm'
        }`}
      >
        <nav className="container-safe h-16 flex items-center justify-between">
          <div className="topnav-header">
            <Link to="/test-selection-dashboard" className="topnav-logo">
              <Icon name="GraduationCap" size={24} color="var(--color-primary)" />
            </Link>
            <Link
              to="/test-selection-dashboard"
              className="text-xl font-heading font-semibold text-foreground hover:text-primary transition-colors duration-base hidden sm:block"
            >
              IELTS Speaking Practice
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-1">
            {navItems?.map((item) => (
              <Link
                key={item?.path}
                to={item?.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-base ${
                  isActive(item?.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted hover:text-primary'
                }`}
              >
                <Icon name={item?.icon} size={18} />
                <span>{item?.label}</span>
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" iconName="Settings" iconPosition="left" size="sm">
              Settings
            </Button>
            <Button variant="outline" iconName="LogOut" iconPosition="left" size="sm">
              Logout
            </Button>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors duration-base focus-ring"
            aria-label="Toggle mobile menu"
          >
            <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={24} />
          </button>
        </nav>
      </header>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[90] bg-background lg:hidden"
          style={{ top: '64px' }}
        >
          <div className="container-safe py-6 flex flex-col gap-2">
            {navItems?.map((item) => (
              <Link
                key={item?.path}
                to={item?.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-all duration-base ${
                  isActive(item?.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <Icon name={item?.icon} size={20} />
                <span>{item?.label}</span>
              </Link>
            ))}

            <div className="mt-6 pt-6 border-t border-border flex flex-col gap-2">
              <Button variant="ghost" iconName="Settings" iconPosition="left" fullWidth>
                Settings
              </Button>
              <Button variant="outline" iconName="LogOut" iconPosition="left" fullWidth>
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
      <div style={{ height: '64px' }} />
    </>
  );
};

export default TopNav;