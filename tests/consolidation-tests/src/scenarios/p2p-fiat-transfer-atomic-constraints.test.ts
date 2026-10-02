import { AccountTypeEnum, ExternalSourceEnum, InstrumentTypeEnum, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    P2P_OPERATED_AT,
    P2P_SPLIT_BANK_EXTRA_AMOUNT,
    P2P_SPLIT_BANK_PRIMARY_AMOUNT,
    seedP2pAccount,
    seedP2pBankBuyExpense,
    seedP2pBuyIncome,
    seedP2pExchangeRate,
    seedP2pFiatInstrument,
    seedP2pUsdt
} from '../harness/p2p-fiat-transfer-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

layer(TestLayer)('consolidation/p2p-fiat-transfer atomic constraints', it => {
    it.effect('does not match a P2P buy against a different instrument than the quoted instrument', () =>
        Effect.gen(function* () {
            const euro = testSeedService.instrument(seedP2pFiatInstrument('EUR'));
            const euroBankAccount = testSeedService.bankSyncAccount('EUR bank', ExternalSourceEnum.MONOBANK, null, euro.id);
            const usdt = seedP2pUsdt();
            const binanceAccount = seedP2pAccount(AccountTypeEnum.CRYPTO_SYNC, usdt.id);

            seedP2pBankBuyExpense(euroBankAccount.id);
            seedP2pExchangeRate(euro.id, usdt.id, 1 / 41);
            seedP2pBuyIncome(binanceAccount.id, 1);

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(0);
            expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
        })
    );

    it.effect('does not match a quote-less P2P buy against a non-fiat bank instrument', () =>
        Effect.gen(function* () {
            const bitcoin = testSeedService.instrument({ code: 'BTC', name: 'Bitcoin', symbol: 'BTC', type: InstrumentTypeEnum.CRYPTO });
            const bitcoinBankAccount = testSeedService.bankSyncAccount('BTC bank', ExternalSourceEnum.MONOBANK, null, bitcoin.id);
            const usdt = seedP2pUsdt();
            const binanceAccount = seedP2pAccount(AccountTypeEnum.CRYPTO_SYNC, usdt.id);

            seedP2pBankBuyExpense(bitcoinBankAccount.id);
            seedP2pExchangeRate(bitcoin.id, usdt.id, 1 / 41);
            seedP2pBuyIncome(binanceAccount.id, null);

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(0);
            expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
        })
    );

    it.effect('matches a quote-less P2P buy against a fiat bank instrument', () =>
        Effect.gen(function* () {
            const bankAccount = testSeedService.bankSyncAccount('Fiat bank', ExternalSourceEnum.MONOBANK, null);
            const usdt = seedP2pUsdt();
            const binanceAccount = seedP2pAccount(AccountTypeEnum.CRYPTO_SYNC, usdt.id);

            seedP2pBankBuyExpense(bankAccount.id);
            seedP2pExchangeRate(bankAccount.instrumentId, usdt.id, 1 / 41);
            seedP2pBuyIncome(binanceAccount.id, null);

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(1);
            expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(1);
        })
    );

    it.effect('groups bank expenses that use the P2P quoted instrument', () =>
        Effect.gen(function* () {
            const bankAccount = testSeedService.bankSyncAccount('Split fiat bank', ExternalSourceEnum.MONOBANK, null);
            const usdt = seedP2pUsdt();
            const binanceAccount = seedP2pAccount(AccountTypeEnum.CRYPTO_SYNC, usdt.id);

            testSeedService.bankPairExpense(
                { externalId: 'split-fiat-bank-expense-primary', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: P2P_SPLIT_BANK_PRIMARY_AMOUNT }
            );
            testSeedService.bankPairExpense(
                { externalId: 'split-fiat-bank-expense-extra', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: P2P_SPLIT_BANK_EXTRA_AMOUNT }
            );
            seedP2pExchangeRate(bankAccount.instrumentId, usdt.id, 1 / 41);
            seedP2pBuyIncome(binanceAccount.id, bankAccount.instrumentId);

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(1);
            expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(1);
        })
    );
});
