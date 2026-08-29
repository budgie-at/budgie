import { AccountTypeEnum, ExternalSourceEnum, InstrumentTypeEnum, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

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
import { testQueryService, testSeedService } from '../harness/test-context';

describe('consolidation/p2p-fiat-transfer atomic constraints', () => {
    it('does not match a P2P buy against a different instrument than the quoted instrument', async () => {
        const euro = testSeedService.instrument(seedP2pFiatInstrument('EUR'));
        const euroBankAccount = testSeedService.bankSyncAccount('EUR bank', ExternalSourceEnum.MONOBANK, null, euro.id);
        const usdt = seedP2pUsdt();
        const binanceAccount = seedP2pAccount(AccountTypeEnum.CRYPTO_SYNC, usdt.id);

        seedP2pBankBuyExpense(euroBankAccount.id);
        seedP2pExchangeRate(euro.id, usdt.id, 1 / 41);
        seedP2pBuyIncome(binanceAccount.id, 1);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(0);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
    });

    it('does not match a quote-less P2P buy against a non-fiat bank instrument', async () => {
        const bitcoin = testSeedService.instrument({ code: 'BTC', name: 'Bitcoin', symbol: 'BTC', type: InstrumentTypeEnum.CRYPTO });
        const bitcoinBankAccount = testSeedService.bankSyncAccount('BTC bank', ExternalSourceEnum.MONOBANK, null, bitcoin.id);
        const usdt = seedP2pUsdt();
        const binanceAccount = seedP2pAccount(AccountTypeEnum.CRYPTO_SYNC, usdt.id);

        seedP2pBankBuyExpense(bitcoinBankAccount.id);
        seedP2pExchangeRate(bitcoin.id, usdt.id, 1 / 41);
        seedP2pBuyIncome(binanceAccount.id, null);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(0);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
    });

    it('matches a quote-less P2P buy against a fiat bank instrument', async () => {
        const bankAccount = testSeedService.bankSyncAccount('Fiat bank', ExternalSourceEnum.MONOBANK, null);
        const usdt = seedP2pUsdt();
        const binanceAccount = seedP2pAccount(AccountTypeEnum.CRYPTO_SYNC, usdt.id);

        seedP2pBankBuyExpense(bankAccount.id);
        seedP2pExchangeRate(bankAccount.instrumentId, usdt.id, 1 / 41);
        seedP2pBuyIncome(binanceAccount.id, null);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(1);
    });

    it('groups bank expenses that use the P2P quoted instrument', async () => {
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

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(1);
    });
});
