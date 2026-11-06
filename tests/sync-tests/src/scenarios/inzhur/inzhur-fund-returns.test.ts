import {
    AccountRepository,
    TransactionRepository,
    PRECISION,
    InvestmentReturnRepository,
    TransactionTypeEnum,
    CategoryEntityTable,
    CategorySourceEnum,
    convertFromMicroUnits,
    INVESTMENTS_CATEGORY_ID
} from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { InzhurGainService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { testDb } from '../../harness';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { consolidateInzhur } from '../../harness/inzhur/consolidate-inzhur';
import { importInzhurBankFlow } from '../../harness/inzhur/import-inzhur-bank-flow';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import { REIT_DIVIDEND_DESCRIPTION } from '../../harness/inzhur/inzhur-bank-descriptions.constant';
import { ENERGY_ISIN, REIT_ISIN } from '../../harness/inzhur/inzhur-fund-isins.constant';
import { BASE_ROWS, DIVIDEND_TYPE, REIT, TOP_UP_TYPE } from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurFundAccount } from '../../harness/inzhur/require-inzhur-fund-account';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';
import { seedInzhurReitPrices } from '../../harness/inzhur/seed-inzhur-reit-prices';

const URI = 'returns.xlsx';

const layer = makeInzhurOperationsLayer({
    'top-up.xlsx': buildInzhurOperationsWorkbook([{ at: '2026-01-01T10:00:00', type: TOP_UP_TYPE, debit: 1000 }]),
    [URI]: buildInzhurOperationsWorkbook([
        ...BASE_ROWS,
        { at: '2026-01-10T10:06:00', type: 'Купівля 2 сертифікати', fund: 'Inzhur Energy', credit: 20 },
        { at: '2026-02-01T10:00:00', type: DIVIDEND_TYPE, fund: REIT, debit: 100 },
        { at: '2026-02-01T10:01:00', type: DIVIDEND_TYPE, fund: 'Inzhur Energy', debit: 40 }
    ])
});

describe('inzhur/fund-returns', () => {
    it.effect('links a bank dividend processed before fund accounts existed without retouching it on repeated consolidation', () =>
        Effect.gen(function* () {
            yield* seedInzhurReitPrices;
            yield* importInzhurOperations('top-up.xlsx');
            const bankAccount = yield* seedInzhurBankAccount;
            yield* importInzhurBankFlow(
                bankAccount.id,
                'unlinked-dividend',
                REIT_DIVIDEND_DESCRIPTION,
                120,
                new Date('2026-05-05T12:00:00.000Z')
            );
            yield* consolidateInzhur;
            const repository = yield* TransactionRepository;
            expect(
                (yield* repository.findByAccountIdsWithEntries([bankAccount.id])).find(
                    transaction => transaction.externalId === 'unlinked-dividend'
                )
            ).toMatchObject({ fundAccountId: null, title: 'Inzhur dividends' });
            yield* importInzhurOperations(URI);
            const reit = yield* requireInzhurFundAccount(REIT_ISIN);
            const dividend = (yield* repository.findByAccountIdsWithEntries([bankAccount.id])).find(
                transaction => transaction.externalId === 'unlinked-dividend'
            );
            expect(dividend).toMatchObject({ fundAccountId: reit.id, title: 'REIT dividends' });
            expect(yield* (yield* InzhurGainService).getFundCostReturn(reit.id, '2026-05-05')).toMatchObject({ dividends: 220 });
            yield* consolidateInzhur;
            expect(
                (yield* repository.findByAccountIdsWithEntries([bankAccount.id])).find(
                    transaction => transaction.externalId === 'unlinked-dividend'
                )?.updatedAt
            ).toEqual(dividend?.updatedAt);
        }).pipe(Effect.provide(layer))
    );

    it.effect('attributes an uncovered bank dividend when funds are first created by an export', () =>
        Effect.gen(function* () {
            yield* seedInzhurReitPrices;
            const bankAccount = yield* seedInzhurBankAccount;
            yield* importInzhurBankFlow(
                bankAccount.id,
                'early-dividend',
                REIT_DIVIDEND_DESCRIPTION,
                120,
                new Date('2026-05-05T12:00:00.000Z')
            );
            const repository = yield* TransactionRepository;
            const dividend = (yield* repository.findByAccountIdsWithEntries([bankAccount.id])).find(
                transaction => transaction.externalId === 'early-dividend'
            );
            expect(dividend).toBeDefined();
            if (!isDefined(dividend)) {
                return;
            }
            yield* (yield* TransactionService).updateById(dividend.id, {
                comment: 'My payout note',
                entries: dividend.entries.map(entry => ({ ...entry, amount: convertFromMicroUnits(entry.amount) })),
                tagIds: []
            });
            yield* importInzhurBankFlow(
                bankAccount.id,
                'recategorized-dividend',
                REIT_DIVIDEND_DESCRIPTION,
                30,
                new Date('2026-05-06T12:00:00.000Z')
            );
            const recategorized = (yield* repository.findByAccountIdsWithEntries([bankAccount.id])).find(
                transaction => transaction.externalId === 'recategorized-dividend'
            );
            const category = (yield* testDb.select().from(CategoryEntityTable)).find(item => item.id !== INVESTMENTS_CATEGORY_ID);
            expect(recategorized).toBeDefined();
            expect(category).toBeDefined();
            if (!isDefined(recategorized) || !isDefined(category)) {
                return;
            }
            yield* (yield* TransactionService).updateById(recategorized.id, {
                entries: recategorized.entries.map(entry => ({
                    ...entry,
                    amount: convertFromMicroUnits(entry.amount),
                    categoryId: category.id,
                    categorySource: CategorySourceEnum.USER
                })),
                tagIds: []
            });
            yield* importInzhurOperations(URI);
            const reit = yield* requireInzhurFundAccount(REIT_ISIN);
            const transactions = yield* (yield* TransactionRepository).findByAccountIdsWithEntries([bankAccount.id]);
            expect(transactions.find(transaction => transaction.externalId === 'recategorized-dividend')).toMatchObject({
                fundAccountId: null
            });
            expect(transactions.find(transaction => transaction.externalId === 'early-dividend')).toMatchObject({
                fundAccountId: reit.id,
                title: REIT_DIVIDEND_DESCRIPTION,
                comment: 'My payout note'
            });
            expect(yield* (yield* InzhurGainService).getFundCostReturn(reit.id, '2026-05-05')).toMatchObject({ dividends: 220 });
        }).pipe(Effect.provide(layer))
    );

    it.effect('groups bank and export dividends by the linked fund account', () =>
        Effect.gen(function* () {
            const gainService = yield* InzhurGainService;
            yield* seedInzhurReitPrices;
            const bankAccount = yield* seedInzhurBankAccount;

            yield* importInzhurOperations(URI);
            const reit = yield* requireInzhurFundAccount(REIT_ISIN);
            yield* (yield* AccountRepository).updateById(reit.id, { title: 'Retirement' });
            yield* importInzhurBankFlow(bankAccount.id, 'dividend', REIT_DIVIDEND_DESCRIPTION, 120, new Date('2026-05-05T12:00:00.000Z'));

            expect(yield* gainService.getFundCostReturn(reit.id, '2026-05-05')).toMatchObject({ dividends: 220 });
            const investmentReturnRepository = yield* InvestmentReturnRepository;
            const energy = yield* requireInzhurFundAccount(ENERGY_ISIN);
            const movements = yield* investmentReturnRepository.findLedgerMovements([
                reit.id,
                energy.id,
                (yield* requireInzhurSetup()).cashAccount.id
            ]);

            const dividends = movements.filter(movement => movement.transactionType === TransactionTypeEnum.INCOME);
            expect(
                dividends.filter(movement => movement.fundAccountId === reit.id).reduce((sum, movement) => sum + movement.amount, 0)
            ).toBe(220 * PRECISION);
            expect(
                dividends.filter(movement => movement.fundAccountId === energy.id).reduce((sum, movement) => sum + movement.amount, 0)
            ).toBe(40 * PRECISION);
            expect(
                movements.filter(
                    movement =>
                        movement.transactionType === TransactionTypeEnum.TRANSFER && [reit.id, energy.id].includes(movement.accountId)
                )
            ).toHaveLength(2);
        }).pipe(Effect.provide(layer))
    );
});
