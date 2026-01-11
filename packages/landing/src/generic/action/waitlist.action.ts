/* eslint-disable lingui/no-unlocalized-strings -- Server action with error codes, not user-facing text */
'use server';

import { kv } from '@vercel/kv';

interface WaitlistResult {
    success: boolean;
    messageKey: 'invalid_email' | 'already_registered' | 'success' | 'error';
    position?: number;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

const addNewWaitlistEntry = async (email: string): Promise<WaitlistResult> => {
    const count = await kv.zcard('waitlist:emails');
    const position = count + 1;
    const timestamp = Date.now();

    await kv.zadd('waitlist:emails', { score: position, member: email });
    await kv.hset(`waitlist:user:${email}`, { email, position, joinedAt: timestamp, source: 'landing' });
    await kv.incr('waitlist:total');

    return { success: true, messageKey: 'success', position };
};

export const joinWaitlist = async (email: string): Promise<WaitlistResult> => {
    const normalizedEmail = email.toLowerCase().trim();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return { success: false, messageKey: 'invalid_email' };
    }

    try {
        const existingPosition = await kv.zscore('waitlist:emails', normalizedEmail);

        if (existingPosition !== null) {
            return { success: true, messageKey: 'already_registered', position: Math.floor(existingPosition) };
        }

        return await addNewWaitlistEntry(normalizedEmail);
    } catch {
        return { success: false, messageKey: 'error' };
    }
};

export const getWaitlistCount = async (): Promise<number> => {
    try {
        const count = await kv.get<number>('waitlist:total');

        return count ?? 0;
    } catch {
        return 0;
    }
};
