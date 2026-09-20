'use client';
import { useEffect, useRef } from 'react';
export default function ActivityTracker({ path, account }) {
    const latest = useRef(account);
    latest.current = account;
    const lastPath = useRef('');
    useEffect(() => {
        if (path !== location.pathname || lastPath.current === path || path === '/admin/preview')
            return;
        lastPath.current = path;
        fetch('/api/visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_id: crypto.randomUUID() }), keepalive: true }).catch(() => { });
    }, [path]);
    useEffect(() => {
        if (!account.configured || !account.user)
            return;
        let stopped = false;
        const ping = async () => {
            if (document.visibilityState !== 'visible')
                return;
            try {
                const token = await latest.current.getToken();
                if (stopped || !token)
                    return;
                await fetch('/api/platform', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: 'heartbeat' }) });
            }
            catch { }
        };
        ping();
        const timer = setInterval(ping, 60000);
        document.addEventListener('visibilitychange', ping);
        return () => { stopped = true; clearInterval(timer); document.removeEventListener('visibilitychange', ping); };
    }, [account.configured, account.user?.id]);
    return null;
}
