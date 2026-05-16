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
const MAX_EMPTY_WINDOWS = 3;
const PAGE_SIZE = 500;
const ACCOUNT_ID = 'acc-1';
const MS_PER_SECOND = 1_000;
const MS_PER_DAY = 86_400_000;
const FLOOR_OFFSET_MS = -5 * 365 * MS_PER_DAY;
const SWEEP_TO = new Date('2026-05-16T00:00:00Z');
const NEXT_BACKWARD_SYNCED_AT_OFFSET_MS = -10 * MS_PER_DAY;
const JUST_ABOVE_FLOOR_OFFSET_MS = FLOOR_OFFSET_MS + MS_PER_DAY;

const toUnixSeconds = (date: Date): number => Math.floor(date.getTime() / MS_PER_SECOND);

const buildOptions = (overrides: Partial<BankSyncOptionsInterface> = {}): BankSyncOptionsInterface => ({
    maxPeriodSeconds: MAX_PERIOD_SECONDS,
    rateLimitMs: RATE_LIMIT_MS,
    historicalFloor: new Date(SWEEP_TO.getTime() + FLOOR_OFFSET_MS),
    maxEmptyWindowsBeforeStop: MAX_EMPTY_WINDOWS,
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
    it('returns completed=false with reset counter when the window is page-full (500 txs)', async () => {
        const txs = Array.from({ length: PAGE_SIZE }, (_, index) => buildTransaction(toUnixSeconds(SWEEP_TO) - index, `tx-${index}`));
        const service = new BaseBankSyncService(new StubClient(buildSuccess(txs)), buildOptions());

        const result = await service.syncTransactionsBackward(ACCOUNT_ID, SWEEP_TO, 0, null);

        expect(result.completed).toBe(false);
        expect(result.nextEmptyWindowCount).toBe(0);
        expect(result.transactions).toHaveLength(PAGE_SIZE);
        expect(toUnixSeconds(result.nextTo)).toBe(toUnixSeconds(SWEEP_TO) - PAGE_SIZE);
    });

    it('returns completed=false with incremented counter on an empty window below the safety-net threshold', async () => {
        const service = new BaseBankSyncService(new StubClient(buildSuccess([])), buildOptions());

        const result = await service.syncTransactionsBackward(ACCOUNT_ID, SWEEP_TO, 1, null);

        expect(result.completed).toBe(false);
        expect(result.nextEmptyWindowCount).toBe(2);
        expect(result.transactions).toHaveLength(0);
    });

    it('returns completed=true on the empty window that reaches the safety-net threshold', async () => {
        const service = new BaseBankSyncService(new StubClient(buildSuccess([])), buildOptions());

        const result = await service.syncTransactionsBackward(ACCOUNT_ID, SWEEP_TO, MAX_EMPTY_WINDOWS - 1, null);

        expect(result.completed).toBe(true);
        expect(result.nextEmptyWindowCount).toBe(MAX_EMPTY_WINDOWS);
    });

    it('resets the empty-window counter when a partial (1..499) window returns data', async () => {
        const txs = [buildTransaction(toUnixSeconds(SWEEP_TO) - 1, 'tx-only')];
        const service = new BaseBankSyncService(new StubClient(buildSuccess(txs)), buildOptions());

        const result = await service.syncTransactionsBackward(ACCOUNT_ID, SWEEP_TO, MAX_EMPTY_WINDOWS - 1, null);

        expect(result.completed).toBe(false);
        expect(result.nextEmptyWindowCount).toBe(0);
        expect(result.transactions).toHaveLength(1);
    });

    it('completes when the next window crosses the configured historical floor on an empty window', async () => {
        const justAboveFloor = new Date(SWEEP_TO.getTime() + JUST_ABOVE_FLOOR_OFFSET_MS);
        const service = new BaseBankSyncService(new StubClient(buildSuccess([])), buildOptions());

        const result = await service.syncTransactionsBackward(ACCOUNT_ID, justAboveFloor, 0, null);

        expect(result.completed).toBe(true);
        expect(result.nextEmptyWindowCount).toBe(1);
    });

    it('uses previousBackwardSyncedAt as the floor when it is more recent than options.historicalFloor', async () => {
        const previousBackwardSyncedAt = new Date(SWEEP_TO.getTime() + NEXT_BACKWARD_SYNCED_AT_OFFSET_MS);
        const service = new BaseBankSyncService(new StubClient(buildSuccess([])), buildOptions());

        const result = await service.syncTransactionsBackward(ACCOUNT_ID, SWEEP_TO, 0, previousBackwardSyncedAt);

        expect(result.completed).toBe(true);
        expect(result.nextEmptyWindowCount).toBe(1);
    });

    it('falls back to options.historicalFloor when previousBackwardSyncedAt is null', async () => {
        const service = new BaseBankSyncService(new StubClient(buildSuccess([])), buildOptions());

        const result = await service.syncTransactionsBackward(ACCOUNT_ID, SWEEP_TO, 0, null);

        expect(result.completed).toBe(false);
        expect(result.nextEmptyWindowCount).toBe(1);
    });

    it('treats INVALID_RESPONSE as an empty window (counter increments)', async () => {
        const errorResponse: BankSyncResultInterface<BankTransactionInterface[]> = {
            success: false,
            error: { code: BankSyncErrorCodeEnum.INVALID_RESPONSE, message: 'bad payload', provider: BankProviderEnum.MONOBANK }
        };
        const service = new BaseBankSyncService(new StubClient(errorResponse), buildOptions());

        const result = await service.syncTransactionsBackward(ACCOUNT_ID, SWEEP_TO, 0, null);

        expect(result.completed).toBe(false);
        expect(result.nextEmptyWindowCount).toBe(1);
        expect(result.transactions).toHaveLength(0);
    });
});
