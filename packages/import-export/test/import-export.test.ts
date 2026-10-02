import { assertStoredBalancesMatchLedger } from '@budgie-at/test-kit';
import { AccountRepository, CategoryRepository, Db, TransactionRepository, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { ExporterService } from '../src/export/service/exporter.service';
import { IMPORT_PRESETS } from '../src/import/constant/import-presets.constant';
import { ImportPresetEnum } from '../src/import/enum/import-preset.enum';
import { ImportRowError } from '../src/import/error/import-row.error';
import { ImporterService } from '../src/import/service/importer.service';

import { TestLayer } from './import-export-test-layer';

const budgieCsv = [
    'externalId,toAccount,toAmount,toCurrency,fromAccount,fromAmount,fromCurrency,category,operatedAt,comment,mcc',
    'e-1,Cash,-12.5,USD,,,,Groceries,01/15/2026 12:30:00,Milk,',
    'e-2,Cash,1000,USD,,,,Salary,01/16/2026 09:00:00,January,',
    'e-3,Savings,92,EUR,Cash,100,USD,,01/17/2026 18:45:10,Move,'
].join('\n');

const snapshotTransactions = Effect.gen(function* () {
    const transactionRepository = yield* TransactionRepository;
    const accountRepository = yield* AccountRepository;
    const categoryRepository = yield* CategoryRepository;
    const accounts = yield* accountRepository.getAll();
    const categories = yield* categoryRepository.findAllNonSystem();
    const transactions = yield* transactionRepository.getAllAfter(null, 100);
    const instrumentIdByAccountId = new Map(accounts.map(account => [account.id, account.instrumentId]));
    const categoryTitleById = new Map(categories.map(category => [category.id, category.title]));

    return [...transactions]
        .sort((left, right) => left.operatedAt.getTime() - right.operatedAt.getTime())
        .map(transaction => ({
            type: transaction.type,
            operatedAt: transaction.operatedAt.getTime(),
            comment: transaction.comment,
            externalId: transaction.externalId,
            entries: [...transaction.entries]
                .sort((left, right) => left.type.localeCompare(right.type))
                .map(entry => ({
                    type: entry.type,
                    amount: entry.amount,
                    instrumentId: instrumentIdByAccountId.get(entry.accountId),
                    category: categoryTitleById.get(entry.categoryId ?? 0) ?? null
                }))
        }));
});

describe('import-export', () => {
    it.live('exporting then importing yields the same transactions', () =>
        Effect.gen(function* () {
            const importerService = yield* ImporterService;
            const exporterService = yield* ExporterService;

            const firstImport = yield* importerService.replaceAll(IMPORT_PRESETS[ImportPresetEnum.Budgie], budgieCsv);
            const imported = yield* snapshotTransactions;
            const exportedCsv = yield* exporterService.exportToCsv();
            const secondImport = yield* importerService.replaceAll(IMPORT_PRESETS[ImportPresetEnum.Budgie], exportedCsv);

            expect(firstImport.rowErrors).toEqual([]);
            expect(secondImport.rowErrors).toEqual([]);
            expect(new Set(imported.map(transaction => transaction.type))).toEqual(
                new Set([TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME, TransactionTypeEnum.TRANSFER])
            );
            expect(yield* snapshotTransactions).toEqual(imported);
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a malformed row is reported as a typed failure and the rest is imported', () =>
        Effect.gen(function* () {
            const importerService = yield* ImporterService;
            const csv = [
                budgieCsv.split('\n')[0],
                'e-1,Cash,-5,USD,,,,Food,01/15/2026 12:30:00,,',
                'e-2,Cash,abc,USD,,,,Food,01/15/2026 12:30:00,,'
            ].join('\n');

            const { transactions, rowErrors } = yield* importerService.replaceAll(IMPORT_PRESETS[ImportPresetEnum.Budgie], csv);

            expect(transactions).toHaveLength(1);
            expect(rowErrors).toHaveLength(1);
            expect(rowErrors[0]).toBeInstanceOf(ImportRowError);
            expect(rowErrors[0]._tag).toBe('ImportRowError');
            expect(rowErrors[0].message).toBe('To Amount "abc" is invalid');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('the SmartBudget preset maps its columns', () =>
        Effect.gen(function* () {
            const importerService = yield* ImporterService;
            const csv = [
                'Порядковый номер,Счёт,Сумма,Валюта,Счёт_1,Сумма 2,Валюта 2,Категория,Дата,Описание,Запланировано',
                '7,Карта,-42,USD,,,,Кафе,2026-02-03,Обед,0'
            ].join('\n');

            const { transactions, rowErrors } = yield* importerService.replaceAll(IMPORT_PRESETS[ImportPresetEnum.SmartBudget], csv);
            const [snapshot] = yield* snapshotTransactions;

            expect(rowErrors).toEqual([]);
            expect(transactions).toHaveLength(1);
            expect(snapshot).toMatchObject({
                type: TransactionTypeEnum.EXPENSE,
                externalId: '7',
                comment: 'Обед',
                operatedAt: new Date(2026, 1, 3).getTime(),
                entries: [{ category: 'кафе' }]
            });
        }).pipe(Effect.provide(TestLayer))
    );
});
