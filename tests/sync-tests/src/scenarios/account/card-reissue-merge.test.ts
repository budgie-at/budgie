import {
    AccountEntityTable,
    AccountExternalIdEntityTable,
    convertToMicroUnits,
    ExternalSourceEnum,
    SyncEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { AccountReissueMergeService, ExternalAccountService, SyncRepairService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, seed, testDb, TestLayer } from '../../harness';
import {
    buildOwnCardRow,
    buildOwnCardStatementClient,
    fetchVisibleTransactions,
    makeOwnCardStatementService,
    seedOwnCard
} from '../../harness/file-sync/privatbank-own-card-statement';

import type { PrivatbankRowInterface } from '@budgie/sync';

const OLD_CARD = '5100 **** **** 8522';
const BRIDGE_CARD = '4700 **** **** 5779';
const NEW_CARD = '4700 **** **** 8738';
const OTHER_CARD = '5100 **** **** 1111';
const STATEMENT_URI = 'privatbank-statement.xlsx';
const SALARY = 'Salary ACME LLC';
const RENT = 'Rent Landlord';

const day = (isoDate: string) => new Date(`${isoDate}T09:00:00.000Z`);

const chainRows: PrivatbankRowInterface[] = [
    buildOwnCardRow(OLD_CARD, 1000, SALARY, day('2026-06-01')),
    buildOwnCardRow(OLD_CARD, -400, RENT, day('2026-06-05')),
    buildOwnCardRow(OLD_CARD, -30, 'Coffee', day('2026-06-22')),
    buildOwnCardRow(BRIDGE_CARD, 300, 'Зі своєї картки *4321', day('2026-07-06')),
    buildOwnCardRow(BRIDGE_CARD, -300, RENT, day('2026-07-06')),
    buildOwnCardRow(NEW_CARD, 1000, SALARY, day('2026-07-07')),
    buildOwnCardRow(NEW_CARD, -400, RENT, day('2026-07-10'))
];

const quickImport = (rows: PrivatbankRowInterface[]) =>
    Effect.flatMap(makeOwnCardStatementService(buildOwnCardStatementClient(rows)), service => service.quickImport(STATEMENT_URI));

const fetchLiveAccounts = () => testDb.select().from(AccountEntityTable).where(isNull(AccountEntityTable.deletedAt));

const seedSplitCard = (card: string, rows: readonly (readonly [number, string, string])[]) =>
    Effect.gen(function* () {
        const account = yield* seedOwnCard(card);

        yield* seed.sync({ accountId: account.id, provider: ExternalSourceEnum.PRIVATBANK });
        yield* Effect.forEach(rows, ([amount, title, isoDate]) =>
            seed.manualExpense({
                accountId: account.id,
                amount: Math.abs(amount),
                operatedAt: day(isoDate),
                title,
                externalSource: ExternalSourceEnum.PRIVATBANK,
                type: amount > 0 ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE
            })
        );

        return account;
    });

describe('account/card-reissue-merge', () => {
    it.effect('merges a reissued card chain into the oldest card and resolves old card numbers on re-import', () =>
        Effect.gen(function* () {
            yield* quickImport(chainRows);

            const [account, ...rest] = yield* fetchLiveAccounts();
            const aliases = yield* testDb.select().from(AccountExternalIdEntityTable);
            const visible = yield* fetchVisibleTransactions();

            expect(rest).toEqual([]);
            expect(account).toMatchObject({ externalId: NEW_CARD, title: 'Privatbank •8738' });
            expect(aliases).toHaveLength(2);
            expect(aliases).toEqual(
                expect.arrayContaining([
                    { externalId: OLD_CARD, accountId: account.id },
                    { externalId: BRIDGE_CARD, accountId: account.id }
                ])
            );
            expect(visible).toHaveLength(chainRows.length);
            expect(visible.every(transaction => (transaction.fromAccountId ?? transaction.toAccountId) === account.id)).toBe(true);
            expect(yield* testDb.select().from(SyncEntityTable)).toHaveLength(1);
            expect(yield* fetchAccountBalance(account.id)).toBe(
                convertToMicroUnits(chainRows.reduce((total, row) => total + row.cardAmount, 0))
            );

            expect(yield* quickImport(chainRows)).toMatchObject({ createdAccountCount: 0, newTransactionCount: 0 });
            expect(yield* fetchLiveAccounts()).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps cards apart when they overlap, share no counterparty or have two possible predecessors', () =>
        Effect.gen(function* () {
            yield* quickImport([
                buildOwnCardRow(OLD_CARD, 1000, SALARY, day('2026-06-01')),
                buildOwnCardRow(OLD_CARD, -400, RENT, day('2026-07-20')),
                buildOwnCardRow(NEW_CARD, 1000, SALARY, day('2026-07-07'))
            ]);
            yield* quickImport([
                buildOwnCardRow(OTHER_CARD, -30, 'Coffee', day('2026-08-01')),
                buildOwnCardRow(BRIDGE_CARD, -50, 'Groceries', day('2026-08-10'))
            ]);

            expect(yield* fetchLiveAccounts()).toHaveLength(4);
            expect(yield* testDb.select().from(AccountExternalIdEntityTable)).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a successor separate when two cards could be its predecessor', () =>
        Effect.gen(function* () {
            yield* quickImport([
                buildOwnCardRow(OLD_CARD, 1000, SALARY, day('2026-06-01')),
                buildOwnCardRow(OTHER_CARD, -400, RENT, day('2026-06-02')),
                buildOwnCardRow(OLD_CARD, -20, 'Coffee', day('2026-06-20')),
                buildOwnCardRow(OTHER_CARD, -20, 'Tea', day('2026-06-21')),
                buildOwnCardRow(NEW_CARD, 1000, SALARY, day('2026-07-01')),
                buildOwnCardRow(NEW_CARD, -400, RENT, day('2026-07-02'))
            ]);

            expect(yield* fetchLiveAccounts()).toHaveLength(3);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('merges accounts sharing a real IBAN and resolves the old account id on re-import', () =>
        Effect.gen(function* () {
            const iban = 'AT611904300234573201';
            const oldAccount = yield* seed.bankSyncAccount('AT-OLD', ExternalSourceEnum.ERSTE, iban);
            const newAccount = yield* seed.bankSyncAccount('AT-NEW', ExternalSourceEnum.ERSTE, iban);

            yield* seed.sync({ accountId: oldAccount.id, provider: ExternalSourceEnum.ERSTE });
            yield* seed.sync({ accountId: newAccount.id, provider: ExternalSourceEnum.ERSTE });
            yield* seed.manualExpense({
                accountId: oldAccount.id,
                amount: 10,
                operatedAt: day('2026-01-01'),
                title: 'Old',
                externalSource: ExternalSourceEnum.ERSTE
            });
            yield* seed.manualExpense({
                accountId: newAccount.id,
                amount: 20,
                operatedAt: day('2026-09-01'),
                title: 'New',
                externalSource: ExternalSourceEnum.ERSTE
            });

            const accountReissueMergeService = yield* AccountReissueMergeService;

            expect(yield* accountReissueMergeService.mergeReissuedAccounts()).toBe(1);

            const [account, ...rest] = yield* fetchLiveAccounts();

            expect(rest).toEqual([]);
            expect(account).toMatchObject({ id: oldAccount.id, externalId: 'AT-NEW', iban });
            expect(yield* testDb.select().from(AccountExternalIdEntityTable)).toEqual([{ externalId: 'AT-OLD', accountId: oldAccount.id }]);
            expect(yield* fetchAccountBalance(oldAccount.id)).toBe(-30);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('merges already split cards in Sync Repairs once and never touches an external card', () =>
        Effect.gen(function* () {
            const syncRepairService = yield* SyncRepairService;
            const externalAccountService = yield* ExternalAccountService;
            const oldCard = yield* seedSplitCard(OLD_CARD, [
                [1000, SALARY, '2026-05-01'],
                [-400, RENT, '2026-05-02']
            ]);

            yield* testDb.update(AccountEntityTable).set({ title: 'Salary card' }).where(eq(AccountEntityTable.id, oldCard.id));
            const externalCard = yield* seedSplitCard(OTHER_CARD, [
                [1000, SALARY, '2026-05-10'],
                [-400, RENT, '2026-05-30']
            ]);

            yield* externalAccountService.markExternal(externalCard.id);
            yield* seedSplitCard(NEW_CARD, [
                [1000, SALARY, '2026-06-01'],
                [-400, RENT, '2026-06-02']
            ]);

            expect((yield* syncRepairService.previewDuplicates()).duplicateTransactionCount).toBe(1);
            expect((yield* syncRepairService.removeDuplicates()).repairedTransactionCount).toBe(1);
            expect((yield* syncRepairService.removeDuplicates()).repairedTransactionCount).toBe(0);

            const [account, ...rest] = yield* fetchLiveAccounts();

            expect(rest).toEqual([]);
            expect(account).toMatchObject({ id: oldCard.id, externalId: NEW_CARD, isActive: true, title: 'Salary card' });
            expect(yield* fetchAccountBalance(oldCard.id)).toBe(1200);
        }).pipe(Effect.provide(TestLayer))
    );
});
