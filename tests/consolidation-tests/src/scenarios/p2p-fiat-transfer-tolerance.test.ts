import { TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA, TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS } from '@budgie/consolidation';
import { ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { P2P_BANK_AMOUNT, P2P_BUY_INCOME_OPERATED_AT, P2P_OPERATED_AT, seedP2pBuy } from '../harness/p2p-fiat-transfer-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService } from '../harness/test-context';

const MILLISECONDS_PER_SECOND = 1000;
const WINDOW_MARGIN_SECONDS = 1;

const seedBankExpense = (accountTitle: string, externalId: string, amount: number, operatedAt = P2P_OPERATED_AT) => {
    const bankAccount = testSeedService.bankSyncAccount(accountTitle, ExternalSourceEnum.MONOBANK, null);

    testSeedService.bankPairExpense({ externalId, operatedAt }, { accountId: bankAccount.id, amount });
    seedP2pBuy(bankAccount);
};

describe('consolidation/p2p-fiat-transfer authoritative delta tolerance', () => {
    it('matches a quoted P2P buy when the bank amount delta is within the configured absolute floor', async () => {
        seedBankExpense(
            'Monobank P2P delta accept',
            'mono-p2p-delta-accept',
            P2P_BANK_AMOUNT + TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA - PRECISION
        );

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(1);
    });

    it('rejects a quoted P2P buy once the bank amount delta exceeds the configured absolute floor', async () => {
        seedBankExpense(
            'Monobank P2P delta reject',
            'mono-p2p-delta-reject',
            P2P_BANK_AMOUNT + TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA + PRECISION
        );

        const result = await runConsolidation();

        expect(result.consolidated).toBe(0);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
    });
});

describe('consolidation/p2p-fiat-transfer time window', () => {
    it('matches a P2P buy just inside the configured time window', async () => {
        const operatedAt = new Date(
            P2P_BUY_INCOME_OPERATED_AT.getTime() -
                (TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS - WINDOW_MARGIN_SECONDS) * MILLISECONDS_PER_SECOND
        );

        seedBankExpense('Monobank P2P window accept', 'mono-p2p-window-accept', P2P_BANK_AMOUNT, operatedAt);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
    });

    it('rejects a P2P buy just outside the configured time window, even at an exact rate match', async () => {
        const operatedAt = new Date(
            P2P_BUY_INCOME_OPERATED_AT.getTime() -
                (TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS + WINDOW_MARGIN_SECONDS) * MILLISECONDS_PER_SECOND
        );

        seedBankExpense('Monobank P2P window reject', 'mono-p2p-window-reject', P2P_BANK_AMOUNT, operatedAt);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(0);
    });
});
