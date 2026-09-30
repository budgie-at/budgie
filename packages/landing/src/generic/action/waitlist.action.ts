/* oxlint-disable lingui/no-unlocalized-strings -- Server action with error codes, not user-facing text */
'use server';

import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as SchemaTransformation from 'effect/SchemaTransformation';
import * as Semaphore from 'effect/Semaphore';
import { createClient } from 'redis';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { WaitlistMessageKeyEnum } from '../enum/waitlist-message-key.enum';

const WAITLIST_EMAILS_KEY = 'waitlist:emails';
const WAITLIST_TOTAL_KEY = 'waitlist:total';
const WAITLIST_SOURCE = 'landing';
const MAX_EMAIL_LENGTH = 254;
const REDIS_CONNECTION_DEADLINE_MS = 4500;
const REDIS_COMMAND_DEADLINE_MS = 2000;
const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/u;
const WaitlistEmailSchema = Schema.String.pipe(
    Schema.decode(SchemaTransformation.trim()),
    Schema.decode(SchemaTransformation.toLowerCase()),
    Schema.check(Schema.isMaxLength(MAX_EMAIL_LENGTH), Schema.isPattern(EMAIL_REGEX))
);
const WaitlistRedisResultSchema = Schema.Tuple([
    Schema.Literals([WaitlistMessageKeyEnum.SUCCESS, WaitlistMessageKeyEnum.ALREADY_REGISTERED]),
    Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0))
]);
const WaitlistCountSchema = Schema.NumberFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0));
const WAITLIST_SCRIPT = `
local emailsType = redis.call('TYPE', KEYS[1]).ok
if emailsType ~= 'none' and emailsType ~= 'zset' then
    return redis.error_reply('WAITLIST_EMAILS_TYPE')
end
local existingPosition = redis.call('ZSCORE', KEYS[1], ARGV[1])
if existingPosition then
    return {'${WaitlistMessageKeyEnum.ALREADY_REGISTERED}', tonumber(existingPosition)}
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
local position = redis.call('ZCARD', KEYS[1]) + 1
redis.call('ZADD', KEYS[1], position, ARGV[1])
redis.call('HSET', KEYS[3], 'email', ARGV[1], 'position', position, 'joinedAt', ARGV[2], 'source', ARGV[3])
redis.call('INCR', KEYS[2])
return {'${WaitlistMessageKeyEnum.SUCCESS}', position}
`;

type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;
const redisConnectionLock = Semaphore.makeUnsafe(1);

const destroyRedisClient = (client: RedisClient) => {
    if (client.isOpen) {
        client.destroy();
    }

    if (redisClient === client) {
        redisClient = null;
    }
};

const runRedisCommand = <Result>(client: RedisClient, command: () => Promise<Result>, deadlineMs: number) =>
    Effect.tryPromise(command).pipe(
        Effect.timeout(deadlineMs),
        Effect.tapError(() => Effect.sync(() => void destroyRedisClient(client)))
    );

const connectRedisClient = Effect.fn('connectRedisClient')(function* (redisUrl: string) {
    const client = createClient({
        url: redisUrl,
        socket: {
            connectTimeout: 2000,
            reconnectStrategy: retries => (retries === 0 ? 250 : false)
        },
        disableOfflineQueue: true,
        commandOptions: { timeout: 2000 }
    });

    client.on('error', () => void Effect.runFork(Effect.logError('client_error')));

    yield* runRedisCommand(client, async () => await client.connect(), REDIS_CONNECTION_DEADLINE_MS);

    if (!client.isReady) {
        destroyRedisClient(client);

        return yield* Effect.fail('client_not_ready');
    }

    redisClient = client;

    return client;
});

const getRedisClient = Effect.fn('getRedisClient')(function* () {
    if (isDefined(redisClient)) {
        if (redisClient.isReady) {
            return redisClient;
        }

        destroyRedisClient(redisClient);
    }

    const redisUrl = process.env.REDIS_URL;

    if (!isNotEmptyString(redisUrl)) {
        yield* Effect.logError('configuration_missing');

        return null;
    }

    return yield* connectRedisClient(redisUrl).pipe(
        Effect.tapError(() => Effect.logError('connection_failed')),
        Effect.orElseSucceed(() => null)
    );
}, redisConnectionLock.withPermits(1));

const joinWaitlistProgram = Effect.fn('joinWaitlist')(function* (input: unknown) {
    const parsedEmail = Schema.decodeUnknownOption(WaitlistEmailSchema)(input);

    if (Option.isNone(parsedEmail)) {
        return { success: false, messageKey: WaitlistMessageKeyEnum.INVALID_EMAIL } as const;
    }

    const client = yield* getRedisClient();

    if (!isDefined(client)) {
        return { success: false, messageKey: WaitlistMessageKeyEnum.ERROR } as const;
    }

    return yield* runRedisCommand(
        client,
        async () =>
            await client.eval(WAITLIST_SCRIPT, {
                keys: [WAITLIST_EMAILS_KEY, WAITLIST_TOTAL_KEY, `waitlist:user:${parsedEmail.value}`],
                arguments: [parsedEmail.value, String(Date.now()), WAITLIST_SOURCE]
            }),
        REDIS_COMMAND_DEADLINE_MS
    ).pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(WaitlistRedisResultSchema)),
        Effect.map(([messageKey, position]) => ({ success: true, messageKey, position }) as const),
        Effect.tapError(() => Effect.logError('signup_failed')),
        Effect.orElseSucceed(() => ({ success: false, messageKey: WaitlistMessageKeyEnum.ERROR }) as const)
    );
});

const getWaitlistCountProgram = Effect.fn('getWaitlistCount')(function* () {
    const client = yield* getRedisClient();

    if (!isDefined(client)) {
        return 0;
    }

    return yield* runRedisCommand(client, async () => await client.get(WAITLIST_TOTAL_KEY), REDIS_COMMAND_DEADLINE_MS).pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(WaitlistCountSchema)),
        Effect.tapError(() => Effect.logError('count_failed')),
        Effect.orElseSucceed(() => 0)
    );
});

export const joinWaitlist = async (input: unknown) => await Effect.runPromise(joinWaitlistProgram(input));

export const getWaitlistCount = async (): Promise<number> => await Effect.runPromise(getWaitlistCountProgram());
