import {
    AccountEntityInterface,
    AccountRepository,
    CategoryEntityInterface,
    CategoryRepository,
    InstrumentEntityInterface,
    InstrumentRepository,
    MccCategoryEntityInterface,
    MccCategoryRepository,
    TransactionRepository,
    TransactionTypeEnum,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';
import { format } from 'date-fns/format';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import Papa from 'papaparse';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { YIELD_TO_UI } from '../../@generic/constant/yield-to-ui.constant';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { ExportRowInterface } from '../interface/export-row.interface';

export class ExporterService extends Context.Service<ExporterService>()('@budgie/app/ExporterService', {
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
        const accountsMap = new Map<number, AccountEntityInterface>();
        const deletedAccountsMap = new Map<number, AccountEntityInterface>();
        const categoriesMap = new Map<number, CategoryEntityInterface>();
        const instrumentsMap = new Map<number, InstrumentEntityInterface>();
        const mccCategoriesMap = new Map<number, MccCategoryEntityInterface>();

        const fillMap = <T extends { readonly id: number }>(map: Map<number, T>, items: readonly T[]): void => {
            map.clear();
            items.forEach(item => map.set(item.id, item));
        };

        const getAccount = (accountId: number | null | undefined): AccountEntityInterface | null => {
            if (!isDefined(accountId)) {
                return null;
            }

            return accountsMap.get(accountId) ?? deletedAccountsMap.get(accountId) ?? null;
        };

        const mapTransferTransaction = (transaction: TransactionWithEntriesEntityInterface): ExportRowInterface => {
            const entry = transaction.entries.at(0);

            const fromAccount = getAccount(transaction.fromAccountId);
            const toAccount = getAccount(transaction.toAccountId);
            const fromInstrument = isDefined(fromAccount?.instrumentId) ? instrumentsMap.get(fromAccount.instrumentId) : null;
            const toInstrument = isDefined(toAccount?.instrumentId) ? instrumentsMap.get(toAccount.instrumentId) : null;
            const category = isDefined(entry?.categoryId) ? categoriesMap.get(entry.categoryId) : null;

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

        const mapIncomeExpenseTransaction = (transaction: TransactionWithEntriesEntityInterface): ExportRowInterface[] => {
            const toAccount = getAccount(transaction.toAccountId);
            const toInstrument = isDefined(toAccount?.instrumentId) ? instrumentsMap.get(toAccount.instrumentId) : null;

            return transaction.entries.map(entry => {
                const category = isDefined(entry.categoryId) ? categoriesMap.get(entry.categoryId) : null;
                const signedAmount = transaction.type === TransactionTypeEnum.EXPENSE ? -entry.amount : entry.amount;
                const mcc = isDefined(entry.mccCategoryId) ? (mccCategoriesMap.get(entry.mccCategoryId)?.mcc ?? '') : '';

                return { ...createExportRow(transaction, toAccount, toInstrument, category, signedAmount), mcc };
            });
        };

        const processTransactionsInBatches = Effect.fn('ExporterService.processTransactionsInBatches')(function* () {
            const rows: ExportRowInterface[] = [];
            let transactions = yield* transactionRepository.getAllAfter(null, batchSize);

            while (isNotEmptyArray(transactions)) {
                for (const transaction of transactions) {
                    if (transaction.type === TransactionTypeEnum.TRANSFER) {
                        rows.push(mapTransferTransaction(transaction));
                    } else if (isDefined(transaction.toAccountId)) {
                        rows.push(...mapIncomeExpenseTransaction(transaction));
                    }
                }

                yield* YIELD_TO_UI;
                transactions = yield* transactionRepository.getAllAfter(transactions[transactions.length - 1].id, batchSize);
            }

            return rows;
        });

        const exportToCsv = Effect.fn('ExporterService.exportToCsv')(function* () {
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

            fillMap(accountsMap, accounts);
            fillMap(deletedAccountsMap, deletedAccounts);
            fillMap(categoriesMap, categories);
            fillMap(instrumentsMap, instruments);
            fillMap(mccCategoriesMap, mccCategories);

            const rows = yield* processTransactionsInBatches();

            return Papa.unparse(rows, { header: true, columns: csvColumns });
        });

        return {
            saveAndShare: Effect.fn('ExporterService.saveAndShare')(function* () {
                const csvContent = yield* exportToCsv();
                const fileName = `budgie-export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;

                const file = new File(Paths.cache, fileName);
                file.create();
                file.writeSync(csvContent);

                const canShare = yield* Effect.promise(() => isAvailableAsync());
                if (canShare) {
                    yield* Effect.promise(() => shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: fileName }));
                }
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
