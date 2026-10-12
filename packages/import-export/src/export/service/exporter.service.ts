import {
    AccountEntityInterface,
    AccountRepository,
    CategoryEntityInterface,
    CategoryRepository,
    InstrumentEntityInterface,
    InstrumentRepository,
    MccCategoryRepository,
    TransactionRepository,
    TransactionTypeEnum,
    TransactionWithEntriesEntityInterface,
    YIELD_TO_UI,
    convertFromMicroUnits
} from '@budgie/contracts';
import { format } from 'date-fns/format';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import Papa from 'papaparse';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ExportRowInterface } from '../interface/export-row.interface';

import type { ExportLookupInterface } from '../interface/export-lookup.interface';

export class ExporterService extends Context.Service<ExporterService>()('@budgie/import-export/ExporterService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const categoryRepository = yield* CategoryRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const mccCategoryRepository = yield* MccCategoryRepository;
        const transactionRepository = yield* TransactionRepository;
        const batchSize = 750;
        const csvColumns = [
            'title',
            'externalId',
            'toAccount',
            'toAmount',
            'toCurrency',
            'fromAccount',
            'fromAmount',
            'fromCurrency',
            'category',
            'operatedAt',
            'comment',
            'mcc'
        ];
        const toMap = <T extends { readonly id: number }>(items: readonly T[]): Map<number, T> =>
            new Map(items.map(item => [item.id, item]));

        const getAccount = (lookup: ExportLookupInterface, accountId: number | null): AccountEntityInterface | null =>
            isDefined(accountId) ? (lookup.accounts.get(accountId) ?? null) : null;

        const mapTransferTransaction = (
            transaction: TransactionWithEntriesEntityInterface,
            lookup: ExportLookupInterface
        ): ExportRowInterface => {
            const entry = transaction.entries.at(0);

            const fromAccount = getAccount(lookup, transaction.fromAccountId);
            const toAccount = getAccount(lookup, transaction.toAccountId);
            const fromInstrument = isDefined(fromAccount?.instrumentId) ? lookup.instruments.get(fromAccount.instrumentId) : null;
            const toInstrument = isDefined(toAccount?.instrumentId) ? lookup.instruments.get(toAccount.instrumentId) : null;
            const category = isDefined(entry?.categoryId) ? lookup.categories.get(entry.categoryId) : null;

            const fromEntry = transaction.entries.find(transactionEntry => transactionEntry.accountId === transaction.fromAccountId);
            const toEntry = transaction.entries.find(transactionEntry => transactionEntry.accountId === transaction.toAccountId);

            return {
                title: transaction.title,
                externalId: transaction.externalId ?? '',
                fromAccount: toAccount?.title ?? '',
                fromAmount: isDefined(toEntry) ? String(convertFromMicroUnits(toEntry.amount)) : '',
                fromCurrency: toInstrument?.code ?? '',
                toAccount: fromAccount?.title ?? '',
                toAmount: isDefined(fromEntry) ? String(convertFromMicroUnits(fromEntry.amount)) : '',
                toCurrency: fromInstrument?.code ?? '',
                category: category?.title ?? '',
                operatedAt: format(transaction.operatedAt, 'MM/dd/yyyy HH:mm:ss'),
                comment: transaction.comment,
                mcc: ''
            };
        };

        // eslint-disable-next-line @typescript-eslint/max-params
        const createExportRow = (
            transaction: TransactionWithEntriesEntityInterface,
            account: AccountEntityInterface | null | undefined,
            instrument: InstrumentEntityInterface | null | undefined,
            category: CategoryEntityInterface | null | undefined,
            amount: number
        ): ExportRowInterface => ({
            title: transaction.title,
            externalId: transaction.externalId ?? '',
            toAccount: account?.title ?? '',
            toAmount: String(convertFromMicroUnits(amount)),
            toCurrency: instrument?.code ?? '',
            fromAccount: '',
            fromAmount: '',
            fromCurrency: '',
            category: category?.title ?? '',
            operatedAt: format(transaction.operatedAt, 'MM/dd/yyyy HH:mm:ss'),
            comment: transaction.comment,
            mcc: ''
        });

        const mapIncomeExpenseTransaction = (
            transaction: TransactionWithEntriesEntityInterface,
            lookup: ExportLookupInterface
        ): ExportRowInterface[] => {
            const toAccount = getAccount(lookup, transaction.toAccountId);
            const toInstrument = isDefined(toAccount?.instrumentId) ? lookup.instruments.get(toAccount.instrumentId) : null;

            return transaction.entries.map(entry => {
                const category = isDefined(entry.categoryId) ? lookup.categories.get(entry.categoryId) : null;
                const signedAmount = transaction.type === TransactionTypeEnum.EXPENSE ? -entry.amount : entry.amount;
                const mcc = isDefined(entry.mccCategoryId) ? (lookup.mccCategories.get(entry.mccCategoryId)?.mcc ?? '') : '';

                return { ...createExportRow(transaction, toAccount, toInstrument, category, signedAmount), mcc };
            });
        };

        const processTransactionsInBatches = Effect.fn('ExporterService.processTransactionsInBatches')(function* (
            lookup: ExportLookupInterface
        ) {
            const rows: ExportRowInterface[] = [];
            let transactions = yield* transactionRepository.getAllAfter(null, batchSize);

            while (isNotEmptyArray(transactions)) {
                for (const transaction of transactions) {
                    if (transaction.type === TransactionTypeEnum.TRANSFER) {
                        rows.push(mapTransferTransaction(transaction, lookup));
                    } else if (isDefined(transaction.toAccountId)) {
                        rows.push(...mapIncomeExpenseTransaction(transaction, lookup));
                    }
                }

                yield* YIELD_TO_UI;
                transactions = yield* transactionRepository.getAllAfter(transactions[transactions.length - 1].id, batchSize);
            }

            return rows;
        });

        return {
            exportToCsv: Effect.fn('ExporterService.exportToCsv')(function* () {
                const [accounts, deletedAccounts, categories, instruments, mccCategories] = yield* Effect.all(
                    [
                        accountRepository.getAll(),
                        accountRepository.getAllArchived(),
                        categoryRepository.findAllNonSystem(),
                        instrumentRepository.getAll(),
                        mccCategoryRepository.findAll()
                    ],
                    { concurrency: 'unbounded' }
                );

                const rows = yield* processTransactionsInBatches({
                    accounts: toMap([...deletedAccounts, ...accounts]),
                    categories: toMap(categories),
                    instruments: toMap(instruments),
                    mccCategories: toMap(mccCategories)
                });

                return Papa.unparse(rows, { header: true, columns: csvColumns });
            })
        };
    })
}) {
    static readonly layer = Layer.effect(ExporterService, ExporterService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            CategoryRepository.layer,
            InstrumentRepository.layer,
            MccCategoryRepository.layer,
            TransactionRepository.layer
        ])
    );
}
