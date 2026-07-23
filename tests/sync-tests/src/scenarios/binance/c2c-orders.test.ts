import { TransferConsolidationDrainReasonEnum } from '@app/sync/enum/transfer-consolidation-drain-reason.enum';
import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { transferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import { AccountTypeEnum, ExternalSourceEnum, PRECISION, SyncModeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { BinanceSignedClient, BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { describe, expect, it, vi } from 'vitest';

import {
    binanceStub,
    buildBinance,
    fetchExpenseEntries,
    expectSingleBinanceTransaction,
    fetchBinanceEntriesByExternalId,
    fetchBinanceTransactions,
    resetBinanceSyncForResync,
    seed,
    setupBinanceFixture,
    stubEmptyBinanceBalances
} from '../../harness';

const setupForwardUsdtScenario = (): void => {
    setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
    stubEmptyBinanceBalances();
};

const stubBuyC2cOrder = (orderNumber: string): void => {
    binanceStub.c2cOrders([buildBinance.c2cOrder({ orderNumber, tradeType: 'BUY', asset: 'USDT', amount: '100' })], []);
};

const seedFundingAccount = (instrumentId: number) =>
    seed.account({
        externalId: encodeBinanceAccountId({ wallet: BinanceWalletEnum.FUNDING, asset: 'USDT' }),
        externalSource: ExternalSourceEnum.BINANCE,
        type: AccountTypeEnum.CRYPTO_SYNC,
        instrumentId
    });

const seedExistingBinanceIncome = (accountId: number, externalId: string, operatedAt = new Date()) => {
    const transaction = seed.bankPairIncome({ externalId, operatedAt }, { accountId, amount: PRECISION, mccCategoryId: null });
    seed.updateTransaction(transaction.id, { externalSource: ExternalSourceEnum.BINANCE });

    return transaction;
};

const HISTORICAL_OPERATED_AT = new Date('2026-01-01T00:00:00.000Z');
const enqueueSpy = vi.spyOn(transferConsolidationDrainerService, 'enqueue');

describe('binance/c2c-orders reconciliation', () => {
    it('stores P2P orders on the Funding wallet account', async () => {
        const { token } = setupBinanceFixture({ asset: 'USDT', wallet: BinanceWalletEnum.FUNDING, mode: SyncModeEnum.FORWARD });
        stubBuyC2cOrder('c2c-funding-buy');

        const result = await new BinanceSignedClient(token).getC2cTransactions(0);

        expect(result.success).toBe(true);
        expect(result.success ? result.data[0].accountId : null).toBe(
            encodeBinanceAccountId({ wallet: BinanceWalletEnum.FUNDING, asset: 'USDT' })
        );
    });

    it('queues consolidation after moving an existing P2P entry from Spot to Funding', async () => {
        const { account: spotAccount, instrument } = setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
        const fundingAccount = seedFundingAccount(instrument.id);
        const externalId = 'binance:c2c:c2c-existing';
        seedExistingBinanceIncome(spotAccount.id, externalId);
        stubEmptyBinanceBalances();
        stubBuyC2cOrder('c2c-existing');

        await binanceSyncService.sync();

        const entries = fetchBinanceEntriesByExternalId(externalId);
        expect(entries).toHaveLength(1);
        expect(entries[0].accountId).toBe(fundingAccount.id);
        expect(enqueueSpy.mock.calls).toContainEqual([TransferConsolidationDrainReasonEnum.BINANCE_SYNC]);
    });

    it('moves only the Binance entry when another provider uses the same external id', async () => {
        const { account: spotAccount, instrument } = setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
        const fundingAccount = seedFundingAccount(instrument.id);
        const unrelatedAccount = seed.account({ externalId: 'unrelated-account', instrumentId: instrument.id });
        const externalId = 'binance:c2c:c2c-shared-external-id';
        const unrelatedTransaction = seed.bankPairIncome(
            { externalId, operatedAt: new Date() },
            { accountId: unrelatedAccount.id, amount: PRECISION, mccCategoryId: null }
        );
        const existingTransaction = seedExistingBinanceIncome(spotAccount.id, externalId);
        stubEmptyBinanceBalances();
        stubBuyC2cOrder('c2c-shared-external-id');

        await binanceSyncService.sync();

        expect((await fetchExpenseEntries(unrelatedTransaction.id))[0]?.accountId).toBe(unrelatedAccount.id);
        expect((await fetchExpenseEntries(existingTransaction.id))[0]?.accountId).toBe(fundingAccount.id);
    });

    it('queues scoped consolidation when an existing P2P entry is already in Funding', async () => {
        enqueueSpy.mockClear();
        const { account: fundingAccount } = setupBinanceFixture({
            asset: 'USDT',
            wallet: BinanceWalletEnum.FUNDING,
            mode: SyncModeEnum.FORWARD
        });
        const externalId = 'binance:c2c:c2c-existing-funding';
        const existingTransaction = seedExistingBinanceIncome(fundingAccount.id, externalId);
        const historicalTransaction = seedExistingBinanceIncome(
            fundingAccount.id,
            'binance:c2c:c2c-historical-funding',
            HISTORICAL_OPERATED_AT
        );
        stubEmptyBinanceBalances();
        stubBuyC2cOrder('c2c-existing-funding');

        await binanceSyncService.sync();

        expect(enqueueSpy.mock.calls).toEqual(
            expect.arrayContaining([
                [TransferConsolidationDrainReasonEnum.BINANCE_SYNC, expect.objectContaining({ transactionIds: [existingTransaction.id] })]
            ])
        );
        expect(fetchBinanceTransactions().map(transaction => transaction.id)).toContain(historicalTransaction.id);
    });
});

describe('binance/c2c-orders mapping', () => {
    it('maps a P2P BUY order to an INCOME transaction on the asset account', async () => {
        setupForwardUsdtScenario();
        stubBuyC2cOrder('c2c-buy-1');

        await binanceSyncService.sync();

        expectSingleBinanceTransaction(TransactionTypeEnum.INCOME, 'binance:c2c:c2c-buy-1');
    });

    it('maps a P2P SELL order to an EXPENSE transaction', async () => {
        setupForwardUsdtScenario();
        binanceStub.c2cOrders([], [buildBinance.c2cOrder({ orderNumber: 'c2c-sell-1', tradeType: 'SELL', asset: 'USDT', amount: '50' })]);

        await binanceSyncService.sync();

        expectSingleBinanceTransaction(TransactionTypeEnum.EXPENSE, 'binance:c2c:c2c-sell-1');
    });

    it('skips non-COMPLETED C2C orders', async () => {
        setupForwardUsdtScenario();
        binanceStub.c2cOrders(
            [buildBinance.c2cOrder({ orderNumber: 'c2c-pending', tradeType: 'BUY', asset: 'USDT', amount: '100', orderStatus: 'PENDING' })],
            []
        );

        await binanceSyncService.sync();

        expect(fetchBinanceTransactions()).toHaveLength(0);
    });

    it('does not create duplicate C2C transactions on a second sync run', async () => {
        setupForwardUsdtScenario();
        stubBuyC2cOrder('c2c-dup');

        await binanceSyncService.sync();
        expect(fetchBinanceTransactions()).toHaveLength(1);

        resetBinanceSyncForResync();
        stubBuyC2cOrder('c2c-dup');
        await binanceSyncService.sync();

        expect(fetchBinanceTransactions()).toHaveLength(1);
    });

    it('treats a 403 on the C2C endpoint as non-fatal and still syncs deposits', async () => {
        setupForwardUsdtScenario();
        binanceStub.c2cUnavailable();
        binanceStub.deposits([buildBinance.deposit({ id: 'dep-after-c2c-403', coin: 'USDT', amount: '5' })]);

        await binanceSyncService.sync();

        const transactions = fetchBinanceTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].externalId).toBe('dep-after-c2c-403');
    });
});
