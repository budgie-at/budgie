/* eslint-disable lingui/no-unlocalized-strings -- Server action with error codes, not user-facing text */
'use server';

import { getLogger } from '@budgie/logger';
import { createClient } from 'redis';
import { z } from 'zod';

import { emptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { WaitlistMessageKeyEnum } from '../enum/waitlist-message-key.enum';

const logger = getLogger('waitlistAction');
const WAITLIST_EMAILS_KEY = 'waitlist:emails';
const WAITLIST_TOTAL_KEY = 'waitlist:total';
const WAITLIST_SOURCE = 'landing';
const MAX_EMAIL_LENGTH = 254;
const REDIS_CONNECTION_DEADLINE_MS = 4500;
const REDIS_COMMAND_DEADLINE_MS = 2000;
const WaitlistEmailSchema = z.string().trim().toLowerCase().max(MAX_EMAIL_LENGTH).email();
const WaitlistRedisResultSchema = z.tuple([
    z.enum([WaitlistMessageKeyEnum.SUCCESS, WaitlistMessageKeyEnum.ALREADY_REGISTERED]),
    z.number().int().positive()
]);
const WAITLIST_SCRIPT = `
local emailsType = redis.call('TYPE', KEYS[1]).ok
if emailsType ~= 'none' and emailsType ~= 'zset' then
    return redis.error_reply('WAITLIST_EMAILS_TYPE')
end
local userType = redis.call('TYPE', KEYS[3]).ok
if userType ~= 'none' and userType ~= 'hash' then
    return redis.error_reply('WAITLIST_USER_TYPE')
end
local totalType = redis.call('TYPE', KEYS[2]).ok
if totalType ~= 'none' and totalType ~= 'string' then
    return redis.error_reply('WAITLIST_TOTAL_TYPE')
end
if totalType == 'string' then
    local total = redis.call('GET', KEYS[2])
    local maximumIncrementableTotal = '9223372036854775806'
    if total ~= '0' and not string.match(total, '^[1-9][0-9]*$') then
        return redis.error_reply('WAITLIST_TOTAL_VALUE')
    end
    if string.len(total) > string.len(maximumIncrementableTotal) or
        (string.len(total) == string.len(maximumIncrementableTotal) and total > maximumIncrementableTotal) then
        return redis.error_reply('WAITLIST_TOTAL_OVERFLOW')
    end
end
local existingPosition = redis.call('ZSCORE', KEYS[1], ARGV[1])
if existingPosition then
    return {'${WaitlistMessageKeyEnum.ALREADY_REGISTERED}', tonumber(existingPosition)}
end
local position = redis.call('ZCARD', KEYS[1]) + 1
redis.call('ZADD', KEYS[1], position, ARGV[1])
redis.call('HSET', KEYS[3], 'email', ARGV[1], 'position', position, 'joinedAt', ARGV[2], 'source', ARGV[3])
redis.call('INCR', KEYS[2])
return {'${WaitlistMessageKeyEnum.SUCCESS}', position}
`;

let redisClient: ReturnType<typeof createClient> | null = null;
let redisInitializationClient: ReturnType<typeof createClient> | null = null;
let redisClientPromise: Promise<ReturnType<typeof createClient> | null> | null = null;

const destroyRedisClient = (client: ReturnType<typeof createClient>) => {
    if (client.isOpen) {
        client.destroy();
    }

    if (redisClient === client) {
        redisClient = null;
        redisClientPromise = null;
    }

    if (redisInitializationClient === client) {
        redisInitializationClient = null;
        redisClientPromise = null;
    }
};

const executeWithDeadline = async <Result>(operation: Promise<Result>, deadlineMs: number, onDeadline: () => void): Promise<Result> => {
    const deadlineController = new AbortController();
    const deadlinePromise = new Promise<never>((_resolve, reject) => {
        const deadlineTimer = setTimeout(() => {
            onDeadline();
            reject(new Error('redis_operation_deadline'));
        }, deadlineMs);

        deadlineController.signal.addEventListener('abort', () => void clearTimeout(deadlineTimer), { once: true });
    });

    void operation.catch(emptyFn);

    try {
        return await Promise.race([operation, deadlinePromise]);
    } finally {
        deadlineController.abort();
    }
};

const initializeRedisClient = async () => {
    const redisUrl = process.env.REDIS_URL;

    if (!isNotEmptyString(redisUrl)) {
        logger.error('configuration_missing');

        return null;
    }

    try {
        const client = createClient({
            url: redisUrl,
            socket: {
                connectTimeout: 2000,
                reconnectStrategy: retries => (retries === 0 ? 250 : false)
            },
            disableOfflineQueue: true,
            commandOptions: { timeout: 2000 }
        });

        redisInitializationClient = client;
        client.on('error', () => void logger.error('client_error'));

        return await executeWithDeadline(client.connect(), REDIS_CONNECTION_DEADLINE_MS, () => void destroyRedisClient(client)).then(
            () => {
                if (!client.isReady) {
                    destroyRedisClient(client);
                    logger.error('client_not_ready');

                    return null;
                }

                if (redisInitializationClient === client) {
                    redisInitializationClient = null;
                }

                redisClient = client;

                return client;
            },
            () => {
                destroyRedisClient(client);
                logger.error('connection_failed');

                return null;
            }
        );
    } catch {
        logger.error('connection_failed');

        return null;
    }
};

const getRedisClient = async () => {
    if (isDefined(redisClient)) {
        if (redisClient.isReady) {
            return redisClient;
        }

        destroyRedisClient(redisClient);
    }

    if (!isDefined(redisClientPromise)) {
        const initializationPromise = initializeRedisClient();
        redisClientPromise = initializationPromise;
        void initializationPromise.then(
            initializedClient => {
                if (!isDefined(initializedClient) && redisClientPromise === initializationPromise) {
                    redisClientPromise = null;
                }

                return initializedClient;
            },
            () => {
                if (redisClientPromise === initializationPromise) {
                    redisClientPromise = null;
                }

                return null;
            }
        );
    }

    return await redisClientPromise;
};

export const joinWaitlist = async (input: unknown) => {
    const parsedEmail = WaitlistEmailSchema.safeParse(input);

    if (!parsedEmail.success) {
        return { success: false, messageKey: WaitlistMessageKeyEnum.INVALID_EMAIL } as const;
    }

    const client = await getRedisClient();

    if (!isDefined(client)) {
        return { success: false, messageKey: WaitlistMessageKeyEnum.ERROR } as const;
    }

    return await executeWithDeadline(
        client.eval(WAITLIST_SCRIPT, {
            keys: [WAITLIST_EMAILS_KEY, WAITLIST_TOTAL_KEY, `waitlist:user:${parsedEmail.data}`],
            arguments: [parsedEmail.data, String(Date.now()), WAITLIST_SOURCE]
        }),
        REDIS_COMMAND_DEADLINE_MS,
        () => void destroyRedisClient(client)
    ).then(
        result => {
            const parsedResult = WaitlistRedisResultSchema.safeParse(result);

            if (!parsedResult.success) {
                logger.error('invalid_response');

                return { success: false, messageKey: WaitlistMessageKeyEnum.ERROR } as const;
            }

            return { success: true, messageKey: parsedResult.data[0], position: parsedResult.data[1] } as const;
        },
        () => {
            destroyRedisClient(client);
            logger.error('signup_failed');

            return { success: false, messageKey: WaitlistMessageKeyEnum.ERROR } as const;
        }
    );
};

export const getWaitlistCount = async (): Promise<number> => {
    const client = await getRedisClient();

    if (!isDefined(client)) {
        return 0;
    }

    return await executeWithDeadline(client.get(WAITLIST_TOTAL_KEY), REDIS_COMMAND_DEADLINE_MS, () => void destroyRedisClient(client)).then(
        count => {
            const parsedCount = z.coerce.number().int().nonnegative().safeParse(count);

            return parsedCount.success ? parsedCount.data : 0;
        },
        () => {
            destroyRedisClient(client);
            logger.error('count_failed');

            return 0;
        }
    );
};
