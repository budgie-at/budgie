import { TestSeedService, makeTestDbLayer } from '@budgie-at/test-kit';
import { Db, TransactionConsolidationTypeEnum, TransactionTypeEnum, deriveConsolidationSyncId } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { testDb } from '../../harness';

import { expectBalancesMatchLedger, refreshAllBalances } from './apply-harness';
import { reapplyAutomation, syncIdsOf } from './automation-harness';
import {
    ALICE_IBAN,
    BOB_IBAN,
    EXPENSE_AT,
    INCOME_AT,
    PRIVATE_ACCOUNT_TITLE,
    PRIVATE_COMMENT,
    PRIVATE_TITLE,
    TRANSFER_AMOUNT,
    balanceOf,
    setupMemberHousehold,
    settleMembers,
    unconsolidateOn,
    visibleTransactions
} from './member-transfer-harness';
import { countRows, queryRows } from './share-harness';

import type { MemberCloudsInterface } from './member-transfer-harness';
import type { DB } from '@budgie/contracts';

const PRIVATE_STRINGS = [PRIVATE_TITLE, PRIVATE_COMMENT, PRIVATE_ACCOUNT_TITLE, ALICE_IBAN];

const transferMccIdOf = (database: DB) =>
    database.$client
        .unsafe<{ readonly id: number }>(`SELECT id FROM mcc_categories WHERE mcc = '4829'`)
        .pipe(Effect.map(([mccCategory]) => mccCategory.id));

const createAliceExpense = (
    accountId: number,
    input: { readonly amount: number; readonly toIban: string | null; readonly mccCategoryId?: number }
) =>
    Effect.gen(function* () {
        const expense = yield* new TestSeedService(testDb).bankPairExpense(
            { externalId: 'alice-out', operatedAt: EXPENSE_AT },
            { accountId, ...input }
        );

        yield* testDb.$client.unsafe(`UPDATE transactions SET title = ?, comment = ? WHERE id = ?`, [
            PRIVATE_TITLE,
            PRIVATE_COMMENT,
            expense.id
        ]);
        yield* refreshAllBalances(testDb);

        return expense;
    });

const createBobIncome = (database: DB, accountId: number, mccCategoryId?: number) =>
    Effect.gen(function* () {
        const income = yield* new TestSeedService(database).bankPairIncome(
            { externalId: 'bob-in', operatedAt: INCOME_AT },
            { accountId, amount: TRANSFER_AMOUNT, ...(mccCategoryId !== undefined && { mccCategoryId }) }
        );

        yield* refreshAllBalances(database);

        return income;
    });

const createBobExpense = (database: DB, accountId: number, toIban: string) =>
    Effect.gen(function* () {
        const expense = yield* new TestSeedService(database).bankPairExpense(
            { externalId: 'bob-out', operatedAt: EXPENSE_AT },
            { accountId, amount: TRANSFER_AMOUNT, toIban }
        );

        yield* refreshAllBalances(database);

        return expense;
    });

const createAliceIncome = (accountId: number) =>
    Effect.gen(function* () {
        const income = yield* new TestSeedService(testDb).bankPairIncome(
            { externalId: 'alice-in', operatedAt: INCOME_AT },
            { accountId, amount: TRANSFER_AMOUNT }
        );

        yield* refreshAllBalances(testDb);

        return income;
    });

const expectCleanLedgers = (bobDatabase: DB) =>
    Effect.gen(function* () {
        expect(yield* countRows(testDb, `sync_pending`)).toBe(0);
        expect(yield* countRows(bobDatabase, `sync_pending`)).toBe(0);
        yield* expectBalancesMatchLedger(testDb);
        yield* expectBalancesMatchLedger(bobDatabase);
    });

const expectSingleTransferOnBoth = (bobDatabase: DB) =>
    Effect.gen(function* () {
        const onAlice = yield* visibleTransactions(testDb);
        const onBob = yield* visibleTransactions(bobDatabase);

        expect(onAlice).toHaveLength(1);
        expect(onBob).toHaveLength(1);
        expect(onAlice[0].type).toBe(TransactionTypeEnum.TRANSFER);
        expect(onBob[0].type).toBe(TransactionTypeEnum.TRANSFER);

        return { onAlice, onBob };
    });

const expectNothingPrivateOnBob = (bobDatabase: DB) =>
    Effect.gen(function* () {
        const stored = yield* queryRows<{ readonly payload: string }>(bobDatabase, `SELECT payload FROM sync_record`);
        const everythingStored = stored.map(({ payload }) => payload).join('\n');

        for (const privateString of PRIVATE_STRINGS) {
            expect(everythingStored).not.toContain(privateString);
        }
    });

const settleAll = (bobDatabase: DB, clouds: MemberCloudsInterface) =>
    Effect.gen(function* () {
        const settled = yield* settleMembers(bobDatabase, clouds);

        expect(settled.rounds).toBeLessThanOrEqual(5);
        expect(settled.rejected).toEqual([]);
    });

describe('cloud-sync/member-transfer', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('merges my private expense with the member income into one transfer when the expense exists first', () =>
            Effect.gen(function* () {
                const bobDatabase = yield* Db;
                const { clouds, aliceAccount, bobAccount } = yield* setupMemberHousehold(bobDatabase, {
                    isBobAccountManual: false,
                    isAliceAccountShared: false
                });

                yield* createAliceExpense(aliceAccount.id, { amount: TRANSFER_AMOUNT, toIban: BOB_IBAN });
                yield* settleAll(bobDatabase, clouds);
                expect(yield* visibleTransactions(testDb)).toHaveLength(1);

                yield* createBobIncome(bobDatabase, bobAccount.id);
                yield* settleAll(bobDatabase, clouds);

                const { onAlice, onBob } = yield* expectSingleTransferOnBoth(bobDatabase);

                expect(onAlice[0].consolidationType).toBe(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
                expect(onBob[0].entryCount).toBe(2);
                expect(yield* balanceOf(bobDatabase, 'Bob card')).toBe(TRANSFER_AMOUNT);
                expect(yield* balanceOf(testDb, 'Bob card')).toBe(TRANSFER_AMOUNT);
                expect(yield* balanceOf(testDb, PRIVATE_ACCOUNT_TITLE)).toBe(-TRANSFER_AMOUNT);
                expect(
                    yield* countRows(
                        bobDatabase,
                        `sync_record WHERE record_type = 'TransactionLeg' AND json_extract(payload, '$.encryptedFields.privateOwnerName') = 'Alice'`
                    )
                ).toBe(1);
                yield* expectNothingPrivateOnBob(bobDatabase);
                yield* expectCleanLedgers(bobDatabase);
            })
        );

        it.effect('merges the same pair when the member income reaches my device before I create the expense', () =>
            Effect.gen(function* () {
                const bobDatabase = yield* Db;
                const { clouds, aliceAccount, bobAccount } = yield* setupMemberHousehold(bobDatabase, {
                    isBobAccountManual: false,
                    isAliceAccountShared: false
                });

                yield* createBobIncome(bobDatabase, bobAccount.id);
                yield* settleAll(bobDatabase, clouds);

                const expense = yield* createAliceExpense(aliceAccount.id, { amount: TRANSFER_AMOUNT, toIban: BOB_IBAN });

                yield* reapplyAutomation(testDb, [expense.syncId ?? '']);
                yield* settleAll(bobDatabase, clouds);

                const { onAlice } = yield* expectSingleTransferOnBoth(bobDatabase);

                expect(onAlice[0].consolidationType).toBe(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
                expect(yield* balanceOf(bobDatabase, 'Bob card')).toBe(TRANSFER_AMOUNT);
                yield* expectNothingPrivateOnBob(bobDatabase);
                yield* expectCleanLedgers(bobDatabase);
            })
        );

        it.effect('converges both devices on the same transfer when both accounts are shared', () =>
            Effect.gen(function* () {
                const bobDatabase = yield* Db;
                const { clouds, aliceAccount, bobAccount } = yield* setupMemberHousehold(bobDatabase, {
                    isBobAccountManual: false,
                    isAliceAccountShared: true
                });
                const expense = yield* createAliceExpense(aliceAccount.id, { amount: TRANSFER_AMOUNT, toIban: BOB_IBAN });
                const income = yield* createBobIncome(bobDatabase, bobAccount.id);

                yield* settleAll(bobDatabase, clouds);

                const { onAlice, onBob } = yield* expectSingleTransferOnBoth(bobDatabase);

                expect(onAlice[0].syncId).toBe(onBob[0].syncId);
                expect(onAlice[0].syncId).toBe(deriveConsolidationSyncId([expense.syncId ?? '', income.syncId ?? '']));
                expect(onAlice[0].entryCount).toBe(onBob[0].entryCount);
                yield* expectCleanLedgers(bobDatabase);
            })
        );

        it.effect('merges the member expense with my private income into one transfer', () =>
            Effect.gen(function* () {
                const bobDatabase = yield* Db;
                const { clouds, aliceAccount, bobAccount } = yield* setupMemberHousehold(bobDatabase, {
                    isBobAccountManual: false,
                    isAliceAccountShared: false
                });

                yield* createBobExpense(bobDatabase, bobAccount.id, ALICE_IBAN);
                yield* createAliceIncome(aliceAccount.id);
                yield* settleAll(bobDatabase, clouds);

                const { onAlice } = yield* expectSingleTransferOnBoth(bobDatabase);

                expect(onAlice[0].consolidationType).toBe(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
                expect(yield* balanceOf(bobDatabase, 'Bob card')).toBe(-TRANSFER_AMOUNT);
                expect(yield* balanceOf(testDb, PRIVATE_ACCOUNT_TITLE)).toBe(TRANSFER_AMOUNT);
                yield* expectNothingPrivateOnBob(bobDatabase);
                yield* expectCleanLedgers(bobDatabase);
            })
        );

        it.effect('keeps an expense and an income apart when the amounts differ', () =>
            Effect.gen(function* () {
                const bobDatabase = yield* Db;
                const { clouds, aliceAccount, bobAccount } = yield* setupMemberHousehold(bobDatabase, {
                    isBobAccountManual: false,
                    isAliceAccountShared: false
                });

                yield* createAliceExpense(aliceAccount.id, { amount: TRANSFER_AMOUNT + 1_000_000, toIban: BOB_IBAN });
                yield* createBobIncome(bobDatabase, bobAccount.id);
                yield* settleAll(bobDatabase, clouds);

                expect(yield* visibleTransactions(testDb)).toHaveLength(2);
                expect(yield* visibleTransactions(bobDatabase)).toHaveLength(1);
                expect(yield* countRows(testDb, `transactions WHERE consolidation_type IS NOT NULL`)).toBe(0);
                yield* expectCleanLedgers(bobDatabase);
            })
        );

        it.effect('never pairs across members on a weaker heuristic than the IBAN match', () =>
            Effect.gen(function* () {
                const bobDatabase = yield* Db;
                const { clouds, aliceAccount, bobAccount } = yield* setupMemberHousehold(bobDatabase, {
                    isBobAccountManual: false,
                    isAliceAccountShared: false
                });

                yield* createAliceExpense(aliceAccount.id, {
                    amount: TRANSFER_AMOUNT,
                    toIban: null,
                    mccCategoryId: yield* transferMccIdOf(testDb)
                });
                yield* createBobIncome(bobDatabase, bobAccount.id, yield* transferMccIdOf(bobDatabase));
                yield* settleAll(bobDatabase, clouds);

                expect(yield* visibleTransactions(testDb)).toHaveLength(2);
                expect(yield* countRows(testDb, `transactions WHERE consolidation_type IS NOT NULL`)).toBe(0);
                yield* expectCleanLedgers(bobDatabase);
            })
        );

        it.effect('converts my expense to a transfer at once when the member account has no bank integration', () =>
            Effect.gen(function* () {
                const bobDatabase = yield* Db;
                const { clouds, aliceAccount } = yield* setupMemberHousehold(bobDatabase, {
                    isBobAccountManual: true,
                    isAliceAccountShared: false
                });
                const expense = yield* createAliceExpense(aliceAccount.id, { amount: TRANSFER_AMOUNT, toIban: BOB_IBAN });

                yield* reapplyAutomation(testDb, [expense.syncId ?? '']);
                yield* settleAll(bobDatabase, clouds);

                const { onBob } = yield* expectSingleTransferOnBoth(bobDatabase);

                expect(onBob[0].entryCount).toBe(1);
                expect(yield* balanceOf(bobDatabase, 'Bob cash')).toBe(TRANSFER_AMOUNT);
                expect(yield* balanceOf(testDb, PRIVATE_ACCOUNT_TITLE)).toBe(-TRANSFER_AMOUNT);
                yield* expectNothingPrivateOnBob(bobDatabase);
                yield* expectCleanLedgers(bobDatabase);
            })
        );

        it.effect('keeps the merged transfer after the member bank data is reprocessed', () =>
            Effect.gen(function* () {
                const bobDatabase = yield* Db;
                const { clouds, aliceAccount, bobAccount } = yield* setupMemberHousehold(bobDatabase, {
                    isBobAccountManual: false,
                    isAliceAccountShared: false
                });

                yield* createAliceExpense(aliceAccount.id, { amount: TRANSFER_AMOUNT, toIban: BOB_IBAN });
                yield* createBobIncome(bobDatabase, bobAccount.id);
                yield* settleAll(bobDatabase, clouds);
                yield* reapplyAutomation(bobDatabase, yield* syncIdsOf(bobDatabase, 'transactions'));
                yield* settleAll(bobDatabase, clouds);

                yield* expectSingleTransferOnBoth(bobDatabase);
                expect(
                    yield* queryRows(
                        bobDatabase,
                        `SELECT external_id AS externalId FROM transaction_entries WHERE original_transaction_id IS NOT NULL`
                    )
                ).toEqual([{ externalId: 'bob-in' }]);
                yield* expectCleanLedgers(bobDatabase);
            })
        );

        it.effect('restores both sides on both devices when the transfer is unconsolidated', () =>
            Effect.gen(function* () {
                const bobDatabase = yield* Db;
                const { clouds, aliceAccount, bobAccount } = yield* setupMemberHousehold(bobDatabase, {
                    isBobAccountManual: false,
                    isAliceAccountShared: false
                });

                yield* createAliceExpense(aliceAccount.id, { amount: TRANSFER_AMOUNT, toIban: BOB_IBAN });
                yield* createBobIncome(bobDatabase, bobAccount.id);
                yield* settleAll(bobDatabase, clouds);

                const { onAlice } = yield* expectSingleTransferOnBoth(bobDatabase);
                const [transfer] = yield* queryRows<{ readonly id: number }>(testDb, `SELECT id FROM transactions WHERE sync_id = ?`, [
                    onAlice[0].syncId
                ]);

                yield* unconsolidateOn(testDb, transfer.id);
                yield* refreshAllBalances(testDb);

                const settled = yield* settleMembers(bobDatabase, clouds, false);

                expect(settled.rejected).toEqual([]);
                expect((yield* visibleTransactions(testDb)).map(({ type }) => type)).toEqual([
                    TransactionTypeEnum.EXPENSE,
                    TransactionTypeEnum.INCOME
                ]);
                expect((yield* visibleTransactions(bobDatabase)).map(({ type }) => type)).toEqual([TransactionTypeEnum.INCOME]);
                expect((yield* visibleTransactions(bobDatabase))[0].entryCount).toBe(1);
                expect(yield* balanceOf(bobDatabase, 'Bob card')).toBe(TRANSFER_AMOUNT);
                yield* expectCleanLedgers(bobDatabase);
            })
        );
    });
});
