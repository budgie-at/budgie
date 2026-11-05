import {
    CategorySourceEnum,
    ExpenseTransactionCreateInputSchema,
    ExternalSourceEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { createFormControl } from 'react-hook-form';
import { vi } from 'vitest';

import { useUpdateTransactionForm } from '../src/transaction/hook/use-update-transaction-form.hook';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

const save = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock('@lingui/core/macro', () => ({ msg: (message: unknown) => message, t: (parts: TemplateStringsArray) => parts.join('') }));
vi.mock('@lingui/react/macro', () => ({ useLingui: () => ({ t: (parts: TemplateStringsArray) => parts.join('') }) }));
vi.mock('../src/@generic/hook/use-single-flight.hook', () => ({ useSingleFlight: () => ({ run: save }) }));
vi.mock('../src/transaction/hook/use-delete-transaction.hook', () => ({ useDeleteTransaction: vi.fn() }));
vi.mock('../src/@generic/utils/go-back-or-replace.util', () => ({ goBackOrReplace: vi.fn() }));
vi.mock('../src/@generic/utils/dismiss-all-or-replace.util', () => ({ dismissAllOrReplace: vi.fn() }));
vi.mock('../src/@generic/utils/toast-on-failure.util', () => ({ toastOnFailure: () => (effect: unknown) => effect }));
vi.mock('react-hook-form', async importOriginal => {
    const original = await importOriginal<typeof import('react-hook-form')>();

    return { ...original, useForm: original.createFormControl };
});

const transaction: TransactionCreateInputInterface = {
    type: TransactionTypeEnum.EXPENSE,
    title: 'Fixture bank merchant and payment reference '.repeat(4),
    comment: '',
    operatedAt: new Date('2026-09-29T12:00:00Z'),
    externalId: 'fixture-bank-payment',
    externalSource: ExternalSourceEnum.ENABLE_BANKING,
    updatedBy: TransactionUpdatedByEnum.RULE,
    toAccountId: null,
    fromAccountId: 1,
    exchangeRate: 1,
    amount: 10,
    tagIds: [1],
    entries: [
        {
            accountId: 1,
            categoryId: 1,
            categorySource: CategorySourceEnum.RULE,
            mccCategoryId: null,
            type: TransactionEntryTypeEnum.CREDIT,
            amount: 10
        }
    ]
};

describe('update transaction form', () => {
    it.effect('submits an unchanged imported title after a rule has categorized the transaction', () =>
        Effect.gen(function* () {
            save.mockClear();
            const originalForm = createFormControl({
                defaultValues: transaction,
                resolver: standardSchemaResolver(Schema.toStandardSchemaV1(ExpenseTransactionCreateInputSchema))
            });

            yield* Effect.promise(() => originalForm.handleSubmit(save)());
            expect(Object.keys(originalForm.control._formState.errors)).toEqual(['title']);
            expect(save).not.toHaveBeenCalled();

            const { form, handleSubmit } = useUpdateTransactionForm({ id: 1, schema: ExpenseTransactionCreateInputSchema, transaction });

            yield* Effect.promise(() => handleSubmit());

            expect(form.control._formState.errors).toEqual({});
            expect(save).toHaveBeenCalledOnce();
        })
    );

    it.effect.each([
        { title: 'A different overlong title '.repeat(6) },
        { comment: 'A'.repeat(256) },
        { type: TransactionTypeEnum.INCOME },
        { exchangeRate: 0 },
        { entries: [{ ...transaction.entries[0], amount: 0 }] }
    ])('still rejects invalid edits: %s', changes =>
        Effect.gen(function* () {
            save.mockClear();
            const { form, handleSubmit } = useUpdateTransactionForm({ id: 1, schema: ExpenseTransactionCreateInputSchema, transaction });

            form.reset({ ...transaction, ...changes });
            yield* Effect.promise(() => handleSubmit());

            expect(save).not.toHaveBeenCalled();
            expect(Object.keys(form.control._formState.errors)).not.toHaveLength(0);
        })
    );
});
