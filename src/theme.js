import { createContext, useContext } from 'react';

export const dark = { mode: 'dark', bg: '#0B0D10', card: '#171C22', elev: '#2A333D', border: '#2A333D', outline: '#5D6F82', text: '#E7EEF5', sub: '#9FB0C2', green: '#34D399', red: '#F87171', btn: '#047857', btnText: '#FFFFFF', hero: '#2A333D', heroText: '#FFFFFF', heroSub: '#C5D0DC' };
export const light = { mode: 'light', bg: '#F2F5F9', card: '#FFFFFF', elev: '#E7EEF5', border: '#E2E8F0', outline: '#94A3B8', text: '#0B1F3A', sub: '#5B6778', green: '#047857', red: '#B42318', btn: '#047857', btnText: '#FFFFFF', hero: '#0B1F3A', heroText: '#FFFFFF', heroSub: '#CBD5E1' };
export const ThemeCtx = createContext(dark);
export const useTheme = () => useContext(ThemeCtx);
export const ICON_COLORS = ['#93C5FD', '#6EE7B7', '#FCD34D', '#C4B5FD', '#FCA5A5', '#FDBA74'];
