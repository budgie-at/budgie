import { BankProviderEnum, BankSyncErrorCodeEnum, BankTransactionTypeEnum, BaseBankSyncService } from '@budgie/bank-sync';
import { describe, expect, it } from 'vitest';

import type {
    BankAccountInterface,
    BankClientInfoInterface,
    BankProviderClientInterface,
    BankSyncOptionsInterface,
    BankSyncResultInterface,
    BankTransactionInterface
} from '@budgie/bank-sync';

const MAX_PERIOD_SECONDS = 2_678_400;
const RATE_LIMIT_MS = 60_000;
const DORMANCY_MONTHS = 6;
const PAGE_SIZE = 500;
const ACCOUNT_ID = 'acc-1';
const MS_PER_SECOND = 1_000;
const MS_PER_DAY = 86_400_000;
const SIX_MONTHS_DAYS = 180;
const SIX_MONTHS_AND_ONE_DAY_OFFSET_MS = -(SIX_MONTHS_DAYS + 1) * MS_PER_DAY;
const RECENT_TX_DAYS = 30;
const EXTENDED_TO_DAYS = 100;
const RECENT_TX_OFFSET_MS = -RECENT_TX_DAYS * MS_PER_DAY;
const EXTENDED_TO_OFFSET_MS = -EXTENDED_TO_DAYS * MS_PER_DAY;

const toUnixSeconds = (date: Date): number => Math.floor(date.getTime() / MS_PER_SECOND);

const buildOptions = (overrides: Partial<BankSyncOptionsInterface> = {}): BankSyncOptionsInterface => ({
    maxPeriodSeconds: MAX_PERIOD_SECONDS,
    rateLimitMs: RATE_LIMIT_MS,
    dormancyMonths: DORMANCY_MONTHS,
    ...overrides
});

const buildTransaction = (timeSeconds: number, id: string): BankTransactionInterface => ({
    id,
    time: timeSeconds,
    description: 'tx',
    mcc: 5411,
    originalMcc: 5411,
    amount: -100,
    operationAmount: -100,
    currencyCode: 980,
    commissionRate: 0,
    cashbackAmount: 0,
    balance: 0,
    hold: false,
    provider: BankProviderEnum.MONOBANK,
    accountId: ACCOUNT_ID,
    type: BankTransactionTypeEnum.EXPENSE
});

class StubClient implements BankProviderClientInterface {
    constructor(private readonly response: BankSyncResultInterface<BankTransactionInterface[]>) {}

    async getClientInfo(): Promise<BankSyncResultInterface<BankClientInfoInterface>> {
        return { success: false, error: { code: BankSyncErrorCodeEnum.UNKNOWN, message: 'not used', provider: BankProviderEnum.MONOBANK } };
    }

    async getAccounts(): Promise<BankSyncResultInterface<BankAccountInterface[]>> {
        return { success: false, error: { code: BankSyncErrorCodeEnum.UNKNOWN, message: 'not used', provider: BankProviderEnum.MONOBANK } };
    }

    async getTransactions(): Promise<BankSyncResultInterface<BankTransactionInterface[]>> {
        return this.response;
    }
}

const buildSuccess = (txs: BankTransactionInterface[]): BankSyncResultInterface<BankTransactionInterface[]> => ({
    success: true,
    data: txs
});

describe('BaseBankSyncService.syncTransactionsBackward', () => {
    it('returns completed=false on a page-full window (500 txs) and advances cursor by oldest tx time minus one second', async () => {
        const sweepTo = new Date();
        const txs = Array.from({ length: PAGE_SIZE }, (_, index) => buildTransaction(toUnixSeconds(sweepTo) - index, `tx-${index}`));
        const service = new BaseBankSyncService(new StubClient(buildSuccess(txs)), buildOptions());

        const result = await service.syncTransactionsBackward(ACCOUNT_ID, sweepTo, null);

        expect(result.completed).toBe(false);
        expect(result.transactions).toHaveLength(PAGE_SIZE);
        expect(toUnixSeconds(result.nextTo)).toBe(toUnixSeconds(sweepTo) - PAGE_SIZE);
    });

    it('returns completed=false on an empty window when (now - dormancyMonths) is still ahead and no activity seen yet', async () => {
        const sweepTo = new Date();
        const service = new BaseBankSyncService(new StubClient(buildSuccess([])), buildOptions());

        const result = await service.syncTransactionsBackward(ACCOUNT_ID, sweepTo, null);

        expect(result.completed).toBe(false);
        expect(result.transactions).toHaveLength(0);
    });

    it('returns completed=true when the current window crosses (now - dormancyMonths) with no activity seen yet', async () => {
        const farPastTo = new Date(Date.now() + SIX_MONTHS_AND_ONE_DAY_OFFSET_MS);
        const service = new BaseBankSyncService(new StubClient(buildSuccess([])), buildOptions());

        const result = await service.syncTransactionsBackward(ACCOUNT_ID, farPastTo, null);

        expect(result.completed).toBe(true);
    });

    it('extends the dormancy boundary 6 months past oldestSeenTxTime so the sweep keeps walking past now-6mo', async () => {
        const oldestSeen = new Date(Date.now() + RECENT_TX_OFFSET_MS);
        const extendedTo = new Date(Date.now() + EXTENDED_TO_OFFSET_MS);
        const service = new BaseBankSyncService(new StubClient(buildSuccess([])), buildOptions());

        const result = await service.syncTransactionsBackward(ACCOUNT_ID, extendedTo, oldestSeen);

        expect(result.completed).toBe(false);
    });

    it('treats INVALID_RESPONSE as an empty window', async () => {
        const sweepTo = new Date();
        const errorResponse: BankSyncResultInterface<BankTransactionInterface[]> = {
            success: false,
            error: { code: BankSyncErrorCodeEnum.INVALID_RESPONSE, message: 'bad payload', provider: BankProviderEnum.MONOBANK }
        };
        const service = new BaseBankSyncService(new StubClient(errorResponse), buildOptions());

        const result = await service.syncTransactionsBackward(ACCOUNT_ID, sweepTo, null);

        expect(result.completed).toBe(false);
        expect(result.transactions).toHaveLength(0);
    });
});
