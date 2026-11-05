import { AccountRepository, TransactionRepository } from '@budgie/contracts';
import { describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { IMPORT_PRESETS } from '../src/import/constant/import-presets.constant';
import { ImportPresetEnum } from '../src/import/enum/import-preset.enum';
import { ImportRowError } from '../src/import/error/import-row.error';
import { ImporterService } from '../src/import/service/importer.service';

import { TestLayer } from './import-export-test-layer';

const header = 'externalId,toAccount,toAmount,toCurrency,fromAccount,fromAmount,fromCurrency,category,operatedAt,comment,mcc';
const existingCsv = [
    header,
    'e-1,Cash,-12.5,USD,,,,Groceries,01/15/2026 12:30:00,Milk,',
    'e-2,Wallet,30,EUR,,,,Salary,01/16/2026 09:00:00,,'
].join('\n');

const snapshotData = Effect.gen(function* () {
    const accountRepository = yield* AccountRepository;
    const transactionRepository = yield* TransactionRepository;
    const accounts = yield* accountRepository.getAll;
    const transactions = yield* transactionRepository.getAllAfter(null, 100);

    return {
        accounts: accounts.map(account => [account.id, account.title]),
        transactions: transactions.map(transaction => [transaction.id, transaction.externalId, transaction.entries.length])
    };
});

const expectReplaceFailsKeepingData = (csv: string, reason: string) =>
    Effect.gen(function* () {
        const importerService = yield* ImporterService;
        yield* importerService.replaceAll(IMPORT_PRESETS[ImportPresetEnum.Budgie], existingCsv);
        const before = yield* snapshotData;

        const error = yield* Effect.flip(importerService.replaceAll(IMPORT_PRESETS[ImportPresetEnum.Budgie], csv));

        expect(error).toBeInstanceOf(ImportRowError);
        expect(error.message).toBe(reason);
        expect(before.transactions).toHaveLength(2);
        expect(yield* snapshotData).toStrictEqual(before);
    }).pipe(Effect.provide(TestLayer));

describe('importer replaceAll', () => {
    it.effect('rejects an unknown currency before touching existing data', () =>
        expectReplaceFailsKeepingData(
            [header, 'n-1,Cash,-5,USD,,,,Food,01/15/2026 12:30:00,,', 'n-2,Vault,7,XXX,,,,Food,01/15/2026 12:30:00,,'].join('\n'),
            'Currency XXX not found'
        )
    );

    it.effect('keeps existing data when a write after the replace fails', () =>
        Effect.gen(function* () {
            const importerService = yield* ImporterService;
            const transactionRepository = yield* TransactionRepository;
            yield* importerService.replaceAll(IMPORT_PRESETS[ImportPresetEnum.Budgie], existingCsv);
            const before = yield* snapshotData;
            const bulkCreateSpy = vi
                .spyOn(transactionRepository, 'bulkCreate')
                .mockReturnValue(Effect.die(new Error('transaction write failed')));
            yield* Effect.addFinalizer(() => Effect.sync(() => void bulkCreateSpy.mockRestore()));

            const exit = yield* Effect.exit(
                importerService.replaceAll(
                    IMPORT_PRESETS[ImportPresetEnum.Budgie],
                    [header, 'n-1,Vault,-5,USD,,,,Food,01/15/2026 12:30:00,,'].join('\n')
                )
            );

            expect(bulkCreateSpy).toHaveBeenCalled();
            expect(exit._tag).toBe('Failure');
            expect(yield* snapshotData).toStrictEqual(before);
        }).pipe(Effect.scoped, Effect.provide(TestLayer))
    );

    it.effect('imports a row with a stray quote inside a quoted field', () =>
        Effect.gen(function* () {
            const importerService = yield* ImporterService;

            const result = yield* importerService.replaceAll(
                IMPORT_PRESETS[ImportPresetEnum.Budgie],
                [header, 'n-1,"Ca"sh",-5,USD,,,,Food,01/15/2026 12:30:00,,'].join('\n')
            );

            expect(result.transactionIds).toHaveLength(1);
            expect((yield* snapshotData).accounts.map(([, title]) => title)).toStrictEqual(['ca"sh USD']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects a CSV with an unterminated quote before touching existing data', () =>
        expectReplaceFailsKeepingData(
            [header, 'n-1,"Cash,-5,USD,,,,Food,01/15/2026 12:30:00,,', 'n-2,Cash,-6,USD,,,,Food,01/15/2026 12:30:00,,'].join('\n'),
            'Quoted field unterminated'
        )
    );
});

describe('importer strict amounts', () => {
    it.effect('uses whole-column context for destination and source amounts independently', () =>
        Effect.gen(function* () {
            const importerService = yield* ImporterService;
            const result = yield* importerService.replaceAll(
                IMPORT_PRESETS[ImportPresetEnum.Budgie],
                [
                    header,
                    'n-1,Cash,"1.234",USD,Wallet,"1,234",EUR,Food,01/15/2026 12:30:00,,',
                    'n-2,Cash,"12,50",USD,Wallet,12.50,EUR,Food,01/15/2026 12:30:00,,',
                    'n-3,Cash,"1 234,56",USD,,,,Food,01/15/2026 12:30:00,,',
                    'n-4,Cash,5oops,USD,,,,Food,01/15/2026 12:30:00,,',
                    'n-5,Cash,5,USD,Wallet,5oops,EUR,Food,01/15/2026 12:30:00,,'
                ].join('\n')
            );
            expect(result.rowErrors).toHaveLength(2);
            expect(result.rowErrors.every(error => Schema.is(ImportRowError)(error))).toBe(true);
            expect(result.transactions.map(transaction => transaction.amount)).toEqual([1234, 12.5, 1234.56]);
            expect(result.transactions[0].entries.map(entry => entry.amount)).toEqual([1234, 1234]);
            const transactionRepository = yield* TransactionRepository;
            const stored = yield* transactionRepository.getAllAfter(null, 100);
            expect(
                stored.flatMap(transaction => transaction.entries.map(entry => entry.amount)).sort((left, right) => left - right)
            ).toEqual([12500000, 12500000, 1234000000, 1234000000, 1234560000]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reports ambiguous amounts without importing them', () =>
        Effect.gen(function* () {
            const importerService = yield* ImporterService;
            const result = yield* importerService.replaceAll(
                IMPORT_PRESETS[ImportPresetEnum.Budgie],
                [header, 'n-1,Cash,"1.234",USD,,,,Food,01/15/2026 12:30:00,,', 'n-2,Cash,"1,234",USD,,,,Food,01/15/2026 12:30:00,,'].join(
                    '\n'
                )
            );
            expect(result.rowErrors).toHaveLength(2);
            expect(result.transactionIds).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});
