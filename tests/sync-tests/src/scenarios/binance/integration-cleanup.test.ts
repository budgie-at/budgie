import { AccountTypeEnum, BankIntegrationEntityTable, ExternalSourceEnum } from '@budgie/contracts';
import { AccountArchiveService } from '@budgie/ledger';
import { encodeBinanceAccountId, BinanceWalletEnum } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, seedCryptoInstrument, testDb, TestLayer } from '../../harness';

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
        yield* seed.sync({ accountId: account.id, provider: ExternalSourceEnum.BINANCE, token: BINANCE_TOKEN });

        return account;
    });

const fetchIntegrationTokens = (provider: ExternalSourceEnum) =>
    Effect.gen(function* () {
        const rows = yield* testDb.select().from(BankIntegrationEntityTable).where(eq(BankIntegrationEntityTable.provider, provider));

        return rows.map(row => row.token);
    });

describe('binance/integration-cleanup', () => {
    it.effect('removes the stored credentials when the last linked account is deleted', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const bitcoin = yield* seedBinanceAccount('BTC');
            const ether = yield* seedBinanceAccount('ETH');

            yield* accountArchiveService.deleteById(bitcoin.id);

            expect(yield* fetchIntegrationTokens(ExternalSourceEnum.BINANCE)).toEqual([BINANCE_TOKEN]);

            yield* accountArchiveService.deleteById(ether.id);

            expect(yield* fetchIntegrationTokens(ExternalSourceEnum.BINANCE)).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the credentials while an archived account still links to the integration', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const bitcoin = yield* seedBinanceAccount('BTC');
            const ether = yield* seedBinanceAccount('ETH');

            yield* accountArchiveService.archiveById(ether.id);
            yield* accountArchiveService.deleteById(bitcoin.id);

            expect(yield* fetchIntegrationTokens(ExternalSourceEnum.BINANCE)).toEqual([BINANCE_TOKEN]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('removes each provider integration only with its own last account', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const bitcoin = yield* seedBinanceAccount('BTC');
            const monobankAccount = yield* seed.account({
                externalId: 'cleanup-monobank',
                externalSource: ExternalSourceEnum.MONOBANK,
                type: AccountTypeEnum.BANK_SYNC
            });
            yield* seed.sync({ accountId: monobankAccount.id, provider: ExternalSourceEnum.MONOBANK, token: MONOBANK_TOKEN });

            yield* accountArchiveService.deleteById(bitcoin.id);

            expect(yield* fetchIntegrationTokens(ExternalSourceEnum.BINANCE)).toEqual([]);
            expect(yield* fetchIntegrationTokens(ExternalSourceEnum.MONOBANK)).toEqual([MONOBANK_TOKEN]);

            yield* accountArchiveService.deleteById(monobankAccount.id);

            expect(yield* fetchIntegrationTokens(ExternalSourceEnum.MONOBANK)).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});
