import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    P2P_UAH_TOTAL,
    P2P_USDT_AMOUNT,
    expectConsolidatedToP2pCanonical,
    fetchP2pCanonical,
    fetchCanonicalsOfType,
    seedP2pFiatTransferFixture,
    seedP2pPair
} from '../../harness';

describe('consolidation/binance-p2p-fiat-transfer basic directions', () => {
    it('auto-consolidates a bank UAH expense with a Binance USDT P2P top-up income via a triangulated rate', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const { expense, income } = seedP2pPair(
            { externalId: 'mono-uah-p2p-out', accountId: bankAccount.id, amount: P2P_UAH_TOTAL },
            { externalId: 'binance:c2c:buy-1', accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT }
        );

        const result = await transferConsolidationService.consolidate();

        expect(result).toEqual({ found: 1, consolidated: 1 });
        expectConsolidatedToP2pCanonical(expense, income, bankAccount.id, binanceAccount.id);
        expect(fetchP2pCanonical().title).toBe('Binance P2P buy USDT');
    });

    it('auto-consolidates a Binance USDT P2P sell expense with a bank UAH cash-out income', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const { expense, income } = seedP2pPair(
            { externalId: 'binance:c2c:sell-1', accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT },
            { externalId: 'mono-uah-p2p-in', accountId: bankAccount.id, amount: P2P_UAH_TOTAL }
        );

        const result = await transferConsolidationService.consolidate();

        expect(result).toEqual({ found: 1, consolidated: 1 });
        expectConsolidatedToP2pCanonical(expense, income, binanceAccount.id, bankAccount.id);
        expect(fetchP2pCanonical().title).toBe('Binance P2P sell USDT');
    });
});

describe('consolidation/binance-p2p-fiat-transfer exchange support', () => {
    it('consolidates a P2P top-up from any synced crypto exchange, not only Binance', async () => {
        const { bankAccount, binanceAccount: exchangeAccount } = await seedP2pFiatTransferFixture();
        const { expense, income } = seedP2pPair(
            { externalId: 'mono-uah-okx-out', accountId: bankAccount.id, amount: P2P_UAH_TOTAL },
            { externalId: 'okx:c2c:buy-1', accountId: exchangeAccount.id, amount: P2P_USDT_AMOUNT }
        );

        const result = await transferConsolidationService.consolidate();

        expect(result).toEqual({ found: 1, consolidated: 1 });
        expectConsolidatedToP2pCanonical(expense, income, bankAccount.id, exchangeAccount.id);
    });

    it('does not consolidate a pair whose implied rate is far from the market rate', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const offRateAmount = Number('8000') * PRECISION;
        seedP2pPair(
            { externalId: 'mono-uah-off-rate', accountId: bankAccount.id, amount: offRateAmount },
            { externalId: 'binance:c2c:buy-off-rate', accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT }
        );

        const result = await transferConsolidationService.consolidate();

        expect(result.consolidated).toBe(0);
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
    });
});
