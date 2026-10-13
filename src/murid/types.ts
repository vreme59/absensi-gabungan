import { UserProfile } from '../types';

export type MuridTabKey = 'beranda' | 'jadwal' | 'absensi' | 'profil';

export interface MuridAppProps {
  user?: UserProfile;
  initialTab?: MuridTabKey;
  onLogout?: () => void;
  onShowToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  onNavigateTab?: (tab: MuridTabKey) => void;
  containerClassName?: string;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export interface MuridHeaderProps {
  user: UserProfile;
  title?: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onNotificationClick?: () => void;
}

export interface MuridBottomNavProps {
  currentTab: MuridTabKey;
  onTabChange: (tab: MuridTabKey) => void;
  unreadCount?: number;
}

export interface MuridSidebarProps {
  user: UserProfile;
  currentTab: MuridTabKey;
  onTabChange: (tab: MuridTabKey) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout?: () => void;
}

export interface MuridHomeScreenProps {
  user: UserProfile;
  isDarkMode?: boolean;
  onNavigateTab: (tab: MuridTabKey) => void;
  onShowToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export interface MuridJadwalScreenProps {
  user: UserProfile;
  isDarkMode?: boolean;
  onNavigateTab?: (tab: MuridTabKey) => void;
  onShowToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export interface MuridAbsensiScreenProps {
  user: UserProfile;
  isDarkMode?: boolean;
  onNavigateTab?: (tab: MuridTabKey) => void;
  onShowToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export interface MuridProfileScreenProps {
  user: UserProfile;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: MuridTabKey) => void;
  onShowToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}
