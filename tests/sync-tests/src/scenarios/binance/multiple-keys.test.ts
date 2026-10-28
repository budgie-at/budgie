import { AccountEntityTable, ExternalSourceEnum, PRECISION, SyncModeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    buildBinanceToken,
    fetchAccountIntegrationToken,
    fetchCachedBalanceAmount,
    fetchSyncById,
    seedCryptoInstrument,
    seedSecondKeyAccount,
    setupBinanceFixture,
    skipRequestedSync,
    TestLayer,
    testDb
} from '../../harness';

const KEY_A = 'test-api-key';
const KEY_B = 'key-b';
const KEY_ROTATED = 'key-a-rotated';
const KEY_OTHER_ACCOUNT = 'key-other-account';
const KEY_B_TOKEN = buildBinanceToken(KEY_B);
const ROTATED_TOKEN = buildBinanceToken(KEY_ROTATED);
const OTHER_ACCOUNT_TOKEN = buildBinanceToken(KEY_OTHER_ACCOUNT);
const KEY_A_UID = 1001;
const KEY_B_UID = 1002;
const OTHER_ACCOUNT_UID = 1003;
const SELECTED_FORWARD_SYNCED_AT = new Date('2026-03-01T10:00:00.000Z');
const STORED_TRADE_CURSOR = JSON.stringify({ ADAUSDT: 5 });

const fetchBinanceAccounts = () =>
    testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalSource, ExternalSourceEnum.BINANCE));

const connectKey = (token: string, externalIds: string[]) =>
    Effect.gen(function* () {
        const binanceSyncService = yield* BinanceSyncService;

        yield* skipRequestedSync(binanceSyncService.setupAccountSyncBatch(token, externalIds));
    });

describe('binance/multiple-keys', () => {
    it.effect('keeps the balances of two keys holding disjoint assets', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const { account: accountA } = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
            const accountB = yield* seedSecondKeyAccount('ETH', (yield* seedCryptoInstrument('ETH')).id, KEY_B_TOKEN);
            binanceStub.accountsByApiKey([
                { apiKey: KEY_A, uid: KEY_A_UID, spotBalances: [buildBinance.balance({ asset: 'BTC', free: '1' })] },
                { apiKey: KEY_B, uid: KEY_B_UID, spotBalances: [buildBinance.balance({ asset: 'ETH', free: '2' })] }
            ]);

            yield* binanceSyncService.sync();

            expect(yield* fetchCachedBalanceAmount(accountA.id)).toBe(PRECISION);
            expect(yield* fetchCachedBalanceAmount(accountB.id)).toBe(2 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps separate accounts and balances for two keys holding the same asset', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const { account: accountA } = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
            binanceStub.accountsByApiKey([
                { apiKey: KEY_A, uid: KEY_A_UID, spotBalances: [buildBinance.balance({ asset: 'BTC', free: '1' })] },
                { apiKey: KEY_B, uid: KEY_B_UID, spotBalances: [buildBinance.balance({ asset: 'BTC', free: '3' })] }
            ]);

            yield* connectKey(KEY_B_TOKEN, ['SPOT:BTC']);
            yield* binanceSyncService.sync();

            const accounts = yield* fetchBinanceAccounts();
            const accountB = accounts.find(account => account.id !== accountA.id);
            expect(accounts).toHaveLength(2);
            expect(accountB?.integrationId).not.toBe(accountA.integrationId);
            expect(yield* fetchCachedBalanceAmount(accountA.id)).toBe(PRECISION);
            expect(yield* fetchCachedBalanceAmount(accountB?.id ?? 0)).toBe(3 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects rotating a key to one that belongs to a different Binance account', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const { account, token } = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
            binanceStub.apiRestrictions();
            binanceStub.accountsByApiKey([
                { apiKey: KEY_A, uid: KEY_A_UID, spotBalances: [] },
                { apiKey: KEY_OTHER_ACCOUNT, uid: OTHER_ACCOUNT_UID, spotBalances: [] }
            ]);
            yield* connectKey(token, ['SPOT:BTC']);

            const error = yield* Effect.flip(binanceSyncService.updateAccountToken(account.id, OTHER_ACCOUNT_TOKEN));

            expect(error).toMatchObject({ _tag: 'SyncTokenClientMismatchError' });
            expect(yield* fetchAccountIntegrationToken(account.id)).toBe(token);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps sync progress when rotating a key to one from the same Binance account', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const { account, sync, token } = yield* setupBinanceFixture({
                asset: 'BTC',
                mode: SyncModeEnum.FORWARD,
                forwardSyncedAt: SELECTED_FORWARD_SYNCED_AT,
                binanceTradeCursor: STORED_TRADE_CURSOR
            });
            binanceStub.apiRestrictions();
            binanceStub.accountsByApiKey([
                { apiKey: KEY_A, uid: KEY_A_UID, spotBalances: [] },
                { apiKey: KEY_ROTATED, uid: KEY_A_UID, spotBalances: [] }
            ]);
            yield* connectKey(token, ['SPOT:BTC']);

            yield* binanceSyncService.updateAccountToken(account.id, ROTATED_TOKEN);

            expect(yield* fetchAccountIntegrationToken(account.id)).toBe(ROTATED_TOKEN);
            expect(yield* fetchSyncById(sync.id)).toMatchObject({
                forwardSyncedAt: SELECTED_FORWARD_SYNCED_AT,
                binanceTradeCursor: STORED_TRADE_CURSOR
            });
        }).pipe(Effect.provide(TestLayer))
    );
});
