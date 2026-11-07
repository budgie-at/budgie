import { TestSeedService, assertStoredBalancesMatchLedger, makeTestDbLayer } from '@budgie-at/test-kit';
import { TransactionConsolidationTypeEnum, TransactionTypeEnum, deriveConsolidationSyncId } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    testDb,
    refreshAllBalances,
    reapplyAutomation,
    syncIdsOf,
    ALICE_IBAN,
    BOB_IBAN,
    EXPENSE_AT,
    INCOME_AT,
    MANUAL_BOB_ACCOUNT,
    PRIVATE_ACCOUNT_TITLE,
    PRIVATE_BOTH_CARDS,
    PRIVATE_COMMENT,
    PRIVATE_TITLE,
    SHARED_BOTH_CARDS,
    TRANSFER_AMOUNT,
    balanceOf,
    settleMembers,
    unconsolidateOn,
    visibleTransactions,
    withMemberHousehold,
    countRows,
    queryRows
} from '../../harness';

import type { MemberCloudsInterface } from '../../harness';
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

const createAliceIncome = (accountId: number, toIban: string | null = null) =>
    Effect.gen(function* () {
        const income = yield* new TestSeedService(testDb).bankPairIncome(
            { externalId: 'alice-in', operatedAt: INCOME_AT },
            { accountId, amount: TRANSFER_AMOUNT, toIban }
        );

        yield* refreshAllBalances(testDb);

        return income;
    });

const expectCleanLedgers = (bobDatabase: DB) =>
    Effect.gen(function* () {
        expect(yield* countRows(testDb, `sync_pending`)).toBe(0);
        expect(yield* countRows(bobDatabase, `sync_pending`)).toBe(0);
        yield* assertStoredBalancesMatchLedger(testDb);
        yield* assertStoredBalancesMatchLedger(bobDatabase);
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

const expectNothingPrivateOnBob = (bobDatabase: DB, privateStrings: readonly string[] = PRIVATE_STRINGS) =>
    Effect.gen(function* () {
        const stored = yield* queryRows<{ readonly payload: string }>(bobDatabase, `SELECT payload FROM sync_record`);
        const everythingStored = stored.map(({ payload }) => payload).join('\n');

        for (const privateString of privateStrings) {
            expect(everythingStored).not.toContain(privateString);
        }
    });

const settleAll = (bobDatabase: DB, clouds: MemberCloudsInterface) =>
    Effect.gen(function* () {
        const settled = yield* settleMembers(bobDatabase, clouds);

        expect(settled.rounds).toBeLessThanOrEqual(5);
        expect(settled.rejected).toEqual([]);
    });

const createAliceExpenseToBob = (accountId: number, amount = TRANSFER_AMOUNT) =>
    createAliceExpense(accountId, { amount, toIban: BOB_IBAN });

const createTransferMccPair = (
    bobDatabase: DB,
    clouds: MemberCloudsInterface,
    aliceAccount: { readonly id: number },
    bobAccount: { readonly id: number }
) =>
    Effect.gen(function* () {
        yield* createAliceExpense(aliceAccount.id, {
            amount: TRANSFER_AMOUNT,
            toIban: null,
            mccCategoryId: yield* transferMccIdOf(testDb)
        });
        yield* createBobIncome(bobDatabase, bobAccount.id, yield* transferMccIdOf(bobDatabase));
        yield* settleAll(bobDatabase, clouds);
    });

const settleAliceExpenseAndBobIncome = (
    bobDatabase: DB,
    clouds: MemberCloudsInterface,
    aliceAccount: { readonly id: number },
    bobAccount: { readonly id: number }
) =>
    Effect.gen(function* () {
        yield* createAliceExpenseToBob(aliceAccount.id);
        yield* createBobIncome(bobDatabase, bobAccount.id);
        yield* settleAll(bobDatabase, clouds);
    });

const reapplyOnAliceAndSettle = (bobDatabase: DB, clouds: MemberCloudsInterface, syncId: string | null) =>
    Effect.gen(function* () {
        yield* reapplyAutomation(testDb, [syncId ?? '']);
        yield* settleAll(bobDatabase, clouds);
    });

const expectSingleMemberTransfer = (bobDatabase: DB) =>
    Effect.gen(function* () {
        const transfer = yield* expectSingleTransferOnBoth(bobDatabase);

        expect(transfer.onAlice[0].consolidationType).toBe(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

        return transfer;
    });

const transferTest =
    <A, E, R>(options: Parameters<typeof withMemberHousehold>[0], body: Parameters<typeof withMemberHousehold<A, E, R>>[1]) =>
    () =>
        withMemberHousehold(options, body);

describe('cloud-sync/member-transfer', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect(
            'merges my private expense with the member income into one transfer when the expense exists first',
            transferTest(PRIVATE_BOTH_CARDS, ({ bobDatabase, clouds, aliceAccount, bobAccount }) =>
                Effect.gen(function* () {
                    yield* createAliceExpenseToBob(aliceAccount.id);
                    yield* settleAll(bobDatabase, clouds);
                    expect(yield* visibleTransactions(testDb)).toHaveLength(1);

                    yield* createBobIncome(bobDatabase, bobAccount.id);
                    yield* settleAll(bobDatabase, clouds);

                    const { onBob } = yield* expectSingleMemberTransfer(bobDatabase);

                    expect(onBob[0].entryCount).toBe(2);
                    expect(yield* balanceOf(bobDatabase, 'Bob card')).toBe(TRANSFER_AMOUNT);
                    expect(yield* balanceOf(testDb, 'Bob card')).toBe(TRANSFER_AMOUNT);
                    expect(yield* balanceOf(testDb, PRIVATE_ACCOUNT_TITLE)).toBe(-TRANSFER_AMOUNT);
                    expect(
                        yield* countRows(
                            bobDatabase,
                            `sync_record WHERE record_type = 'TransactionLeg' AND json_extract(payload, '$.encryptedFields.privateOwnerName') IS NULL`
                        )
                    ).toBe(1);
                    yield* expectNothingPrivateOnBob(bobDatabase);
                    yield* expectCleanLedgers(bobDatabase);
                })
            )
        );

        it.effect(
            'merges the same pair when the member income reaches my device before I create the expense',
            transferTest(PRIVATE_BOTH_CARDS, ({ bobDatabase, clouds, aliceAccount, bobAccount }) =>
                Effect.gen(function* () {
                    yield* createBobIncome(bobDatabase, bobAccount.id);
                    yield* settleAll(bobDatabase, clouds);

                    const expense = yield* createAliceExpenseToBob(aliceAccount.id);

                    yield* reapplyOnAliceAndSettle(bobDatabase, clouds, expense.syncId);
                    yield* expectSingleMemberTransfer(bobDatabase);

                    expect(yield* balanceOf(bobDatabase, 'Bob card')).toBe(TRANSFER_AMOUNT);
                    yield* expectNothingPrivateOnBob(bobDatabase);
                    yield* expectCleanLedgers(bobDatabase);
                })
            )
        );

        it.effect(
            'converges both devices on the same transfer when both accounts are shared',
            transferTest(SHARED_BOTH_CARDS, ({ bobDatabase, clouds, aliceAccount, bobAccount }) =>
                Effect.gen(function* () {
                    const expense = yield* createAliceExpenseToBob(aliceAccount.id);
                    const income = yield* createBobIncome(bobDatabase, bobAccount.id);

                    yield* settleAll(bobDatabase, clouds);

                    const { onAlice, onBob } = yield* expectSingleTransferOnBoth(bobDatabase);

                    expect(onAlice[0].syncId).toBe(onBob[0].syncId);
                    expect(onAlice[0].syncId).toBe(deriveConsolidationSyncId([expense.syncId ?? '', income.syncId ?? '']));
                    expect(onAlice[0].entryCount).toBe(onBob[0].entryCount);
                    yield* expectCleanLedgers(bobDatabase);
                })
            )
        );

        it.effect(
            'merges the member expense with my private income into one transfer',
            transferTest(PRIVATE_BOTH_CARDS, ({ bobDatabase, clouds, aliceAccount, bobAccount }) =>
                Effect.gen(function* () {
                    yield* createBobExpense(bobDatabase, bobAccount.id, ALICE_IBAN);
                    yield* createAliceIncome(aliceAccount.id);
                    yield* settleAll(bobDatabase, clouds);
                    yield* expectSingleMemberTransfer(bobDatabase);

                    expect(yield* balanceOf(bobDatabase, 'Bob card')).toBe(-TRANSFER_AMOUNT);
                    expect(yield* balanceOf(testDb, PRIVATE_ACCOUNT_TITLE)).toBe(TRANSFER_AMOUNT);
                    yield* expectNothingPrivateOnBob(
                        bobDatabase,
                        PRIVATE_STRINGS.filter(privateString => privateString !== ALICE_IBAN)
                    );
                    yield* expectCleanLedgers(bobDatabase);
                })
            )
        );

        it.effect(
            'keeps an expense and an income apart when the amounts differ',
            transferTest(PRIVATE_BOTH_CARDS, ({ bobDatabase, clouds, aliceAccount, bobAccount }) =>
                Effect.gen(function* () {
                    yield* createAliceExpenseToBob(aliceAccount.id, TRANSFER_AMOUNT + 1_000_000);
                    yield* createBobIncome(bobDatabase, bobAccount.id);
                    yield* settleAll(bobDatabase, clouds);

                    expect(yield* visibleTransactions(testDb)).toHaveLength(2);
                    expect(yield* visibleTransactions(bobDatabase)).toHaveLength(1);
                    expect(yield* countRows(testDb, `transactions WHERE consolidation_type IS NOT NULL`)).toBe(0);
                    yield* expectCleanLedgers(bobDatabase);
                })
            )
        );

        it.effect(
            'never pairs across members on a weaker heuristic than the IBAN match',
            transferTest(PRIVATE_BOTH_CARDS, ({ bobDatabase, clouds, aliceAccount, bobAccount }) =>
                Effect.gen(function* () {
                    yield* createTransferMccPair(bobDatabase, clouds, aliceAccount, bobAccount);

                    expect(yield* visibleTransactions(testDb)).toHaveLength(2);
                    expect(yield* countRows(testDb, `transactions WHERE consolidation_type IS NOT NULL`)).toBe(0);
                    yield* expectCleanLedgers(bobDatabase);
                })
            )
        );

        it.effect(
            'converts my expense to a transfer at once when the member account has no bank integration',
            transferTest(MANUAL_BOB_ACCOUNT, ({ bobDatabase, clouds, aliceAccount }) =>
                Effect.gen(function* () {
                    const expense = yield* createAliceExpenseToBob(aliceAccount.id);

                    yield* reapplyOnAliceAndSettle(bobDatabase, clouds, expense.syncId);

                    const { onBob } = yield* expectSingleTransferOnBoth(bobDatabase);

                    expect(onBob[0].entryCount).toBe(1);
                    expect(yield* balanceOf(bobDatabase, 'Bob cash')).toBe(TRANSFER_AMOUNT);
                    expect(yield* balanceOf(testDb, PRIVATE_ACCOUNT_TITLE)).toBe(-TRANSFER_AMOUNT);
                    yield* expectNothingPrivateOnBob(bobDatabase);
                    yield* expectCleanLedgers(bobDatabase);
                })
            )
        );

        it.effect(
            'still pairs on a weaker heuristic when both accounts sit in the same zone',
            transferTest(SHARED_BOTH_CARDS, ({ bobDatabase, clouds, aliceAccount, bobAccount }) =>
                Effect.gen(function* () {
                    yield* createTransferMccPair(bobDatabase, clouds, aliceAccount, bobAccount);

                    const { onAlice, onBob } = yield* expectSingleTransferOnBoth(bobDatabase);

                    expect(onAlice[0].syncId).toBe(onBob[0].syncId);
                    yield* expectCleanLedgers(bobDatabase);
                })
            )
        );

        it.effect(
            'converts my income to a transfer from the member account that has no bank integration',
            transferTest(MANUAL_BOB_ACCOUNT, ({ bobDatabase, clouds, aliceAccount }) =>
                Effect.gen(function* () {
                    const income = yield* createAliceIncome(aliceAccount.id, BOB_IBAN);

                    yield* reapplyOnAliceAndSettle(bobDatabase, clouds, income.syncId);

                    const { onBob } = yield* expectSingleTransferOnBoth(bobDatabase);

                    expect(onBob[0].entryCount).toBe(1);
                    expect(yield* balanceOf(bobDatabase, 'Bob cash')).toBe(-TRANSFER_AMOUNT);
                    expect(yield* balanceOf(testDb, PRIVATE_ACCOUNT_TITLE)).toBe(TRANSFER_AMOUNT);
                    yield* expectCleanLedgers(bobDatabase);
                })
            )
        );

        it.effect(
            'keeps the merged transfer after the member bank data is reprocessed',
            transferTest(PRIVATE_BOTH_CARDS, ({ bobDatabase, clouds, aliceAccount, bobAccount }) =>
                Effect.gen(function* () {
                    yield* settleAliceExpenseAndBobIncome(bobDatabase, clouds, aliceAccount, bobAccount);
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
            )
        );

        it.effect(
            'restores both sides on both devices when the transfer is unconsolidated',
            transferTest(PRIVATE_BOTH_CARDS, ({ bobDatabase, clouds, aliceAccount, bobAccount }) =>
                Effect.gen(function* () {
                    yield* settleAliceExpenseAndBobIncome(bobDatabase, clouds, aliceAccount, bobAccount);

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
            )
        );
    });
});
