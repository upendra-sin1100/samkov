'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
export default function ThemeToggle() {
    const [dark, setDark] = useState(false);
    useEffect(() => { setDark(document.documentElement.dataset.theme === 'dark'); }, []);
    function toggle() { const next = !dark; setDark(next); document.documentElement.dataset.theme = next ? 'dark' : 'light'; try {
        localStorage.setItem('samkov-theme', next ? 'dark' : 'light');
    }
    catch { } }
    return <button className="theme-toggle" onClick={toggle} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} title={dark ? 'Light theme' : 'Dark theme'}>{dark ? <Sun size={19}/> : <Moon size={19}/>}</button>;
}
