'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

export default function SyncEmail() {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();

    useEffect(() => {
        if (!isLoaded || !user)
            return;
        const email = user.primaryEmailAddress?.emailAddress;
        if (!email)
            return;
        let cancelled = false;
        (async () => {
            try {
                const token = await getToken();
                if (cancelled || !token)
                    return;
                const response = await fetch('/api/profile/email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        clerk_user_id: user.id,
                        email,
                        name: user.fullName,
                    }),
                });
                if (!response.ok)
                    console.error('Email sync failed:', await response.text());
            }
            catch (error) {
                if (!cancelled)
                    console.error('Email sync failed:', error);
            }
        })();
        return () => { cancelled = true; };
    }, [getToken, isLoaded, user]);

    return null;
}
