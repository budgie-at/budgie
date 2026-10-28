import { AccountTypeEnum, BankIntegrationEntityTable, ExternalSourceEnum, SyncStatusEnum } from '@budgie/contracts';
import { AccountArchiveService } from '@budgie/ledger';
import { BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchAccountIntegrationToken, fetchSyncById, seed, seedCryptoInstrument, testDb, TestLayer } from '../../harness';

const BINANCE_TOKEN = JSON.stringify({ apiKey: 'cleanup-key', apiSecret: 'cleanup-secret' });
const MONOBANK_TOKEN = 'cleanup-monobank-token';

const seedBinanceAccount = (asset: string) =>
    Effect.gen(function* () {
        const instrument = yield* seedCryptoInstrument(asset);
        const account = yield* seed.account({
            externalId: encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset }),
            externalSource: ExternalSourceEnum.BINANCE,
            type: AccountTypeEnum.CRYPTO_SYNC,
            instrumentId: instrument.id
        });
        const sync = yield* seed.sync({ accountId: account.id, provider: ExternalSourceEnum.BINANCE, token: BINANCE_TOKEN });

        return { account, sync };
    });

const seedMonobankCard = (externalId: string) =>
    Effect.gen(function* () {
        const account = yield* seed.account({
            externalId,
            externalSource: ExternalSourceEnum.MONOBANK,
            type: AccountTypeEnum.BANK_SYNC,
            instrumentId: 1
        });
        const sync = yield* seed.sync({ accountId: account.id, provider: ExternalSourceEnum.MONOBANK, token: MONOBANK_TOKEN });

        return { account, sync };
    });

const fetchIntegrationTokens = (provider: ExternalSourceEnum) =>
    Effect.gen(function* () {
        const rows = yield* testDb.select().from(BankIntegrationEntityTable).where(eq(BankIntegrationEntityTable.provider, provider));

        return rows.map(row => row.token);
    });

const providerCases = [
    {
        provider: ExternalSourceEnum.BINANCE,
        token: BINANCE_TOKEN,
        seedPair: Effect.all([seedBinanceAccount('BTC'), seedBinanceAccount('ETH')])
    },
    {
        provider: ExternalSourceEnum.MONOBANK,
        token: MONOBANK_TOKEN,
        seedPair: Effect.all([seedMonobankCard('cleanup-card-first'), seedMonobankCard('cleanup-card-second')])
    }
];

describe('sync/integration-cleanup', () => {
    it.effect.each(providerCases)(
        'keeps the $provider integration for the remaining account and removes it with the last one',
        ({ provider, token, seedPair }) =>
            Effect.gen(function* () {
                const accountArchiveService = yield* AccountArchiveService;
                const [first, second] = yield* seedPair;

                yield* accountArchiveService.deleteById(first.account.id);

                expect(yield* fetchIntegrationTokens(provider)).toEqual([token]);
                expect(yield* fetchAccountIntegrationToken(second.account.id)).toBe(token);
                expect(yield* fetchSyncById(second.sync.id)).toMatchObject({ enabled: true, status: SyncStatusEnum.IDLE });

                yield* accountArchiveService.deleteById(second.account.id);

                expect(yield* fetchIntegrationTokens(provider)).toEqual([]);
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the credentials while an archived account still links to the integration', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const bitcoin = yield* seedBinanceAccount('BTC');
            const ether = yield* seedBinanceAccount('ETH');

            yield* accountArchiveService.archiveById(ether.account.id);
            yield* accountArchiveService.deleteById(bitcoin.account.id);

            expect(yield* fetchIntegrationTokens(ExternalSourceEnum.BINANCE)).toEqual([BINANCE_TOKEN]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves other providers integrations untouched', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const bitcoin = yield* seedBinanceAccount('BTC');
            yield* seedMonobankCard('cleanup-card-other');

            yield* accountArchiveService.deleteById(bitcoin.account.id);

            expect(yield* fetchIntegrationTokens(ExternalSourceEnum.BINANCE)).toEqual([]);
            expect(yield* fetchIntegrationTokens(ExternalSourceEnum.MONOBANK)).toEqual([MONOBANK_TOKEN]);
        }).pipe(Effect.provide(TestLayer))
    );
});
