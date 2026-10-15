import {
    AccountBalanceRepository,
    AccountTypeEnum,
    BANK_FEE_CATEGORY_ID,
    PRECISION,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { TransactionService, TransferCreationService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { seed, TestLayer } from '../../harness';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

interface LiveTransaction {
    readonly id: number;
    readonly type: TransactionTypeEnum;
    readonly from: number;
    readonly to: number;
    readonly amount: number;
    readonly fee: number;
}

const OPERATED_AT = new Date('2026-06-02T12:00:00.000Z');

const operation = Schema.Struct({
    kind: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 4 })),
    account: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 2 })),
    other: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 2 })),
    amount: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 1000 })),
    fee: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 5 })),
    target: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 11 }))
});

const entry = (accountId: number, type: TransactionEntryTypeEnum, amount: number) => ({
    accountId,
    type,
    kind: TransactionEntryKindEnum.PRIMARY,
    amount,
    categoryId: type === TransactionEntryTypeEnum.FEE ? BANK_FEE_CATEGORY_ID : null,
    mccCategoryId: null
});

const buildInput = ({ type, from, to, amount, fee }: LiveTransaction): TransactionCreateInputInterface => ({
    type,
    title: 'Property',
    amount,
    operatedAt: OPERATED_AT,
    comment: '',
    fromAccountId: type === TransactionTypeEnum.INCOME ? null : from,
    toAccountId: type === TransactionTypeEnum.EXPENSE ? null : to,
    exchangeRate: 1,
    externalId: null,
    externalSource: null,
    updatedBy: null,
    tagIds: [],
    entries: [
        ...(type === TransactionTypeEnum.INCOME ? [] : [entry(from, TransactionEntryTypeEnum.CREDIT, amount)]),
        ...(type === TransactionTypeEnum.EXPENSE ? [] : [entry(to, TransactionEntryTypeEnum.DEBIT, amount)]),
        ...(fee > 0 && type !== TransactionTypeEnum.INCOME ? [entry(from, TransactionEntryTypeEnum.FEE, fee)] : [])
    ]
});

const expectedBalance = (live: readonly LiveTransaction[], accountId: number) =>
    live.reduce((sum, { type, from, to, amount, fee }) => {
        const spent = type === TransactionTypeEnum.INCOME || from !== accountId ? 0 : amount + fee;
        const received = type === TransactionTypeEnum.EXPENSE || to !== accountId ? 0 : amount;

        return sum + (received - spent) * PRECISION;
    }, 0);

const PROPERTY_TIMEOUT = 120_000;

describe('ledger/balance-properties', () => {
    it.effect.prop(
        'stored balances equal the ledger and the summed entries after any create, edit and delete sequence',
        { operations: Schema.Array(operation).check(Schema.isMaxLength(10)) },
        ({ operations }) =>
            Effect.gen(function* () {
                const transactionService = yield* TransactionService;
                const transferCreationService = yield* TransferCreationService;
                const accountBalanceRepository = yield* AccountBalanceRepository;
                const accounts = [
                    yield* seed.account({ title: 'A', type: AccountTypeEnum.CASH }),
                    yield* seed.account({ title: 'B', type: AccountTypeEnum.CASH }),
                    yield* seed.account({ title: 'C', type: AccountTypeEnum.CASH })
                ];
                const accountIds = accounts.map(({ id }) => id);
                let live: readonly LiveTransaction[] = [];

                for (const { kind, account, other, amount, fee, target } of operations) {
                    const from = accountIds[account] ?? 0;
                    const to = accountIds[(account + other) % accountIds.length] ?? 0;
                    const picked = live.length > 0 ? live[target % live.length] : undefined;

                    if (kind <= 2) {
                        const type =
                            [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME, TransactionTypeEnum.TRANSFER][kind] ??
                            TransactionTypeEnum.EXPENSE;
                        const draft = { id: 0, type, from, to, amount, fee };
                        const input = buildInput(draft);
                        const created =
                            type === TransactionTypeEnum.TRANSFER
                                ? yield* transferCreationService.createInternalTransfer(input)
                                : yield* transactionService.createInternal(input);

                        live = live.concat({ ...draft, id: created.id });
                    } else if (picked !== undefined && kind === 3) {
                        const edited = { ...picked, amount, fee };

                        yield* transactionService.updateById(picked.id, buildInput(edited));
                        live = live.map(item => (item.id === picked.id ? edited : item));
                    } else if (picked !== undefined) {
                        yield* transactionService.deleteById(picked.id);
                        live = live.filter(item => item.id !== picked.id);
                    }
                }

                const ledger = yield* accountBalanceRepository.getLedgerBalances(accountIds);
                const stored = yield* accountBalanceRepository.getByAccountIds(accountIds);

                for (const accountId of accountIds) {
                    const expected = expectedBalance(live, accountId);

                    expect(ledger.get(accountId) ?? 0).toBe(expected);
                    expect(stored.find(balance => balance.accountId === accountId)?.amount ?? 0).toBe(expected);
                }
            }).pipe(Effect.provide(TestLayer)),
        PROPERTY_TIMEOUT
    );
});
