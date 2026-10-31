import { MapPin, Camera, Trophy, ClipboardList, User } from 'lucide-react';

// Mobile BottomNav aur desktop top-bar dono yahin se bante hain
export const navItems = [
  { to: '/', labelKey: 'nav.map', icon: MapPin, end: true },
  { to: '/snap', labelKey: 'nav.snap', icon: Camera },
  { to: '/areas', labelKey: 'nav.areas', icon: Trophy },
  { to: '/activity', labelKey: 'nav.activity', icon: ClipboardList },
  { to: '/account', labelKey: 'nav.account', icon: User },
];
