/* eslint-disable lingui/no-unlocalized-strings -- Server action with error codes, not user-facing text */
'use server';

import { createClient } from 'redis';

import { emptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

interface WaitlistResult {
    success: boolean;
    messageKey: 'invalid_email' | 'already_registered' | 'success' | 'error';
    position?: number;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const WAITLIST_EMAILS_KEY = 'waitlist:emails';
const WAITLIST_TOTAL_KEY = 'waitlist:total';
const WAITLIST_SOURCE = 'landing';
const memoryWaitlistEmails = new Map<string, number>();

const initializeRedisClient = async () => {
    const redisUrl = process.env.REDIS_URL;

    if (!isNotEmptyString(redisUrl)) {
        return null;
    }

    try {
        const client = createClient({ url: redisUrl });
        client.on('error', emptyFn);

        return await client.connect();
    } catch {
        return null;
    }
};

let redisClientPromise: ReturnType<typeof initializeRedisClient> | null = null;

const getRedisClient = async () => {
    if (!isDefined(redisClientPromise)) {
        redisClientPromise = initializeRedisClient();
    }

    return await redisClientPromise;
};

const addNewWaitlistEntry = async (email: string): Promise<WaitlistResult> => {
    const redisClient = await getRedisClient();

    if (!isDefined(redisClient)) {
        const position = memoryWaitlistEmails.size + 1;

        memoryWaitlistEmails.set(email, position);

        return { success: true, messageKey: 'success', position };
    }

    const count = await redisClient.zCard(WAITLIST_EMAILS_KEY);
    const position = count + 1;
    const timestamp = Date.now();

    await redisClient.zAdd(WAITLIST_EMAILS_KEY, { score: position, value: email });
    await redisClient.hSet(`waitlist:user:${email}`, { email, position, joinedAt: timestamp, source: WAITLIST_SOURCE });
    await redisClient.incr(WAITLIST_TOTAL_KEY);

    return { success: true, messageKey: 'success', position };
};

export const joinWaitlist = async (email: string): Promise<WaitlistResult> => {
    const normalizedEmail = email.toLowerCase().trim();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return { success: false, messageKey: 'invalid_email' };
    }

    try {
        const redisClient = await getRedisClient();
        const existingPosition = isDefined(redisClient)
            ? await redisClient.zScore(WAITLIST_EMAILS_KEY, normalizedEmail)
            : (memoryWaitlistEmails.get(normalizedEmail) ?? null);

        if (isDefined(existingPosition)) {
            return { success: true, messageKey: 'already_registered', position: Math.floor(existingPosition) };
        }

        return await addNewWaitlistEntry(normalizedEmail);
    } catch {
        return { success: false, messageKey: 'error' };
    }
};

export const getWaitlistCount = async (): Promise<number> => {
    try {
        const redisClient = await getRedisClient();

        if (!isDefined(redisClient)) {
            return memoryWaitlistEmails.size;
        }

        const count = await redisClient.get(WAITLIST_TOTAL_KEY);

        return isNotEmptyString(count) ? Number.parseInt(count, 10) : 0;
    } catch {
        return 0;
    }
};
